#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, Vec};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    StakePool,
    LeaderboardAddrs,
    Rep(Address),
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Reputation {
    pub address: Address,
    pub wins: u32,
    pub slashes: u32,
    pub streak: u32,
    pub total_staked: i128,
    pub total_earned: i128,
}

#[contract]
pub struct ReputationLedger;

#[contractimpl]
impl ReputationLedger {
    /// Call once after deploy. `stake_pool` is the only caller allowed for `record_outcome`.
    pub fn init(env: Env, stake_pool: Address) {
        if env.storage().instance().has(&DataKey::StakePool) {
            panic!("already init");
        }
        env.storage().instance().set(&DataKey::StakePool, &stake_pool);
        let addrs: Vec<Address> = Vec::new(&env);
        env.storage().instance().set(&DataKey::LeaderboardAddrs, &addrs);
    }

    /// Called by StakePool when a pool settles.
    pub fn record_outcome(env: Env, member: Address, shipped: bool) {
        let stake_pool: Address = env
            .storage()
            .instance()
            .get(&DataKey::StakePool)
            .expect("not init");
        stake_pool.require_auth();

        let mut rep = Self::get_or_create_rep(&env, member.clone());
        if shipped {
            rep.wins = rep.wins.saturating_add(1);
            rep.streak = rep.streak.saturating_add(1);
        } else {
            rep.slashes = rep.slashes.saturating_add(1);
            rep.streak = 0;
        }
        env.storage()
            .instance()
            .set(&DataKey::Rep(member.clone()), &rep);
        Self::ensure_tracked(&env, member);
    }

    /// Optional economic stats (StakePool may call when settling).
    pub fn add_stake_stats(env: Env, member: Address, staked: i128, earned: i128) {
        let stake_pool: Address = env
            .storage()
            .instance()
            .get(&DataKey::StakePool)
            .expect("not init");
        stake_pool.require_auth();

        let mut rep = Self::get_or_create_rep(&env, member.clone());
        rep.total_staked = rep.total_staked.saturating_add(staked);
        rep.total_earned = rep.total_earned.saturating_add(earned);
        env.storage()
            .instance()
            .set(&DataKey::Rep(member.clone()), &rep);
        Self::ensure_tracked(&env, member);
    }

    pub fn get_reputation(env: Env, member: Address) -> Reputation {
        Self::get_or_create_rep(&env, member)
    }

    pub fn get_leaderboard(env: Env) -> Vec<Reputation> {
        let addrs: Vec<Address> = env
            .storage()
            .instance()
            .get(&DataKey::LeaderboardAddrs)
            .unwrap_or_else(|| Vec::new(&env));
        let mut out: Vec<Reputation> = Vec::new(&env);
        for i in 0..addrs.len() {
            if let Some(a) = addrs.get(i) {
                out.push_back(Self::get_or_create_rep(&env, a));
            }
        }
        out
    }
}

impl ReputationLedger {
    fn get_or_create_rep(env: &Env, member: Address) -> Reputation {
        let key = DataKey::Rep(member.clone());
        env.storage()
            .instance()
            .get(&key)
            .unwrap_or(Reputation {
                address: member.clone(),
                wins: 0,
                slashes: 0,
                streak: 0,
                total_staked: 0,
                total_earned: 0,
            })
    }

    fn ensure_tracked(env: &Env, member: Address) {
        let mut addrs: Vec<Address> = env
            .storage()
            .instance()
            .get(&DataKey::LeaderboardAddrs)
            .unwrap_or_else(|| Vec::new(env));
        for i in 0..addrs.len() {
            if let Some(a) = addrs.get(i) {
                if a == member {
                    return;
                }
            }
        }
        addrs.push_back(member);
        env.storage()
            .instance()
            .set(&DataKey::LeaderboardAddrs, &addrs);
    }
}
