import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
export type SignupError = 'username_taken' | 'email_taken' | 'mail_failed' | 'unknown';
export type PasswordChangeError = 'invalid_current_password' | 'unknown';
export type DeleteAccountError = 'invalid_password' | 'unknown';

// The recovery email's link opens this page (hosted on the guest website's
// Vercel project — web/public/reset-password.html — not in the app itself;
// the old GitHub Pages address broke when the repository was renamed — Expo Go's own address changes every
// dev session, so a deep link back into the app can't reliably round-trip).
// The page completes the whole "set a new password" step in the browser
// using the same Supabase project, then tells the user to log back in here.
const PASSWORD_RESET_REDIRECT_URL = 'https://moiso-ten.vercel.app/reset-password.html';

// 가입 확인 메일의 링크를 누르면 도착하는 안내 페이지(web/public/email-confirmed.html).
// Supabase › Authentication › URL Configuration › Redirect URLs에 이 주소가 들어 있어야 해요.
const EMAIL_CONFIRMED_REDIRECT_URL = 'https://moiso-ten.vercel.app/email-confirmed.html';

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
    /** 가입 화면에서 고른 선택 동의. 필수 동의(이용약관 · 개인정보)는 가입 버튼이 눌린 시점에 이미 받은 거예요. */
    agreements: { marketing: boolean },
  ) => Promise<{ ok: true } | { ok: false; error: SignupError }>;
  /** For live "이미 사용 중인 아이디예요" validation while typing, before submitting. */
  /** `null` means the check itself failed (network, paused project, missing function) — not that the name is taken. */
  isUsernameAvailable: (username: string) => Promise<boolean | null>;
  /** 인증까지 끝난 계정이 없으면 true. 확인 못 하면(서버 함수가 아직 없거나 연결 문제) null — 그땐 안내 없이 가입을 막지 않아요. */
  isEmailAvailable: (email: string) => Promise<boolean | null>;
  /** Emails a reset link to a page that completes the reset in-browser. Always resolves ok (never reveals whether the email exists). */
  requestPasswordReset: (email: string) => Promise<{ ok: true }>;
  updateNickname: (nickname: string) => Promise<{ ok: true } | { ok: false; error: 'unknown' }>;
  /** Re-verifies currentPassword via sign-in before applying newPassword. */
  changePassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<{ ok: true } | { ok: false; error: PasswordChangeError }>;
  /** 현재 비밀번호가 맞는지만 확인해요(비밀번호 변경 화면에서 칸을 벗어날 때 바로 알려 주려고). 로그인 상태가 아니면 false. */
  verifyPassword: (password: string) => Promise<boolean>;
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

/**
 * 아이디 · 닉네임의 원본은 서버의 profiles 표예요. 로그인 세션 메타데이터(user_metadata)는 가입할 때 한 번 넣은 값이라
 * 닉네임을 바꿔도 따라가지 않아요 — 그래서 화면을 처음 그릴 때만 임시로 쓰고, 곧 폰에 저장해 둔 마지막 값 → 서버 값으로 바꿔요.
 */
type ProfileInfo = { username: string; nickname: string };
const profileCacheKey = (userId: string) => `profile:v1:${userId}`;

async function readCachedProfile(userId: string): Promise<ProfileInfo | null> {
  try {
    const raw = await AsyncStorage.getItem(profileCacheKey(userId));
    if (!raw) return null;
    const v = JSON.parse(raw) as Partial<ProfileInfo>;
    return typeof v.username === 'string' && v.username && typeof v.nickname === 'string' && v.nickname ? { username: v.username, nickname: v.nickname } : null;
  } catch {
    return null;
  }
}

async function writeCachedProfile(userId: string, info: ProfileInfo): Promise<void> {
  try {
    await AsyncStorage.setItem(profileCacheKey(userId), JSON.stringify(info));
  } catch {
    /* 저장이 안 돼도 다음에 서버에서 다시 읽어요 */
  }
}

async function fetchProfile(userId: string): Promise<ProfileInfo | null> {
  try {
    const { data, error } = await supabase.from('profiles').select('username, nickname').eq('id', userId).maybeSingle();
    if (error || !data?.username) return null;
    return { username: data.username, nickname: data.nickname || data.username };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({ status: 'unknown' });

  // 같은 회원이 로그인 중일 때만 아이디 · 닉네임을 바꿔요(그 사이 로그아웃 · 다른 회원이면 무시).
  const applyProfile = useCallback((userId: string, info: ProfileInfo) => {
    setAuth((prev) =>
      prev.status === 'authed' && prev.user?.id === userId && (prev.user.username !== info.username || prev.user.nickname !== info.nickname)
        ? { ...prev, user: { ...prev.user, ...info } }
        : prev,
    );
  }, []);

  const refreshProfile = useCallback(
    async (userId: string) => {
      const cached = await readCachedProfile(userId);
      if (cached) applyProfile(userId, cached);
      const fresh = await fetchProfile(userId);
      if (fresh) {
        applyProfile(userId, fresh);
        void writeCachedProfile(userId, fresh);
      }
    },
    [applyProfile],
  );

  useEffect(() => {
    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      const user = userFromSession(session);
      setAuth({ status: user ? 'authed' : 'guest', user });
      // 이 콜백 안에서 바로 서버를 부르면 Supabase가 멈출 수 있어서 한 박자 뒤에 읽어요.
      if (user && event !== 'TOKEN_REFRESHED') setTimeout(() => void refreshProfile(user.id), 0);
    });
    return () => subscription.subscription.unsubscribe();
  }, [refreshProfile]);

  const value = useMemo<AuthContextValue>(
    () => ({
      auth,
      async bootstrap() {
        const { data } = await supabase.auth.getSession();
        const user = userFromSession(data.session);
        setAuth({ status: user ? 'authed' : 'guest', user });
        if (user) void refreshProfile(user.id);
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
      async isEmailAvailable(email) {
        const { data, error } = await supabase.rpc('is_email_available', { p_email: email.trim() });
        if (error) return null;
        return Boolean(data);
      },
      async signup(username, nickname, email, password, agreements) {
        const { data: available, error: availError } = await supabase.rpc('is_username_available', {
          p_username: username,
        });
        if (availError) return { ok: false, error: 'unknown' };
        if (!available) return { ok: false, error: 'username_taken' };

        const agreedAt = new Date().toISOString();
        const { data: signUpData, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            // 동의한 일시를 계정에 남겨요(필수 2가지는 가입하려면 반드시 동의, 마케팅은 선택).
            data: {
              username,
              nickname,
              agreed_terms_at: agreedAt,
              agreed_privacy_at: agreedAt,
              agreed_marketing: agreements.marketing,
              ...(agreements.marketing ? { agreed_marketing_at: agreedAt } : {}),
            },
            emailRedirectTo: EMAIL_CONFIRMED_REDIRECT_URL,
          },
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
          // 확인 메일을 보내는 단계에서 실패(메일 서버가 느리거나 보내기 한도 초과) — 가입 자체가 틀린 게 아니라서 따로 알려요.
          const status = (error as { status?: number }).status;
          const code = (error as { code?: string }).code;
          if (
            (status !== undefined && status >= 500) ||
            code === 'over_email_send_rate_limit' ||
            code === 'unexpected_failure' ||
            message.includes('sending') ||
            message.includes('timeout')
          ) {
            return { ok: false, error: 'mail_failed' };
          }
          return { ok: false, error: 'unknown' };
        }
        // 이미 가입(인증까지 끝난)된 이메일이면 Supabase는 오류 대신 "성공"처럼 답하고 메일은 보내지 않아요(메일 주소 노출 방지).
        // 그때는 identities가 비어 있어서 그걸로 알아봐요 — 안 그러면 "확인 메일을 보냈어요"만 뜨고 메일이 안 오는 것처럼 보여요.
        if (signUpData.user && (signUpData.user.identities?.length ?? 1) === 0) {
          return { ok: false, error: 'email_taken' };
        }
        return { ok: true };
      },
      async requestPasswordReset(email) {
        await supabase.auth.resetPasswordForEmail(email, { redirectTo: PASSWORD_RESET_REDIRECT_URL });
        return { ok: true };
      },
      async updateNickname(nickname) {
        if (!auth.user) return { ok: false, error: 'unknown' };
        // 닉네임은 profiles 한 곳에만 저장해요(로그인 메타데이터에는 더 이상 쓰지 않아요).
        // select()로 실제로 바뀐 줄이 있는지 확인해요 — 줄이 없거나 권한이 없으면 오류 없이 0줄이 바뀔 수 있어서요.
        const { data, error } = await supabase.from('profiles').update({ nickname }).eq('id', auth.user.id).select('id');
        if (error || !data?.length) return { ok: false, error: 'unknown' };
        const info = { username: auth.user.username, nickname };
        applyProfile(auth.user.id, info);
        void writeCachedProfile(auth.user.id, info);
        return { ok: true };
      },
      async verifyPassword(password) {
        if (!auth.user) return false;
        const { error } = await supabase.auth.signInWithPassword({ email: auth.user.email, password });
        return !error;
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
        await AsyncStorage.removeItem(profileCacheKey(auth.user.id)).catch(() => {});
        await supabase.auth.signOut();
        return { ok: true };
      },
      async logout() {
        if (auth.user) await AsyncStorage.removeItem(profileCacheKey(auth.user.id)).catch(() => {});
        await supabase.auth.signOut();
      },
    }),
    [auth, applyProfile, refreshProfile],
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
