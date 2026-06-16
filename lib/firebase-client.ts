/**
 * Firebase Auth client — matches radhikachain.xyz /login flow
 * GCP project: radhikatmosphere
 */

import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

export interface FirebaseSession {
  uid: string;
  email: string | null;
  provider: string;
  idToken: string;
  address: string;
  chain: "firebase";
  expiresAt: number;
}

const SESSION_KEY = "axiom_firebase_session";
const AUTH_API = process.env.NEXT_PUBLIC_AUTH_API_URL || "https://radhikachain.xyz";

let _app: FirebaseApp | null = null;

export async function loadFirebaseConfig(): Promise<FirebaseConfig> {
  const res = await fetch("/firebase-config.json");
  if (!res.ok) throw new Error("firebase-config.json not found");
  const cfg = await res.json();
  return {
    apiKey: cfg.apiKey,
    authDomain: cfg.authDomain,
    projectId: cfg.projectId,
    storageBucket: cfg.storageBucket,
    messagingSenderId: cfg.messagingSenderId,
    appId: cfg.appId,
    measurementId: cfg.measurementId,
  };
}

function getFirebaseApp(cfg: FirebaseConfig): FirebaseApp {
  if (_app) return _app;
  _app = getApps().length ? getApps()[0] : initializeApp(cfg);
  return _app;
}

export async function signInWithGoogle(): Promise<FirebaseSession> {
  const cfg = await loadFirebaseConfig();
  const app = getFirebaseApp(cfg);
  const auth = getAuth(app);
  const result = await signInWithPopup(auth, new GoogleAuthProvider());
  const idToken = await result.user.getIdToken();

  const verifyRes = await fetch(`${AUTH_API}/api/auth/firebase`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  const data = await verifyRes.json();
  if (!verifyRes.ok) throw new Error(data.error || "Firebase verification failed");

  const session: FirebaseSession = {
    uid: data.uid,
    email: data.email ?? result.user.email,
    provider: data.provider || "firebase",
    idToken,
    address: `firebase:${data.uid}`,
    chain: "firebase",
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
  };

  saveFirebaseSession(session);
  return session;
}

export function saveFirebaseSession(session: FirebaseSession): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function loadFirebaseSession(): FirebaseSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as FirebaseSession;
    if (s.expiresAt && s.expiresAt < Date.now()) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return s;
  } catch {
    return null;
  }
}

export function clearFirebaseSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_KEY);
}