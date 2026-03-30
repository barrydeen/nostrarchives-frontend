"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  hasNostrExtension,
  verifyKeyOwnership,
} from "@/lib/nostr-auth";
import { fetchProfileMetadata, type NostrProfile } from "@/lib/nostr-relay";

interface AuthState {
  pubkey: string | null;
  profile: NostrProfile | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState>({
  pubkey: null,
  profile: null,
  loading: true,
  login: async () => {},
  logout: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

const STORAGE_KEY = "nostr_pubkey";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [pubkey, setPubkey] = useState<string | null>(null);
  const [profile, setProfile] = useState<NostrProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch profile metadata from relays whenever pubkey changes
  useEffect(() => {
    if (!pubkey) {
      setProfile(null);
      return;
    }
    fetchProfileMetadata(pubkey)
      .then((p) => setProfile(p))
      .catch(() => setProfile(null));
  }, [pubkey]);

  // Restore session on mount — require signature to prove ownership
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && hasNostrExtension()) {
      verifyKeyOwnership()
        .then((verifiedPk) => {
          if (verifiedPk !== stored) {
            localStorage.removeItem(STORAGE_KEY);
            setLoading(false);
            return;
          }
          setPubkey(verifiedPk);
          setLoading(false);
        })
        .catch(() => {
          localStorage.removeItem(STORAGE_KEY);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async () => {
    if (!hasNostrExtension()) {
      throw new Error(
        "No Nostr browser extension found. Install nos2x or Alby to log in.",
      );
    }

    const pk = await verifyKeyOwnership();
    setPubkey(pk);
    localStorage.setItem(STORAGE_KEY, pk);
  }, []);

  const logout = useCallback(() => {
    setPubkey(null);
    setProfile(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{ pubkey, profile, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
