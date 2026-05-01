#!/usr/bin/env node
/**
 * Generate a random Stellar testnet keypair for local use.
 * The G… public key must be the `verifier` passed to StakePool::init on deploy.
 * The S… secret goes in STELLAR_VERIFIER_SECRET_KEY (server-only, never commit).
 *
 * Usage: cd frontend && npm run keypair
 */
import { Keypair } from "@stellar/stellar-sdk";

const k = Keypair.random();
console.log("VERIFIER_PUBLIC (verifier at StakePool init):", k.publicKey());
console.log("STELLAR_VERIFIER_SECRET_KEY (paste into .env.local):", k.secret());
