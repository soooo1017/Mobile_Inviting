# 가입 · 비밀번호 메일 설정 (Supabase)

> 2026-11-15. 앱 코드는 이미 맞춰져 있어요. 아래는 **Supabase 대시보드에서 한 번 해 줄 설정**이에요(코드로 바꿀 수 없는 부분).

## 1. 왜 지금은 친구가 가입할 수 없나요?
Supabase 기본 메일 서버는 **프로젝트 팀(조직 멤버)의 메일 주소에만** 보내요. 그 밖의 주소는 `Email address not authorized` 로 실패해요. (그리고 시간당 보낼 수 있는 양도 아주 적어요.) 그래서 친구에게 가입 메일이 안 가요.
→ 아래 **A(권장)** 또는 **B(임시)** 중 하나가 필요해요.

## 2. 해결 방법

### A. 무료 메일 서비스(SMTP)를 연결 — 권장 · 출시 때도 필요
Supabase › Authentication › Emails › **SMTP Settings** 에 메일 서비스의 SMTP 정보를 넣어요. 무료 구간이 있는 서비스: **Brevo**(하루 300통 무료, 도메인 없이 "보내는 사람 메일 주소 하나"만 인증해도 시작 가능), **Resend**(무료, 내 도메인이 있어야 아무에게나 보낼 수 있어요). 둘 다 가입 → SMTP 키 발급 → Supabase에 입력 순서예요.
- 도메인 없이 개인 메일(예: Gmail)을 보내는 사람으로 쓰면 스팸함으로 갈 수 있어요. 테스트 기간엔 괜찮고, 출시 전에 내 도메인으로 바꾸는 걸 권해요.
- 연결하면 처음엔 시간당 30통으로 제한돼요 → Authentication › Rate Limits에서 올려요.
- 연결하면 **메일 제목 · 내용도 한국어로 바꿀 수 있어요**(아래 §3). 이게 한국어 메일의 현실적인 무료 경로예요.

### B. 이메일 인증 끄기 — 테스트 기간만 (가장 빠름)
Authentication › Sign In / Providers › Email › **Confirm email** 끄기. 가입하면 메일 없이 바로 로그인돼요. 단점: 아무 메일 주소로나 가입돼요, 이 기간에는 인증 메일 흐름(그리고 비밀번호 재설정 메일 — 이건 SMTP가 필요해요)을 시험할 수 없어요. **끝나면 다시 켜요.**

> 비밀번호 재설정 메일도 같은 메일 서버를 써요. B만 하면 가입은 되지만 "비밀번호 찾기" 메일은 팀 멤버에게만 가요.

## 3. 한국어 메일 문구
Authentication › Emails › **Templates** 에서 *Confirm sign up* · *Reset password* 의 제목(Subject)과 본문을 바꿔요. (SMTP를 연결해야 바꿀 수 있는 경우가 있어요 — 칸이 잠겨 있으면 §2-A를 먼저 해요.) 아래를 그대로 붙여 넣어요. `{{ .ConfirmationURL }}`은 지우지 마세요.

**가입 확인 (Confirm sign up)** — 제목: `[모이소] 이메일 인증을 완료해 주세요`
```html
<div style="font-family:-apple-system,'Apple SD Gothic Neo','Malgun Gothic',sans-serif;max-width:420px;margin:0 auto;padding:24px;color:#23212a">
  <h2 style="margin:0 0 12px">모이소 가입을 환영해요</h2>
  <p style="line-height:1.6;color:#4f4b56">아래 버튼을 누르면 이메일 인증이 끝나요. 인증 후 앱에서 로그인해 주세요.</p>
  <p style="margin:24px 0"><a href="{{ .ConfirmationURL }}" style="background:#23212a;color:#fff;text-decoration:none;padding:13px 22px;border-radius:10px;font-weight:600;display:inline-block">이메일 인증하기</a></p>
  <p style="font-size:12px;color:#7a7580;line-height:1.6">본인이 가입하지 않았다면 이 메일을 무시해 주세요.</p>
</div>
```

**비밀번호 재설정 (Reset password)** — 제목: `[모이소] 비밀번호 재설정 안내`
```html
<div style="font-family:-apple-system,'Apple SD Gothic Neo','Malgun Gothic',sans-serif;max-width:420px;margin:0 auto;padding:24px;color:#23212a">
  <h2 style="margin:0 0 12px">비밀번호를 다시 설정해요</h2>
  <p style="line-height:1.6;color:#4f4b56">아래 버튼을 누르면 새 비밀번호를 정하는 페이지가 열려요. 링크는 한 번만 쓸 수 있고, 일정 시간이 지나면 만료돼요.</p>
  <p style="margin:24px 0"><a href="{{ .ConfirmationURL }}" style="background:#23212a;color:#fff;text-decoration:none;padding:13px 22px;border-radius:10px;font-weight:600;display:inline-block">새 비밀번호 정하기</a></p>
  <p style="font-size:12px;color:#7a7580;line-height:1.6">본인이 요청하지 않았다면 이 메일을 무시해 주세요. 비밀번호는 바뀌지 않아요.</p>
</div>
```

## 4. Site URL · Redirect URLs (Authentication › URL Configuration)
- **Site URL**: `https://moiso-ten.vercel.app` (하객 페이지가 있는 Vercel 주소 — 메일 링크의 기본 도착지예요. `localhost`면 안 돼요)
- **Redirect URLs**(허용 목록)에 두 개 추가:
  - `https://moiso-ten.vercel.app/reset-password.html` (비밀번호 재설정)
  - `https://moiso-ten.vercel.app/email-confirmed.html` (가입 인증 완료 안내)

## 5. 코드에서 한 일 (이 설정과 짝)
- 비밀번호 재설정 페이지를 GitHub Pages(저장소 이름이 바뀌어 안 열렸어요)에서 **Vercel로 옮김**: `web/public/reset-password.html` → `https://moiso-ten.vercel.app/reset-password.html`. 앱 `AuthContext`의 주소도 바꿨어요. 이제 저장소 이름이 바뀌어도 안 깨져요.
- 가입 확인 메일 링크가 닿는 안내 페이지 `web/public/email-confirmed.html` 추가, 가입할 때 `emailRedirectTo`로 지정.
- Vercel이 최신으로 배포돼야 두 페이지가 열려요(`web/` 푸시 → 자동 배포).
