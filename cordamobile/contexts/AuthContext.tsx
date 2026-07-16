import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { api, TokenStorage } from "@/lib/api";

interface User {
  id: string;
  name: string;
  email: string;
  image?: string | null;
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (accessToken: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount, try to restore session from stored token
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const token = await TokenStorage.get();
        if (token) {
          const { data } = await api.get("/auth/me");
          setUser(data);
        }
      } catch {
        await TokenStorage.clear();
      } finally {
        setIsLoading(false);
      }
    };

    void restoreSession();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post("/auth/mobile-login", { email, password });
    await TokenStorage.set(data.token);
    setUser(data.user);
  }, []);

  const loginWithGoogle = useCallback(async (accessToken: string) => {
    const { data } = await api.post("/auth/mobile-google", { accessToken });
    await TokenStorage.set(data.token);
    setUser(data.user);
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const { data } = await api.post("/auth/mobile-register", {
        name,
        email,
        password,
      });
      await TokenStorage.set(data.token);
      setUser(data.user);
    },
    []
  );

  const logout = useCallback(async () => {
    await TokenStorage.clear();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        loginWithGoogle,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
