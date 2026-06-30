#![cfg(test)]
extern crate std;

use super::*;
use reputation_ledger::{ReputationLedger, ReputationLedgerClient};
use proof_badge::{ProofBadgeNft, ProofBadgeNftClient};
use soroban_sdk::{
    testutils::{Address as _, Ledger},
    token::{Client as TokenClient, StellarAssetClient},
    Address, Env, String as SorobanString,
};

fn empty_str(env: &Env) -> SorobanString {
    SorobanString::from_str(env, "")
}

fn setup(
    env: &Env,
) -> (
    Address,
    Address,
    Address,
    Address,
    Address,
    StakePoolClient<'_>,
    ProofBadgeNftClient<'_>,
) {
    env.mock_all_auths();

    let admin = Address::generate(env);
    let token_sac = env.register_stellar_asset_contract_v2(admin.clone());
    let token_admin = StellarAssetClient::new(env, &token_sac.address());

    let verifier = Address::generate(env);
    let creator = Address::generate(env);
    token_admin.mint(&creator, &500_000_000_i128);

    let rep_id = env.register(ReputationLedger, ());
    let rep_client = ReputationLedgerClient::new(env, &rep_id);

    let stake_id = env.register(StakePool, ());
    let stake_client = StakePoolClient::new(env, &stake_id);

    let badge_id = env.register(ProofBadgeNft, ());
    let badge_client = ProofBadgeNftClient::new(env, &badge_id);

    rep_client.init(&stake_id);
    badge_client.init(&stake_id);
    stake_client.init(
        &token_sac.address(),
        &rep_id,
        &badge_id,
        &verifier,
    );

    (
        creator,
        token_sac.address(),
        verifier,
        rep_id,
        badge_id,
        stake_client,
        badge_client,
    )
}

#[test]
fn test_stake_and_release() {
    let env = Env::default();
    let (creator, token_id, _verifier, rep_id, _badge_id, client, badge_client) = setup(&env);
    let rep = ReputationLedgerClient::new(&env, &rep_id);

    let goal = SorobanString::from_str(&env, "Ship a Soroban dApp");
    let deadline = env.ledger().timestamp() + 86_400;
    let pool_id = client.create_pool(
        &creator,
        &goal,
        &deadline,
        &10_000_000_i128,
        &60u32,
        &empty_str(&env),
    );

    let a = Address::generate(&env);
    let b = Address::generate(&env);
    let token_admin = StellarAssetClient::new(&env, &token_id);
    token_admin.mint(&a, &50_000_000_i128);
    token_admin.mint(&b, &50_000_000_i128);

    client.stake(&pool_id, &a);
    client.stake(&pool_id, &b);

    let proof = SorobanString::from_str(&env, "https://github.com/example/repo");
    let cid = SorobanString::from_str(&env, "bafyproof123");
    let img = SorobanString::from_str(&env, "bafyimage456");
    client.submit_proof(&pool_id, &a, &proof, &cid, &img);
    client.submit_proof(&pool_id, &b, &proof, &cid, &img);

    client.record_ai_verdict(&pool_id, &a, &75u32);
    client.record_ai_verdict(&pool_id, &b, &75u32);

    client.confirm_peer(&pool_id, &a, &b);
    client.confirm_peer(&pool_id, &b, &a);

    env.ledger().set_timestamp(deadline + 1);
    client.settle_pool(&pool_id);

    let tok = TokenClient::new(&env, &token_id);
    assert!(tok.balance(&a) > 40_000_000_i128);
    assert!(tok.balance(&b) > 40_000_000_i128);

    let ra = rep.get_reputation(&a);
    let rb = rep.get_reputation(&b);
    assert_eq!(ra.wins, 1);
    assert_eq!(rb.wins, 1);

    let ma = client.get_member(&pool_id, &a);
    assert!(ma.shipped);
    assert!(ma.proof_nft_id.is_some());

    let badges = badge_client.get_badges_by_owner(&a);
    assert_eq!(badges.len(), 1);
    assert_eq!(badges.get(0).unwrap().ai_score, 75);
}

#[test]
fn test_slash_on_missed_deadline() {
    let env = Env::default();
    let (creator, token_id, _verifier, rep_id, _badge_id, client, _) = setup(&env);
    let rep = ReputationLedgerClient::new(&env, &rep_id);

    let goal = SorobanString::from_str(&env, "Finish project");
    let deadline = env.ledger().timestamp() + 86_400;
    let pool_id = client.create_pool(
        &creator,
        &goal,
        &deadline,
        &5_000_000_i128,
        &60u32,
        &empty_str(&env),
    );

    let shipper = Address::generate(&env);
    let slacker = Address::generate(&env);
    let token_admin = StellarAssetClient::new(&env, &token_id);
    token_admin.mint(&shipper, &100_000_000_i128);
    token_admin.mint(&slacker, &100_000_000_i128);

    client.stake(&pool_id, &shipper);
    client.stake(&pool_id, &slacker);

    let proof = SorobanString::from_str(&env, "https://github.com/shipper/ok");
    let cid = SorobanString::from_str(&env, "bafyship");
    client.submit_proof(&pool_id, &shipper, &proof, &cid, &empty_str(&env));

    client.record_ai_verdict(&pool_id, &shipper, &80u32);
    client.confirm_peer(&pool_id, &slacker, &shipper);

    env.ledger().set_timestamp(deadline + 1);
    client.settle_pool(&pool_id);

    let tok = TokenClient::new(&env, &token_id);
    assert!(tok.balance(&shipper) > 95_000_000_i128);

    let rs = rep.get_reputation(&shipper);
    let rl = rep.get_reputation(&slacker);
    assert_eq!(rs.wins, 1);
    assert_eq!(rl.slashes, 1);
}

#[test]
fn test_ai_score_below_threshold() {
    let env = Env::default();
    let (creator, token_id, _verifier, rep_id, _badge_id, client, badge_client) = setup(&env);
    let rep = ReputationLedgerClient::new(&env, &rep_id);

    let goal = SorobanString::from_str(&env, "Build a dApp");
    let deadline = env.ledger().timestamp() + 10_000;
    let pool_id = client.create_pool(
        &creator,
        &goal,
        &deadline,
        &8_000_000_i128,
        &60u32,
        &empty_str(&env),
    );

    let m = Address::generate(&env);
    let token_admin = StellarAssetClient::new(&env, &token_id);
    token_admin.mint(&m, &100_000_000_i128);

    client.stake(&pool_id, &m);
    let proof = SorobanString::from_str(&env, "https://github.com/x/y");
    client.submit_proof(&pool_id, &m, &proof, &empty_str(&env), &empty_str(&env));
    client.record_ai_verdict(&pool_id, &m, &30u32);

    env.ledger().set_timestamp(deadline + 1);
    client.settle_pool(&pool_id);

    let r = rep.get_reputation(&m);
    assert_eq!(r.slashes, 1);
    assert_eq!(r.wins, 0);
    assert_eq!(badge_client.total_supply(), 0);
}

#[test]
fn test_pool_cover_cid() {
    let env = Env::default();
    let (creator, _token_id, _verifier, _rep_id, _badge_id, client, _) = setup(&env);

    let cover = SorobanString::from_str(&env, "bafycoverpool");
    let goal = SorobanString::from_str(&env, "Launch NFT feature");
    let deadline = env.ledger().timestamp() + 86_400;
    let pool_id = client.create_pool(
        &creator,
        &goal,
        &deadline,
        &1_000_000_i128,
        &60u32,
        &cover,
    );

    let pool = client.get_pool(&pool_id);
    assert_eq!(pool.cover_cid, Some(cover));
}
