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
};

export type MemberView = {
  address: string;
  staked: boolean;
  proof_url: string | null;
  ai_score: number | null;
  peer_confirmations: number;
  shipped: boolean;
};
