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
  createNip98AuthHeader,
} from "@/lib/nostr-auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.nostrarchives.com";

interface AuthState {
  pubkey: string | null;
  isAdmin: boolean;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState>({
  pubkey: null,
  isAdmin: false,
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkAdmin = useCallback(async (): Promise<boolean> => {
    try {
      const url = `${API_BASE_URL}/v1/admin/check-auth`;
      const authHeader = await createNip98AuthHeader(url, "GET");
      const res = await fetch(url, {
        headers: { Authorization: authHeader },
      });
      if (res.ok) {
        const data = await res.json();
        return data.admin === true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  // Restore session on mount — require signature to prove ownership
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && hasNostrExtension()) {
      // Re-verify ownership by signing a challenge
      verifyKeyOwnership()
        .then((verifiedPk) => {
          if (verifiedPk !== stored) {
            // Key changed or mismatch — clear stale session
            localStorage.removeItem(STORAGE_KEY);
            setLoading(false);
            return;
          }
          setPubkey(verifiedPk);
          return checkAdmin().then((admin) => {
            setIsAdmin(admin);
            setLoading(false);
          });
        })
        .catch(() => {
          // User declined or extension unavailable — clear session
          localStorage.removeItem(STORAGE_KEY);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [checkAdmin]);

  const login = useCallback(async () => {
    if (!hasNostrExtension()) {
      throw new Error(
        "No Nostr browser extension found. Install nos2x or Alby to log in.",
      );
    }

    // Sign a challenge event to prove the user owns the private key
    const pk = await verifyKeyOwnership();
    setPubkey(pk);
    localStorage.setItem(STORAGE_KEY, pk);

    const admin = await checkAdmin();
    setIsAdmin(admin);
  }, [checkAdmin]);

  const logout = useCallback(() => {
    setPubkey(null);
    setIsAdmin(false);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{ pubkey, isAdmin, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
