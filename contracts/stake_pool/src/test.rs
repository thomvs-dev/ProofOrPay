#![cfg(test)]
extern crate std;

use super::*;
use reputation_ledger::{ReputationLedger, ReputationLedgerClient};
use soroban_sdk::{
    testutils::{Address as _, Ledger},
    token::{Client as TokenClient, StellarAssetClient},
    Address, Env, String as SorobanString,
};

fn setup(
    env: &Env,
) -> (Address, Address, Address, Address, StakePoolClient<'_>) {
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

    rep_client.init(&stake_id);
    stake_client.init(&token_sac.address(), &rep_id, &verifier);

    (creator, token_sac.address(), verifier, rep_id, stake_client)
}

#[test]
fn test_stake_and_release() {
    let env = Env::default();
    let (creator, token_id, _verifier, rep_id, client) = setup(&env);
    let rep = ReputationLedgerClient::new(&env, &rep_id);

    let goal = SorobanString::from_str(&env, "Ship a Soroban dApp");
    let deadline = env.ledger().timestamp() + 86_400;
    let pool_id = client.create_pool(&creator, &goal, &deadline, &10_000_000_i128, &60u32);

    let a = Address::generate(&env);
    let b = Address::generate(&env);
    let token_admin = StellarAssetClient::new(&env, &token_id);
    token_admin.mint(&a, &50_000_000_i128);
    token_admin.mint(&b, &50_000_000_i128);

    client.stake(&pool_id, &a);
    client.stake(&pool_id, &b);

    let proof = SorobanString::from_str(&env, "https://github.com/example/repo");
    client.submit_proof(&pool_id, &a, &proof);
    client.submit_proof(&pool_id, &b, &proof);

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
}

#[test]
fn test_slash_on_missed_deadline() {
    let env = Env::default();
    let (creator, token_id, _verifier, rep_id, client) = setup(&env);
    let rep = ReputationLedgerClient::new(&env, &rep_id);

    let goal = SorobanString::from_str(&env, "Finish project");
    let deadline = env.ledger().timestamp() + 86_400;
    let pool_id = client.create_pool(&creator, &goal, &deadline, &5_000_000_i128, &60u32);

    let shipper = Address::generate(&env);
    let slacker = Address::generate(&env);
    let token_admin = StellarAssetClient::new(&env, &token_id);
    token_admin.mint(&shipper, &100_000_000_i128);
    token_admin.mint(&slacker, &100_000_000_i128);

    client.stake(&pool_id, &shipper);
    client.stake(&pool_id, &slacker);

    let proof = SorobanString::from_str(&env, "https://github.com/shipper/ok");
    client.submit_proof(&pool_id, &shipper, &proof);
    // slacker never submits proof

    client.record_ai_verdict(&pool_id, &shipper, &80u32);
    client.confirm_peer(&pool_id, &slacker, &shipper);

    env.ledger().set_timestamp(deadline + 1);
    client.settle_pool(&pool_id);

    let tok = TokenClient::new(&env, &token_id);
    // Shipper should recover stake plus share of slacker's stake
    assert!(tok.balance(&shipper) > 95_000_000_i128);

    let rs = rep.get_reputation(&shipper);
    let rl = rep.get_reputation(&slacker);
    assert_eq!(rs.wins, 1);
    assert_eq!(rl.slashes, 1);
}

#[test]
fn test_ai_score_below_threshold() {
    let env = Env::default();
    let (creator, token_id, _verifier, rep_id, client) = setup(&env);
    let rep = ReputationLedgerClient::new(&env, &rep_id);

    let goal = SorobanString::from_str(&env, "Build a dApp");
    let deadline = env.ledger().timestamp() + 10_000;
    let pool_id = client.create_pool(&creator, &goal, &deadline, &8_000_000_i128, &60u32);

    let m = Address::generate(&env);
    let token_admin = StellarAssetClient::new(&env, &token_id);
    token_admin.mint(&m, &100_000_000_i128);

    client.stake(&pool_id, &m);
    let proof = SorobanString::from_str(&env, "https://github.com/x/y");
    client.submit_proof(&pool_id, &m, &proof);
    client.record_ai_verdict(&pool_id, &m, &30u32);

    env.ledger().set_timestamp(deadline + 1);
    client.settle_pool(&pool_id);

    let r = rep.get_reputation(&m);
    assert_eq!(r.slashes, 1);
    assert_eq!(r.wins, 0);
}
