# 하객용 웹 페이지 (Vercel) 시작하기

> 2026-11-10 시작. 하객은 앱이 아니라 **링크**로 초대장을 열어요. 그 웹 페이지를 `web/` 폴더(Next.js)에 만들고 Vercel에 올려요. 데이터와 로그인은 Supabase(`docs/SERVER_STORAGE.md`).

## 1. 지금 상태
- ✅ **배포 완료 (2026-11-10)**: https://moiso-ten.vercel.app — `/`(소개)와 `/아무글자`("아직 준비 중인 초대장이에요") 모두 확인. ※ 이후 앱의 링크 모양(`주소/i/<뒷부분>`)에 맞춰 하객 페이지 주소를 `/i/<뒷부분>`으로 옮겼어요(2026-11-10). 이후 브랜치에 푸시하면 Vercel이 자동으로 다시 배포해요.
- `web/`: `/`(서비스 소개 한 줄), `/i/<주소>`(서버에서 읽어 — 없는 주소 · 작성 중인 주소는 `/`로 보내고, 공유가 끝났거나 행사가 끝났으면 안내, **공유 중이면 앱 미리보기와 같은 모양으로 초대장을 그려요**). 코드: `web/components/`(그리기 · 폼) · `web/lib/`(서버 호출 · 색 · 날짜 · 글꼴 · 음악 표기).
- ✅ 2026-11-10 하객 페이지가 초대장을 그리고 참석 응답 · 방명록을 받아요(`SERVER_STORAGE.md` §13-4). 가짜 서버 + 브라우저로 시험함 — **진짜 Supabase · 폰에서는 아직 확인 전**. 하객 화면이 색 · 장소를 쓰려면 Supabase에서 `schema.sql`을 다시 실행해야 해요.
- 왜 Next.js: `/<주소>` 하나로 모든 초대장을 보여주는 구조가 쉽고, 나중에 링크마다 서버에서 내용을 만들 수 있어요. **공유 미리보기(카카오톡 등 제목 · 설명 · 사진)는 `generateMetadata`로 넣었어요(2026-11-10)** — 제목 = 초대장 이름, 설명 = 공유하기 화면의 문구(없으면 일시 · 장소), 사진 = 대표 사진.

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
1. ✅ Supabase `schema.sql` 9번 실행 · 앱이 만들 때부터 서버에 저장 · [공유 시작]하면 하객에게 열기
2. ✅ `/i/[slug]`가 초대장을 앱 미리보기와 같은 모양으로 그리기 · 참석 응답 · 방명록 · 방문 기록 · 감사페이지 자동 전환 (코드 완료, 진짜 서버 확인 전)
3. **Supabase에서 `schema.sql` 다시 실행**(하객 함수에 색 · 장소 추가) → 앱에서 초대장을 공유해 `https://<내 주소>/i/<링크>`를 폰으로 열어 확인 (`DEVICE_CHECKLIST.md` §10)
4. Vercel 환경변수에 `NEXT_PUBLIC_BGM_BASE_URL` 추가(음원을 Storage에 올린 뒤) — 안 넣으면 ♪ 버튼이 안 나와요
5. 앱 관리 화면(응답 현황 · 방명록 관리 · 통계)이 서버 데이터를 읽기
6. 공유 전 방문 처리(주인은 미리보기, 다른 사람은 "준비 중") — `SERVER_STORAGE.md` §9
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
- **동작**: `/i/<주소>`는 서버의 `get_public_invitation`을 불러요 → 없는 주소 · 작성 중 → **`/`(서비스 첫 화면)로 이동**(둘을 똑같이 처리해서 누가 쓰는 주소인지 알 수 없어요) / 공유 중 → 초대장(행사 다음 날부터는 감사페이지) / 공유 중지 → "공유가 끝난 초대장이에요" / 행사 끝 → "행사가 끝난 초대장이에요" / 서버 오류 → "잠시 후 다시 열어주세요".
- **연결 확인**: Redeploy가 끝난 뒤 `https://<내 주소>/api/health`를 열어요. `{"configured":true,"keyKind":"publishable","reachable":true}`이면 성공이에요(키 · 주소 값은 안 나와요). configured:false → 환경변수 이름 오타 또는 Redeploy 안 함 / reachable:false → 키나 주소가 틀림 / keyKind가 `SECRET-DO-NOT-USE`이면 비밀 키를 넣은 거라 바로 지우고 공개용(publishable · anon) 키로 바꿔요.
- **(선택) 배경음악**: 같은 화면에서 `NEXT_PUBLIC_BGM_BASE_URL` = 앱 `mobile/.env`의 `EXPO_PUBLIC_BGM_BASE_URL` 값(끝에 `/` 없이)도 넣어요. 음원을 Storage `bgm` 폴더에 올린 뒤에 넣으면 돼요.

## 7. 앱과 맞춰야 하는 것
- 항목이 새로 생기거나 모양이 바뀌면 `web/components/blocks.tsx` · `web/lib/model.ts`도 같이 고쳐요(앱 `mobile/src/editor/canvas/*` · `types.ts`와 짝).
- 배경음악 곡이 늘면 `web/lib/bgm.ts`의 곡 표기도 같이 늘려요(없으면 그 곡은 하객 화면에서 재생 · 표기가 안 돼요).
- 색 계산(`web/lib/color.ts`)은 앱 `editor/colors.ts` · `invitationTheme.ts`와 같아야 해요.
