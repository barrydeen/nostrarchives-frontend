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
  getPublicKey,
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

  const checkAdmin = useCallback(async (pk: string): Promise<boolean> => {
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

  // Restore session on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && hasNostrExtension()) {
      setPubkey(stored);
      // Re-verify admin status
      checkAdmin(stored).then((admin) => {
        setIsAdmin(admin);
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

    const pk = await getPublicKey();
    setPubkey(pk);
    localStorage.setItem(STORAGE_KEY, pk);

    const admin = await checkAdmin(pk);
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
