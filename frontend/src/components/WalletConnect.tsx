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
    if (!kit) {
      setConnectError(ERRORS.WALLET_NOT_FOUND);
      return;
    }
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
      if (
        msg.toLowerCase().includes("not found") ||
        msg.toLowerCase().includes("install")
      ) {
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
      value={{
        kit,
        publicKey,
        isConnected: !!publicKey,
        isConnecting,
        connectError,
        connect,
        disconnect,
        signTransaction,
      }}
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
      className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
        isWallet
          ? "border-amber-700/50 bg-amber-950/40 text-amber-100"
          : "border-red-800/50 bg-red-950/30 text-red-200"
      }`}
    >
      {connectError}
      {isWallet && (
        <span className="block mt-2">
          Install{" "}
          <a
            className="text-stellar-blue underline"
            href="https://www.freighter.app/"
            target="_blank"
            rel="noreferrer"
          >
            Freighter
          </a>{" "}
          or{" "}
          <a
            className="text-stellar-blue underline"
            href="https://xbull.app/"
            target="_blank"
            rel="noreferrer"
          >
            xBull
          </a>
          .
        </span>
      )}
    </div>
  );
}

export default function WalletConnect() {
  const { publicKey, isConnected, isConnecting, connect, disconnect } =
    useWallet();

  if (isConnected && publicKey) {
    const short = `${publicKey.slice(0, 6)}…${publicKey.slice(-4)}`;
    return (
      <div className="flex items-center gap-2 sm:gap-3">
        <span className="text-xs sm:text-sm text-gray-400 font-mono hidden sm:block">
          {short}
        </span>
        <button
          type="button"
          onClick={disconnect}
          className="text-xs sm:text-sm px-3 py-1.5 rounded-lg border border-stellar-border text-gray-300 hover:bg-stellar-card transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={connect}
      disabled={isConnecting}
      className="px-4 py-2 text-sm font-semibold bg-stellar-blue text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {isConnecting ? "Connecting…" : "Connect Wallet"}
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
    <div className="rounded-lg border border-red-900/50 bg-red-950/20 p-3 text-sm text-red-200">
      <p>{ERRORS.INSUFFICIENT_BALANCE}</p>
      <p className="mt-1 text-gray-400">
        Balance: {(Number(currentStroops) / 1e7).toFixed(2)} XLM — required:{" "}
        {(Number(requiredStroops) / 1e7).toFixed(2)} XLM
      </p>
      <a
        href={FAUCET}
        className="mt-2 inline-block text-stellar-blue underline"
        target="_blank"
        rel="noreferrer"
      >
        Testnet faucet
      </a>
    </div>
  );
}
