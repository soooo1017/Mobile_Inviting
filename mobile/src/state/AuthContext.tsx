import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export type AuthUser = {
  id: string;
  username: string;
  email: string;
};

export type AuthStatus = 'unknown' | 'guest' | 'authed';

type AuthState = {
  status: AuthStatus;
  user?: AuthUser;
};

export type LoginError = 'invalid_credentials' | 'email_not_confirmed' | 'unknown';
export type SignupError = 'username_taken' | 'email_taken' | 'unknown';

type AuthContextValue = {
  auth: AuthState;
  /** Logs in with the username chosen at signup (resolved to its email behind the scenes), not the email itself. */
  login: (username: string, password: string) => Promise<{ ok: true } | { ok: false; error: LoginError }>;
  /** Creates the account; Supabase sends a verification email, and sign-in is blocked until it's confirmed. */
  signup: (
    username: string,
    email: string,
    password: string,
  ) => Promise<{ ok: true } | { ok: false; error: SignupError }>;
  /** For live "이미 사용 중인 아이디예요" validation while typing, before submitting. */
  isUsernameAvailable: (username: string) => Promise<boolean>;
  logout: () => Promise<void>;
  /** Resolves once the persisted session (if any) has been restored. */
  bootstrap: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function userFromSession(session: Session | null): AuthUser | undefined {
  if (!session?.user) return undefined;
  const username = session.user.user_metadata?.username;
  if (typeof username !== 'string' || !username) return undefined;
  return { id: session.user.id, username, email: session.user.email ?? '' };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({ status: 'unknown' });

  useEffect(() => {
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = userFromSession(session);
      setAuth({ status: user ? 'authed' : 'guest', user });
    });
    return () => subscription.subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      auth,
      async bootstrap() {
        const { data } = await supabase.auth.getSession();
        const user = userFromSession(data.session);
        setAuth({ status: user ? 'authed' : 'guest', user });
      },
      async login(username, password) {
        const { data: email, error: lookupError } = await supabase.rpc('email_for_username', {
          p_username: username,
        });
        if (lookupError || !email) {
          return { ok: false, error: 'invalid_credentials' };
        }
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          if (error.message.toLowerCase().includes('email not confirmed')) {
            return { ok: false, error: 'email_not_confirmed' };
          }
          if (error.status === 400) {
            return { ok: false, error: 'invalid_credentials' };
          }
          return { ok: false, error: 'unknown' };
        }
        return { ok: true };
      },
      async isUsernameAvailable(username) {
        if (!username) return false;
        const { data, error } = await supabase.rpc('is_username_available', { p_username: username });
        if (error) return false;
        return Boolean(data);
      },
      async signup(username, email, password) {
        const { data: available, error: availError } = await supabase.rpc('is_username_available', {
          p_username: username,
        });
        if (availError) return { ok: false, error: 'unknown' };
        if (!available) return { ok: false, error: 'username_taken' };

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { username } },
        });
        if (error) {
          if (error.message.toLowerCase().includes('already registered')) {
            return { ok: false, error: 'email_taken' };
          }
          return { ok: false, error: 'unknown' };
        }
        return { ok: true };
      },
      async logout() {
        await supabase.auth.signOut();
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
