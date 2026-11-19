# 가입 · 비밀번호 메일 설정 (Supabase)

> **역할**: 가입 · 비밀번호 메일(Supabase + Brevo) 설정 순서와 문제 해결 설명서.
> **최종 확인일**: 2026-11-19 — 앱의 메일 링크 주소(`AuthContext`)와 `web/public/` 안내 페이지가 문서와 맞는 것을 코드로 확인했어요. Supabase · Brevo 대시보드의 실제 설정값은 제가 볼 수 없어서 사용자가 한 설정(Brevo 연결 · 포트 465 · Site URL · Redirect URLs · 한국어 문구)을 기준으로 적었어요(미확인).
> **지금 상태**: Brevo 연결과 가입 · 비밀번호 메일 동작은 끝났어요(§1의 "친구가 가입 못 함" 문제는 해결됨). 남은 일: 보내는 사람이 Gmail이라 메일이 스팸함으로 가서 **도메인 구입 + Brevo 도메인 인증**이 필요해요(할 일은 Notion 할 일 목록).

> 2026-11-15. 앱 코드는 이미 맞춰져 있어요. 아래는 **Supabase 대시보드에서 한 번 해 줄 설정**이에요(코드로 바꿀 수 없는 부분).

## 1. 왜 지금은 친구가 가입할 수 없나요?
Supabase 기본 메일 서버는 **프로젝트 팀(조직 멤버)의 메일 주소에만** 보내요. 그 밖의 주소는 `Email address not authorized` 로 실패해요. (그리고 시간당 보낼 수 있는 양도 아주 적어요.) 그래서 친구에게 가입 메일이 안 가요.
→ 아래 **A(권장)** 또는 **B(임시)** 중 하나가 필요해요.

## 2. 해결 방법

### A. Brevo(무료 SMTP)를 연결 — 정함(2026-11-15) · 출시 때도 필요
Brevo는 이메일을 대신 보내 주는 서비스예요. **무료는 하루 300통**(광고 · 인증 메일 합계)이라 지금은 충분해요.

1. [brevo.com](https://www.brevo.com) 가입.
2. **보내는 사람(Sender) 등록** — Brevo는 2024년부터 도메인 인증(SPF · DKIM · DMARC)을 요구해요. 내 도메인이 있으면 Brevo › Senders, domains & dedicated IPs 에서 도메인을 추가하고 안내하는 DNS 레코드를 도메인 관리 화면에 넣은 뒤, `no-reply@내도메인` 같은 주소를 보내는 사람으로 써요(가장 안정적). 도메인이 없으면 개인 메일 주소 하나를 보내는 사람으로 등록해 볼 수 있는데, **스팸함으로 가거나 막힐 수 있어요**(테스트용으로만, 안 되면 도메인을 사요).
3. **SMTP 키 만들기** — Brevo › SMTP & API › SMTP 탭에서 키를 만들어요. **API 키가 아니라 SMTP 키**예요. 키는 한 번만 보이니 바로 복사해 둬요(채팅 · 저장소에 붙이지 마세요).
4. Supabase › Authentication › Emails › **SMTP Settings** → Enable custom SMTP:
   - Host `smtp-relay.brevo.com` · Port **`465`**(2026-11-15 실제로 587은 시간 초과가 나서 465로 바꿔 해결 — §6-5. 그래도 안 되면 2525)
   - Username: Brevo SMTP 탭에 보이는 **SMTP 로그인** 값
   - Password: 3번의 SMTP 키
   - Sender email: 2번에서 인증한 주소 · Sender name: `모이소`
5. Authentication › **Rate Limits**에서 시간당 메일 수를 올려요(연결 직후 30통/시간).
6. 아래 §3의 한국어 문구를 붙여 넣어요.
7. 시험: 새 계정으로 가입 → 인증 메일(한국어)이 오는지(스팸함도 확인) → 링크 → "이메일 인증이 끝났어요" 페이지.

참고: Edge Function에서는 587 포트가 막혀 Brevo SMTP를 못 쓰지만(HTTP API를 써야 해요), 앱은 Supabase Auth가 보내서 상관없어요. 다른 후보: Resend(내 도메인 필요).

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

## 6. 메일이 안 올 때 점검 순서
1. **이미 가입된 이메일인가?** 인증까지 끝난 주소로 다시 가입하거나 "다시 보내기"를 누르면 Supabase는 오류 없이 성공처럼 답하고 **메일을 보내지 않아요**(가입된 주소를 알아내지 못하게). 새 주소(또는 아직 인증 안 한 주소)로 시험해요. 앱은 이제 이 경우 "이미 가입된 이메일이에요."를 보여줘요. (확인: Supabase › Logs › Auth 에서 `user_repeated_signup`)
2. 스팸함 · 프로모션함.
3. Brevo › Transactional › Logs 에 발송 기록이 있는지(없으면 Supabase SMTP 설정 문제, 있으면 받는 쪽 문제).
4. Supabase › Authentication › Emails › SMTP Settings가 켜져 있고 저장됐는지, Rate Limits.
5. **가입이 10초 넘게 걸리다 "가입 중 문제가 발생했어요"** (2026-11-15 실제 증상): Supabase Auth 로그에 `context deadline exceeded` · `request_timeout`(504)이 10초 간격으로 찍히면 **Supabase가 메일 서버(SMTP)에 연결하다 시간 초과**된 거예요(가입 요청이 메일 발송까지 기다려요). 점검 순서: ① SMTP Settings의 **Port를 587 → 465**(안 되면 2525)로 바꿔 저장 ② Host `smtp-relay.brevo.com` 오타 · Username(SMTP 로그인) · Password(**SMTP 키**, API 키 아님) 확인 ③ Sender email이 Brevo에서 인증됐는지 ④ Brevo › Transactional › Logs에 기록이 생기는지. 앱은 이제 이 경우 "확인 메일을 보내는 데 시간이 걸리고 있어요. 잠시 뒤에 다시 시도해주세요."를 보여줘요.

## 7. 가입 화면 이메일 중복 확인 (2026-11-15, 먼저 Supabase에서 `schema.sql` 11번 실행)
- 이메일을 끝까지 치면 아이디처럼 "사용할 수 있는 이메일이에요 / 이미 가입된 이메일이에요"가 바로 떠요. 서버 함수 `is_email_available`(인증까지 끝난 계정만 "사용 중"으로 봐요)을 써요.
- **SQL을 실행하기 전에는** 이 안내가 안 뜨고 가입은 평소처럼 돼요(이미 가입된 주소는 가입 버튼을 눌렀을 때 "이미 가입된 이메일이에요"). 
- 알아둘 점: 아이디 확인과 같은 방식이라 가입된 이메일인지 알아낼 수 있어요(주소를 하나씩 물어보는 것만 가능). 편의를 위해 받아들인 부분이에요.
- 같은 함수를 **비밀번호 찾기**에도 써요: 가입되지 않은(또는 인증 전인) 이메일이면 "가입되지 않은 이메일이에요. 다시 확인해 주세요."를 보여주고 메일을 보내지 않아요. (인증 전 계정은 재설정이 아니라 가입 메일을 다시 받는 쪽이에요.)
