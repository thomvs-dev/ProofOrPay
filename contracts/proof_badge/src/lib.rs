#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, String, Vec};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Minter,
    TokenCount,
    Badge(u64),
    OwnerList(Address),
}

/// Soulbound proof-of-ship NFT minted when a pool member passes settlement.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ProofBadge {
    pub token_id: u64,
    pub pool_id: u64,
    pub owner: Address,
    pub proof_url: String,
    pub proof_cid: String,
    pub image_cid: String,
    pub ai_score: u32,
    pub goal: String,
    pub minted_at: u64,
}

#[contract]
pub struct ProofBadgeNft;

#[contractimpl]
impl ProofBadgeNft {
    /// `minter` is the StakePool contract — only it may mint badges.
    pub fn init(env: Env, minter: Address) {
        if env.storage().instance().has(&DataKey::Minter) {
            panic!("already init");
        }
        env.storage().instance().set(&DataKey::Minter, &minter);
        env.storage().instance().set(&DataKey::TokenCount, &0u64);
    }

    /// Mint a proof badge for a member who shipped. Returns the new token id.
    pub fn mint(
        env: Env,
        to: Address,
        pool_id: u64,
        proof_url: String,
        proof_cid: String,
        image_cid: String,
        ai_score: u32,
        goal: String,
    ) -> u64 {
        let minter: Address = env
            .storage()
            .instance()
            .get(&DataKey::Minter)
            .expect("not init");
        minter.require_auth();

        let id: u64 = env
            .storage()
            .instance()
            .get(&DataKey::TokenCount)
            .unwrap_or(0);

        let badge = ProofBadge {
            token_id: id,
            pool_id,
            owner: to.clone(),
            proof_url,
            proof_cid,
            image_cid,
            ai_score,
            goal,
            minted_at: env.ledger().timestamp(),
        };

        env.storage().persistent().set(&DataKey::Badge(id), &badge);

        let mut list: Vec<u64> = env
            .storage()
            .persistent()
            .get(&DataKey::OwnerList(to.clone()))
            .unwrap_or_else(|| Vec::new(&env));
        list.push_back(id);
        env.storage()
            .persistent()
            .set(&DataKey::OwnerList(to), &list);

        env.storage()
            .instance()
            .set(&DataKey::TokenCount, &(id + 1));
        id
    }

    pub fn get_badge(env: Env, token_id: u64) -> ProofBadge {
        env.storage()
            .persistent()
            .get(&DataKey::Badge(token_id))
            .expect("BadgeNotFound")
    }

    pub fn get_badges_by_owner(env: Env, owner: Address) -> Vec<ProofBadge> {
        let ids: Vec<u64> = env
            .storage()
            .persistent()
            .get(&DataKey::OwnerList(owner))
            .unwrap_or_else(|| Vec::new(&env));
        let mut out = Vec::new(&env);
        for i in 0..ids.len() {
            if let Some(id) = ids.get(i) {
                if let Some(b) = env.storage().persistent().get(&DataKey::Badge(id)) {
                    out.push_back(b);
                }
            }
        }
        out
    }

    pub fn total_supply(env: Env) -> u64 {
        env.storage()
            .instance()
            .get(&DataKey::TokenCount)
            .unwrap_or(0)
    }

    /// Returns image CID when set, else proof CID (frontend prefixes `ipfs://`).
    pub fn token_uri(env: Env, token_id: u64) -> String {
        let badge = Self::get_badge(env, token_id);
        if badge.image_cid.len() > 0 {
            badge.image_cid
        } else {
            badge.proof_cid
        }
    }
}
