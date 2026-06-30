/** Mirrors on-chain Pool / Member (serialized from contract reads). */
export type PoolStatus = "Active" | "Settling" | "Settled";

export type PoolView = {
  pool_id: bigint;
  creator: string;
  goal: string;
  deadline: bigint;
  stake_amount: bigint;
  members: string[];
  status: PoolStatus;
  threshold: number;
  cover_cid: string | null;
};

export type MemberView = {
  address: string;
  staked: boolean;
  proof_url: string | null;
  proof_cid: string | null;
  proof_image_cid: string | null;
  ai_score: number | null;
  peer_confirmations: number;
  shipped: boolean;
  proof_nft_id: bigint | null;
};

export type ProofBadgeView = {
  token_id: bigint;
  pool_id: bigint;
  owner: string;
  proof_url: string;
  proof_cid: string;
  image_cid: string;
  ai_score: number;
  goal: string;
  minted_at: bigint;
};
