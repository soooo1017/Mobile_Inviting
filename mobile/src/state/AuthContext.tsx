import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export type AuthUser = {
  id: string;
  username: string;
  /** Falls back to the username for accounts created before nicknames existed. */
  nickname: string;
  email: string;
};

export type AuthStatus = 'unknown' | 'guest' | 'authed';

type AuthState = {
  status: AuthStatus;
  user?: AuthUser;
};

export type LoginError = 'invalid_credentials' | 'email_not_confirmed' | 'unknown';
export type SignupError = 'username_taken' | 'email_taken' | 'unknown';
export type PasswordChangeError = 'invalid_current_password' | 'unknown';
export type DeleteAccountError = 'invalid_password' | 'unknown';

// The recovery email's link opens this page (hosted on the project's GitHub
// Pages site, not in the app itself — Expo Go's own address changes every
// dev session, so a deep link back into the app can't reliably round-trip).
// The page completes the whole "set a new password" step in the browser
// using the same Supabase project, then tells the user to log back in here.
const PASSWORD_RESET_REDIRECT_URL = 'https://soooo1017.github.io/Wedding_Mobile_Inviting/reset-password.html';

type AuthContextValue = {
  auth: AuthState;
  /** Logs in with the username chosen at signup (resolved to its email behind the scenes), not the email itself. */
  login: (username: string, password: string) => Promise<{ ok: true } | { ok: false; error: LoginError }>;
  /** Creates the account; Supabase sends a verification email, and sign-in is blocked until it's confirmed. */
  signup: (
    username: string,
    nickname: string,
    email: string,
    password: string,
  ) => Promise<{ ok: true } | { ok: false; error: SignupError }>;
  /** For live "이미 사용 중인 아이디예요" validation while typing, before submitting. */
  /** `null` means the check itself failed (network, paused project, missing function) — not that the name is taken. */
  isUsernameAvailable: (username: string) => Promise<boolean | null>;
  /** Emails a reset link to a page that completes the reset in-browser. Always resolves ok (never reveals whether the email exists). */
  requestPasswordReset: (email: string) => Promise<{ ok: true }>;
  updateNickname: (nickname: string) => Promise<{ ok: true } | { ok: false; error: 'unknown' }>;
  /** Re-verifies currentPassword via sign-in before applying newPassword. */
  changePassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<{ ok: true } | { ok: false; error: PasswordChangeError }>;
  /** Re-verifies password, logs the reason (survives the deleted account), then deletes the account. */
  deleteAccount: (
    password: string,
    reason: string,
    detail: string,
  ) => Promise<{ ok: true } | { ok: false; error: DeleteAccountError }>;
  logout: () => Promise<void>;
  /** Resolves once the persisted session (if any) has been restored. */
  bootstrap: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function userFromSession(session: Session | null): AuthUser | undefined {
  if (!session?.user) return undefined;
  const username = session.user.user_metadata?.username;
  if (typeof username !== 'string' || !username) return undefined;
  const nicknameMeta = session.user.user_metadata?.nickname;
  const nickname = typeof nicknameMeta === 'string' && nicknameMeta ? nicknameMeta : username;
  return { id: session.user.id, username, nickname, email: session.user.email ?? '' };
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
        if (error) {
          console.warn('is_username_available failed:', error.message);
          return null;
        }
        return Boolean(data);
      },
      async signup(username, nickname, email, password) {
        const { data: available, error: availError } = await supabase.rpc('is_username_available', {
          p_username: username,
        });
        if (availError) return { ok: false, error: 'unknown' };
        if (!available) return { ok: false, error: 'username_taken' };

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { username, nickname } },
        });
        if (error) {
          const message = error.message.toLowerCase();
          if (message.includes('already registered')) {
            return { ok: false, error: 'email_taken' };
          }
          // Two signups racing for the same not-yet-taken username both pass the
          // availability check above; the DB's unique index is the real guard,
          // and its violation surfaces here as this generic insert error.
          if (message.includes('duplicate key') || message.includes('profiles_username_lower_idx')) {
            return { ok: false, error: 'username_taken' };
          }
          return { ok: false, error: 'unknown' };
        }
        return { ok: true };
      },
      async requestPasswordReset(email) {
        await supabase.auth.resetPasswordForEmail(email, { redirectTo: PASSWORD_RESET_REDIRECT_URL });
        return { ok: true };
      },
      async updateNickname(nickname) {
        const { data, error } = await supabase.auth.updateUser({ data: { nickname } });
        if (error || !data.user) return { ok: false, error: 'unknown' };
        // Keep profiles.nickname in sync too — the app itself only reads the
        // auth metadata above, but profiles is the record other tooling (and
        // any future admin view) would look at.
        await supabase.from('profiles').update({ nickname }).eq('id', data.user.id);
        return { ok: true };
      },
      async changePassword(currentPassword, newPassword) {
        if (!auth.user) return { ok: false, error: 'unknown' };
        const { error: verifyError } = await supabase.auth.signInWithPassword({
          email: auth.user.email,
          password: currentPassword,
        });
        if (verifyError) return { ok: false, error: 'invalid_current_password' };
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) return { ok: false, error: 'unknown' };
        return { ok: true };
      },
      async deleteAccount(password, reason, detail) {
        if (!auth.user) return { ok: false, error: 'unknown' };
        const { error: verifyError } = await supabase.auth.signInWithPassword({
          email: auth.user.email,
          password,
        });
        if (verifyError) return { ok: false, error: 'invalid_password' };
        // Logged before the delete call: this table has no FK to auth.users,
        // so the row survives the account it's about.
        await supabase.from('account_deletion_feedback').insert({ reason, detail: detail || null });
        const { error } = await supabase.rpc('delete_own_account');
        if (error) return { ok: false, error: 'unknown' };
        await supabase.auth.signOut();
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
