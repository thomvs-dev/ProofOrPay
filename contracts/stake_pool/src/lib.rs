#![no_std]

mod reputation_ledger_wasm {
    soroban_sdk::contractimport!(
        file = "../target/wasm32v1-none/release/reputation_ledger.wasm"
    );
}

use reputation_ledger_wasm::Client as ReputationLedgerClient;
use soroban_sdk::{
    contract, contractimpl, contracttype, token, Address, Env, String, Vec,
};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DataKey {
    Pool(u64),
    Member(u64, Address),
    PoolCount,
    Token,
    ReputationContract,
    Verifier,
    /// One confirmation per (pool, confirmer, confirmee) pair.
    PeerConfirm(u64, Address, Address),
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum PoolStatus {
    Active,
    Settling,
    Settled,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Pool {
    pub pool_id: u64,
    pub creator: Address,
    pub goal: String,
    pub deadline: u64,
    pub stake_amount: i128,
    pub members: Vec<Address>,
    pub status: PoolStatus,
    pub threshold: u32,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Member {
    pub address: Address,
    pub staked: bool,
    pub proof_url: Option<String>,
    pub ai_score: Option<u32>,
    pub peer_confirmations: u32,
    pub shipped: bool,
}

#[contract]
pub struct StakePool;

#[contractimpl]
impl StakePool {
    /// Wire XLM SAC, ReputationLedger contract, and off-chain AI verifier address.
    pub fn init(env: Env, token: Address, reputation: Address, verifier: Address) {
        if env.storage().instance().has(&DataKey::Token) {
            panic!("already init");
        }
        env.storage().instance().set(&DataKey::Token, &token);
        env.storage().instance().set(&DataKey::ReputationContract, &reputation);
        env.storage().instance().set(&DataKey::Verifier, &verifier);
        env.storage().persistent().set(&DataKey::PoolCount, &0u64);
    }

    pub fn create_pool(
        env: Env,
        creator: Address,
        goal: String,
        deadline: u64,
        stake_amount: i128,
        threshold: u32,
    ) -> u64 {
        creator.require_auth();
        assert!(stake_amount > 0, "InvalidStake");
        assert!(deadline > env.ledger().timestamp(), "DeadlinePast");

        let id: u64 = env
            .storage()
            .persistent()
            .get(&DataKey::PoolCount)
            .unwrap_or(0);
        let pool = Pool {
            pool_id: id,
            creator: creator.clone(),
            goal,
            deadline,
            stake_amount,
            members: Vec::new(&env),
            status: PoolStatus::Active,
            threshold,
        };
        env.storage().persistent().set(&DataKey::Pool(id), &pool);
        env.storage()
            .persistent()
            .set(&DataKey::PoolCount, &(id + 1));
        id
    }

    /// Join pool and lock stake.
    pub fn stake(env: Env, pool_id: u64, member: Address) {
        member.require_auth();
        let mut pool: Pool = env
            .storage()
            .persistent()
            .get(&DataKey::Pool(pool_id))
            .expect("PoolNotFound");
        assert!(pool.status == PoolStatus::Active, "PoolNotActive");
        assert!(env.ledger().timestamp() < pool.deadline, "DeadlinePassed");

        let token: Address = env
            .storage()
            .instance()
            .get(&DataKey::Token)
            .expect("not init");
        let tok = token::Client::new(&env, &token);
        tok.transfer(
            &member,
            &env.current_contract_address(),
            &pool.stake_amount,
        );

        if !Self::addr_in_vec(&pool.members, &member) {
            pool.members.push_back(member.clone());
        }

        let mut m = Self::get_member_internal(&env, pool_id, member.clone());
        assert!(!m.staked, "AlreadyStaked");
        m.staked = true;
        m.address = member.clone();

        env.storage().persistent().set(&DataKey::Pool(pool_id), &pool);
        env.storage()
            .persistent()
            .set(&DataKey::Member(pool_id, member), &m);
    }

    pub fn submit_proof(env: Env, pool_id: u64, member: Address, proof_url: String) {
        member.require_auth();
        let pool: Pool = env
            .storage()
            .persistent()
            .get(&DataKey::Pool(pool_id))
            .expect("PoolNotFound");
        assert!(pool.status == PoolStatus::Active, "PoolNotActive");

        let mut m = Self::get_member_internal(&env, pool_id, member.clone());
        assert!(m.staked, "NotStaked");
        m.proof_url = Some(proof_url);
        env.storage()
            .persistent()
            .set(&DataKey::Member(pool_id, member), &m);
    }

    /// AI verifier backend submits score after off-chain evaluation.
    pub fn record_ai_verdict(env: Env, pool_id: u64, member: Address, score: u32) {
        let verifier: Address = env
            .storage()
            .instance()
            .get(&DataKey::Verifier)
            .expect("not init");
        verifier.require_auth();

        let _pool: Pool = env
            .storage()
            .persistent()
            .get(&DataKey::Pool(pool_id))
            .expect("PoolNotFound");

        let mut m = Self::get_member_internal(&env, pool_id, member.clone());
        m.ai_score = Some(score);
        env.storage()
            .persistent()
            .set(&DataKey::Member(pool_id, member), &m);
    }

    /// Peer confirms another member shipped.
    pub fn confirm_peer(env: Env, pool_id: u64, confirmer: Address, confirmee: Address) {
        confirmer.require_auth();
        assert!(confirmer != confirmee, "SelfConfirm");

        let pool: Pool = env
            .storage()
            .persistent()
            .get(&DataKey::Pool(pool_id))
            .expect("PoolNotFound");
        assert!(pool.status == PoolStatus::Active, "PoolNotActive");
        assert!(
            Self::addr_in_vec(&pool.members, &confirmer)
                && Self::addr_in_vec(&pool.members, &confirmee),
            "NotMember"
        );

        let seen: bool = env
            .storage()
            .persistent()
            .get(&DataKey::PeerConfirm(pool_id, confirmer.clone(), confirmee.clone()))
            .unwrap_or(false);
        assert!(!seen, "AlreadyConfirmed");

        env.storage().persistent().set(
            &DataKey::PeerConfirm(pool_id, confirmer, confirmee.clone()),
            &true,
        );

        let mut m = Self::get_member_internal(&env, pool_id, confirmee.clone());
        m.peer_confirmations = m.peer_confirmations.saturating_add(1);
        env.storage()
            .persistent()
            .set(&DataKey::Member(pool_id, confirmee), &m);
    }

    /// After deadline: release stakes to successful members or slash and redistribute.
    pub fn settle_pool(env: Env, pool_id: u64) {
        let mut pool: Pool = env
            .storage()
            .persistent()
            .get(&DataKey::Pool(pool_id))
            .expect("PoolNotFound");
        assert!(pool.status == PoolStatus::Active, "PoolNotActive");
        assert!(
            env.ledger().timestamp() >= pool.deadline,
            "DeadlineNotReached"
        );

        pool.status = PoolStatus::Settling;
        env.storage().persistent().set(&DataKey::Pool(pool_id), &pool);

        let token: Address = env
            .storage()
            .instance()
            .get(&DataKey::Token)
            .expect("not init");
        let reputation: Address = env
            .storage()
            .instance()
            .get(&DataKey::ReputationContract)
            .expect("not init");
        let rep = ReputationLedgerClient::new(&env, &reputation);
        let tok = token::Client::new(&env, &token);

        let stake_amt = pool.stake_amount;
        let threshold = pool.threshold;
        let member_count = pool.members.len();

        let mut shippers = Vec::new(&env);
        let mut non_shippers = Vec::new(&env);

        for i in 0..member_count {
            let addr = pool.members.get(i).expect("member");
            let m = Self::get_member_internal(&env, pool_id, addr.clone());
            if !m.staked {
                continue;
            }
            let min_peer = if member_count <= 1 { 0u32 } else { 1u32 };
            let score_ok = m
                .ai_score
                .map(|s| s >= threshold)
                .unwrap_or(false);
            let peer_ok = m.peer_confirmations >= min_peer;
            let has_proof = m.proof_url.is_some();
            let passed = has_proof && score_ok && peer_ok;

            if passed {
                shippers.push_back(addr.clone());
            } else {
                non_shippers.push_back(addr.clone());
            }
        }

        let slash_total: i128 = (non_shippers.len() as i128).saturating_mul(stake_amt);
        let win_n = shippers.len() as i128;
        let bonus_each: i128 = if win_n > 0 {
            slash_total / win_n
        } else {
            0
        };
        let _remainder: i128 = if win_n > 0 {
            slash_total % win_n
        } else {
            0
        };

        for i in 0..non_shippers.len() {
            let addr = non_shippers.get(i).expect("ns");
            rep.record_outcome(&addr, &false);
        }

        for i in 0..shippers.len() {
            let addr = shippers.get(i).expect("sp");
            let pay = stake_amt.saturating_add(bonus_each);
            tok.transfer(&env.current_contract_address(), &addr, &pay);
            rep.record_outcome(&addr, &true);
        }

        pool.status = PoolStatus::Settled;
        env.storage().persistent().set(&DataKey::Pool(pool_id), &pool);
    }

    pub fn get_pool(env: Env, pool_id: u64) -> Pool {
        env.storage()
            .persistent()
            .get(&DataKey::Pool(pool_id))
            .expect("PoolNotFound")
    }

    pub fn get_member(env: Env, pool_id: u64, member: Address) -> Member {
        Self::get_member_internal(&env, pool_id, member)
    }

    pub fn get_all_pools(env: Env) -> Vec<Pool> {
        let count: u64 = env
            .storage()
            .persistent()
            .get(&DataKey::PoolCount)
            .unwrap_or(0);
        let mut out = Vec::new(&env);
        for id in 0..count {
            if let Some(p) = env.storage().persistent().get(&DataKey::Pool(id)) {
                out.push_back(p);
            }
        }
        out
    }
}

impl StakePool {
    fn get_member_internal(env: &Env, pool_id: u64, member: Address) -> Member {
        env.storage()
            .persistent()
            .get(&DataKey::Member(pool_id, member.clone()))
            .unwrap_or(Member {
                address: member.clone(),
                staked: false,
                proof_url: None,
                ai_score: None,
                peer_confirmations: 0,
                shipped: false,
            })
    }

    fn addr_in_vec(v: &Vec<Address>, a: &Address) -> bool {
        for i in 0..v.len() {
            if let Some(x) = v.get(i) {
                if x == *a {
                    return true;
                }
            }
        }
        false
    }
}

mod test;
