import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

export type AuthUser = {
  name: string;
  email: string;
  provider: 'password' | 'kakao' | 'apple';
};

export type AuthStatus = 'unknown' | 'guest' | 'authed';

type AuthState = {
  status: AuthStatus;
  user?: AuthUser;
};

type AuthContextValue = {
  auth: AuthState;
  /** Mock login — no backend yet. Any email works with password "password123". */
  login: (email: string, password: string) => Promise<{ ok: true } | { ok: false; error: 'invalid_credentials' }>;
  loginWithProvider: (provider: 'kakao' | 'apple') => Promise<{ ok: true }>;
  signup: (email: string, password: string) => Promise<{ ok: true }>;
  logout: () => void;
  /** Resolves once the initial session check finishes (always "guest" for now). */
  bootstrap: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const MOCK_VALID_PASSWORD = 'password123';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({ status: 'unknown' });

  const value = useMemo<AuthContextValue>(
    () => ({
      auth,
      async bootstrap() {
        // No persisted session store yet — every cold start is a guest.
        setAuth({ status: 'guest' });
      },
      async login(email, password) {
        if (password !== MOCK_VALID_PASSWORD) {
          return { ok: false, error: 'invalid_credentials' };
        }
        setAuth({ status: 'authed', user: { name: email.split('@')[0], email, provider: 'password' } });
        return { ok: true };
      },
      async loginWithProvider(provider) {
        setAuth({
          status: 'authed',
          user: { name: provider === 'kakao' ? '카카오유저' : 'Apple유저', email: '', provider },
        });
        return { ok: true };
      },
      async signup(email) {
        setAuth({ status: 'authed', user: { name: email.split('@')[0], email, provider: 'password' } });
        return { ok: true };
      },
      logout() {
        setAuth({ status: 'guest' });
      },
    }),
    [auth],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
