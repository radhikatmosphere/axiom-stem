"use client";

import { useState } from "react";
import { Wallet, LogOut } from "lucide-react";

const AUTH_API = process.env.NEXT_PUBLIC_AUTH_API_URL || "https://radhikachain.xyz";

interface WalletConnectProps {
  onConnect: (address: string) => void;
  onDisconnect: () => void;
  address?: string;
}

export default function WalletConnect({ onConnect, onDisconnect, address }: WalletConnectProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function connect() {
    setLoading(true);
    setError(null);
    try {
      const eth = (window as Window & { ethereum?: { request: (args: { method: string; params?: string[] }) => Promise<string[]> } }).ethereum;
      if (!eth) {
        setError("Install MetaMask or use RadhikaChain wallet");
        setLoading(false);
        return;
      }

      const accounts = await eth.request({ method: "eth_requestAccounts" });
      const addr = accounts[0];
      if (!addr) throw new Error("No account");

      onConnect(addr);

      try {
        const nonceRes = await fetch(`${AUTH_API}/api/auth/nonce?address=${addr}`);
        if (nonceRes.ok) {
          // SIWE flow available — wallet linked for Bhakti lookup
        }
      } catch {
        // Bhakti lookup works with address alone
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Connection failed");
    } finally {
      setLoading(false);
    }
  }

  if (address) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono text-cyan/80 truncate max-w-[120px]">
          {address.slice(0, 6)}…{address.slice(-4)}
        </span>
        <button onClick={onDisconnect} className="axiom-btn-secondary p-2" title="Disconnect">
          <LogOut size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button onClick={connect} disabled={loading} className="axiom-btn-secondary flex items-center gap-2 text-sm">
        <Wallet size={14} />
        {loading ? "Connecting…" : "Link Wallet"}
      </button>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}