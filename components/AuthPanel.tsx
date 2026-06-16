"use client";

import { useState } from "react";
import { Wallet, LogOut, Mail } from "lucide-react";
import { signInWithGoogle, clearFirebaseSession, type FirebaseSession } from "@/lib/firebase-client";

const AUTH_API = process.env.NEXT_PUBLIC_AUTH_API_URL || "https://radhikachain.xyz";

export interface AuthUser {
  address: string;
  chain: "wallet" | "firebase";
  email?: string | null;
  uid?: string;
}

interface AuthPanelProps {
  user?: AuthUser;
  onConnect: (user: AuthUser) => void;
  onDisconnect: () => void;
}

export default function AuthPanel({ user, onConnect, onDisconnect }: AuthPanelProps) {
  const [loading, setLoading] = useState<"wallet" | "google" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function connectWallet() {
    setLoading("wallet");
    setError(null);
    try {
      const eth = (window as Window & { ethereum?: { request: (args: { method: string; params?: string[] }) => Promise<string[]> } }).ethereum;
      if (!eth) {
        setError("Install MetaMask or sign in with Google");
        return;
      }
      const accounts = await eth.request({ method: "eth_requestAccounts" });
      const addr = accounts[0];
      if (!addr) throw new Error("No account");
      onConnect({ address: addr, chain: "wallet" });
      try {
        await fetch(`${AUTH_API}/api/auth/nonce?address=${addr}`);
      } catch { /* optional SIWE */ }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Wallet connection failed");
    } finally {
      setLoading(null);
    }
  }

  async function connectGoogle() {
    setLoading("google");
    setError(null);
    try {
      const session: FirebaseSession = await signInWithGoogle();
      onConnect({
        address: session.address,
        chain: "firebase",
        email: session.email,
        uid: session.uid,
      });
    } catch (e) {
      const err = e as { code?: string; message?: string };
      const msg =
        err.code === "auth/popup-closed-by-user"
          ? "Sign-in cancelled"
          : err.message || "Google sign-in failed";
      setError(msg);
    } finally {
      setLoading(null);
    }
  }

  function disconnect() {
    if (user?.chain === "firebase") clearFirebaseSession();
    onDisconnect();
  }

  if (user) {
    const label =
      user.chain === "firebase"
        ? user.email?.split("@")[0] ?? "Google"
        : `${user.address.slice(0, 6)}…${user.address.slice(-4)}`;

    return (
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono text-cyan/80 truncate max-w-[140px]" title={user.email ?? user.address}>
          {user.chain === "firebase" && <Mail size={10} className="inline mr-1" />}
          {label}
        </span>
        <button onClick={disconnect} className="axiom-btn-secondary p-2" title="Sign out">
          <LogOut size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-2">
        <button
          onClick={connectGoogle}
          disabled={!!loading}
          className="axiom-btn-primary flex items-center gap-1.5 text-xs px-3 py-1.5"
        >
          <Mail size={12} />
          {loading === "google" ? "…" : "Google"}
        </button>
        <button
          onClick={connectWallet}
          disabled={!!loading}
          className="axiom-btn-secondary flex items-center gap-1.5 text-xs px-3 py-1.5"
        >
          <Wallet size={12} />
          {loading === "wallet" ? "…" : "Wallet"}
        </button>
      </div>
      {error && <span className="text-xs text-red-400 max-w-[200px] text-right">{error}</span>}
      <a href={`${AUTH_API}/login`} className="text-[10px] text-white/30 hover:text-cyan">
        Full sign-in on radhikachain.xyz →
      </a>
    </div>
  );
}