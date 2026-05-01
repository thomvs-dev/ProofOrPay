"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { createWalletKit } from "@/lib/wallets";
import { ERRORS } from "@/lib/errors";

const FAUCET =
  "https://developers.stellar.org/docs/fundamentals-and-concepts/testnet-and-pubnet";

interface WalletContextType {
  kit: ReturnType<typeof createWalletKit> | null;
  publicKey: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  connectError: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  signTransaction: (xdr: string) => Promise<string>;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [kit, setKit] = useState<ReturnType<typeof createWalletKit> | null>(null);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  useEffect(() => {
    setKit(createWalletKit());
    const saved = localStorage.getItem("onchain_account_pubkey");
    if (saved) setPublicKey(saved);
  }, []);

  const connect = useCallback(async () => {
    if (!kit) { setConnectError(ERRORS.WALLET_NOT_FOUND); return; }
    setIsConnecting(true);
    setConnectError(null);
    try {
      await kit.openModal({
        onWalletSelected: async (option) => {
          try {
            kit.setWallet(option.id);
            const { address } = await kit.getAddress();
            setPublicKey(address);
            localStorage.setItem("onchain_account_pubkey", address);
          } catch {
            setConnectError(ERRORS.USER_REJECTED);
          }
        },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.toLowerCase().includes("not found") || msg.toLowerCase().includes("install")) {
        setConnectError(ERRORS.WALLET_NOT_FOUND);
      } else {
        setConnectError(ERRORS.USER_REJECTED);
      }
    } finally {
      setIsConnecting(false);
    }
  }, [kit]);

  const disconnect = useCallback(() => {
    setPublicKey(null);
    localStorage.removeItem("onchain_account_pubkey");
  }, []);

  const signTransaction = useCallback(
    async (xdrIn: string): Promise<string> => {
      if (!kit || !publicKey) throw new Error(ERRORS.WALLET_NOT_CONNECTED);
      const { signedTxXdr } = await kit.signTransaction(xdrIn, {
        networkPassphrase: "Test SDF Network ; September 2015",
        address: publicKey,
      });
      return signedTxXdr;
    },
    [kit, publicKey],
  );

  return (
    <WalletContext.Provider
      value={{ kit, publicKey, isConnected: !!publicKey, isConnecting, connectError, connect, disconnect, signTransaction }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}

export function WalletBanner() {
  const { connectError } = useWallet();
  if (!connectError) return null;
  const isWallet = connectError === ERRORS.WALLET_NOT_FOUND;
  return (
    <div
      className={`mb-4 border-3 p-4 text-sm font-bold ${
        isWallet
          ? "border-nb-orange bg-nb-card text-nb-orange"
          : "border-nb-red bg-nb-card text-nb-red"
      }`}
      style={{ boxShadow: isWallet ? "4px 4px 0 #FF6B35" : "4px 4px 0 #FF3B3B" }}
    >
      {connectError}
      {isWallet && (
        <span className="block mt-2 font-normal text-nb-muted">
          Install{" "}
          <a className="text-nb-yellow underline" href="https://www.freighter.app/" target="_blank" rel="noreferrer">
            Freighter
          </a>{" "}
          or{" "}
          <a className="text-nb-yellow underline" href="https://xbull.app/" target="_blank" rel="noreferrer">
            xBull
          </a>
          .
        </span>
      )}
    </div>
  );
}

export default function WalletConnect() {
  const { publicKey, isConnected, isConnecting, connect, disconnect } = useWallet();

  if (isConnected && publicKey) {
    const short = `${publicKey.slice(0, 6)}…${publicKey.slice(-4)}`;
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono text-nb-muted hidden sm:block">{short}</span>
        <button
          type="button"
          onClick={disconnect}
          className="text-xs font-black uppercase border-2 border-white px-3 py-1.5 text-white hover:border-nb-red hover:text-nb-red transition-all"
        >
          DISCONNECT
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={connect}
      disabled={isConnecting}
      className="nb-btn-yellow text-xs disabled:opacity-50"
    >
      {isConnecting ? "CONNECTING…" : "CONNECT WALLET"}
    </button>
  );
}

export function BalanceHint({
  requiredStroops,
  currentStroops,
}: {
  requiredStroops: bigint;
  currentStroops: bigint;
}) {
  if (currentStroops >= requiredStroops) return null;
  return (
    <div className="border-3 border-nb-red p-3 text-sm" style={{ boxShadow: "3px 3px 0 #FF3B3B" }}>
      <p className="font-black text-nb-red uppercase">{ERRORS.INSUFFICIENT_BALANCE}</p>
      <p className="mt-1 text-nb-muted font-mono text-xs">
        Balance: {(Number(currentStroops) / 1e7).toFixed(2)} XLM — need:{" "}
        {(Number(requiredStroops) / 1e7).toFixed(2)} XLM
      </p>
      <a href={FAUCET} className="mt-2 inline-block text-nb-yellow underline font-bold text-xs" target="_blank" rel="noreferrer">
        GET TESTNET XLM →
      </a>
    </div>
  );
}
