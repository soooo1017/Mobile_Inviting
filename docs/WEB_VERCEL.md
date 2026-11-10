# 하객용 웹 페이지 (Vercel) 시작하기

> 2026-11-10 시작. 하객은 앱이 아니라 **링크**로 초대장을 열어요. 그 웹 페이지를 `web/` 폴더(Next.js)에 만들고 Vercel에 올려요. 데이터와 로그인은 Supabase(`docs/SERVER_STORAGE.md`).

## 1. 지금 상태
- ✅ **배포 완료 (2026-11-10)**: https://moiso-ten.vercel.app — `/`(소개)와 `/아무글자`("아직 준비 중인 초대장이에요") 모두 확인. ※ 이후 앱의 링크 모양(`주소/i/<뒷부분>`)에 맞춰 하객 페이지 주소를 `/i/<뒷부분>`으로 옮겼어요(2026-11-10). 이후 브랜치에 푸시하면 Vercel이 자동으로 다시 배포해요.
- `web/`에 Next.js 앱 뼈대가 있어요: `/`(서비스 소개 한 줄), `/i/<주소>`(서버에서 읽어 — 없는 주소 · 작성 중인 주소는 `/`로 보내고, 공유 중이면 이름 · 일시, 공유가 끝났거나 행사가 끝났으면 안내).
- 서버(Supabase)에 초대장이 아직 없어서 모든 링크가 "준비 중"으로 보여요. 연결하는 건 다음 단계.
- 왜 Next.js: `/<주소>` 하나로 모든 초대장을 보여주는 구조가 쉽고, 나중에 링크마다 서버에서 내용을 만들 수 있어요. **카카오톡 링크 미리보기(제목 · 사진)는 지금 단계에서는 하지 않기로 했어요(2026-11-10)** — 필요해지면 그때 `generateMetadata`로 추가해요.

## 2. 내가 할 일 (사용자) — 처음부터
1. **GitHub 계정으로 Vercel 가입**: vercel.com → Sign Up → "Continue with GitHub". 무료 Hobby 플랜(개인 · 비상업 용도 기준)으로 시작해요. **유료 서비스를 시작할 때는 상업 이용 약관(Pro 플랜)을 확인**해요.
2. **저장소 연결**: Vercel 대시보드 → Add New… → Project → 이 저장소 선택(권한 요청이 뜨면 허용).
3. **설정 두 가지**
   - **Root Directory: `web`** (저장소 맨 위가 아니라 web 폴더)
   - Framework Preset: Next.js (자동으로 잡혀요)
   - 나머지(빌드 명령 · 출력 폴더 · 설치 명령 · 환경변수)는 **비워 두기**. 환경변수는 Supabase를 연결할 때 넣어요.
4. **Production Branch**: 지금 저장소에는 `main`이 없고 작업 브랜치(`claude/inspiring-mendel-ksvase`)만 있어요. Project → Settings → Git → Production Branch에 그 브랜치 이름을 넣거나, `main`을 만든 뒤 `main`으로 해요.
5. **Deploy** → 주소(`https://프로젝트이름.vercel.app`)가 생겨요. `…/i/아무글자`를 열어 "아직 준비 중인 초대장이에요"가 보이면 성공.

## 3. 다음 단계 (순서)
1. Supabase에서 `supabase/schema.sql` **9번(서버 저장)** 실행 — 표는 만들어 뒀어요(`docs/SERVER_STORAGE.md` §13)
2. 앱이 초대장을 만들 때부터 서버에 저장하고(작성 중 draft), [공유 시작]을 누르면 하객에게 열기
3. `/i/[slug]`가 Supabase에서 초대장을 읽어 앱 미리보기와 같은 모양으로 그리기 (환경변수: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Vercel Settings → Environment Variables)
4. 참석 응답 · 방명록 남기기, 방문 통계(익명 숫자), 감사페이지 자동 전환
5. 공유 전 방문 처리(주인은 미리보기, 다른 사람은 "준비 중") — `SERVER_STORAGE.md` §9
6. 내 도메인 연결(선택): Vercel → Settings → Domains

## 4. 로컬에서 돌려보기
```bash
cd ~/Desktop/Wedding_Mobile_Inviting/web
npm install
npm run dev     # http://localhost:3000/i/아무글자
```

## 5. 주의
- 비밀 키(Supabase service role 등)는 절대 `NEXT_PUBLIC_`으로 시작하는 변수나 git에 넣지 않아요. 브라우저에 노출되는 건 anon 키뿐이고, 보호는 RLS가 해요.
- `web/.env*.local`은 git에서 제외돼 있어요.

## 6. 서버(Supabase) 연결 값 넣기 (2026-11-10)
하객 페이지가 초대장을 읽으려면 Vercel에 Supabase 값 두 개가 필요해요. **안 넣으면 모든 `/i/<주소>`가 `/`로 가요**(열 수 있는 초대장이 없는 것과 같아요).
1. Vercel → 프로젝트 → **Settings → Environment Variables**
2. `NEXT_PUBLIC_SUPABASE_URL` = 앱 `mobile/.env`의 `EXPO_PUBLIC_SUPABASE_URL` 값
3. `NEXT_PUBLIC_SUPABASE_ANON_KEY` = 앱 `mobile/.env`의 `EXPO_PUBLIC_SUPABASE_ANON_KEY` 값 (anon 키는 공개해도 되는 키예요 — `service_role` 키는 절대 넣지 않아요)
4. Environments는 Production · Preview 모두 체크 → Save → **Deployments에서 Redeploy** (값을 바꾼 뒤엔 다시 배포해야 반영돼요)
- 로컬에서는 `web/.env.local`에 같은 두 줄을 넣어요(`web/.env.example` 참고).
- **동작**: `/i/<주소>`는 서버의 `get_public_invitation`을 불러요 → 없는 주소 · 작성 중 → **`/`(서비스 첫 화면)로 이동**(둘을 똑같이 처리해서 누가 쓰는 주소인지 알 수 없어요) / 공유 중 → 초대장(지금은 이름 · 일시만) / 공유 중지 → "공유가 끝난 초대장이에요" / 행사 끝 → "행사가 끝난 초대장이에요" / 서버 오류 → "잠시 후 다시 열어주세요".
