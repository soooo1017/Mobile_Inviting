# 모이소 작업 규칙

이 저장소를 고치는 세션(Claude Code)이 지키는 규칙이에요. 사용자는 **아이폰 + 맥북 없이도 확인하고 싶어 해서**, 폰에 바로 못 띄워 보는 일이 많아요. 그래서 아래 세 가지를 같이 해요.

## 앱 · 화면이 바뀌는 수정을 하면 항상
1. **프로토타입에 적용** — 아티팩트 "모이소 새 메뉴 프로토타입"(https://claude.ai/artifact/RZ1TX4SPh7QgWktdsFeV47)에 같은 동작을 넣어서 폰 모형에서 눌러 볼 수 있게 해요(같은 주소로 다시 올려요).
2. **점검표에 정리** — 아티팩트 "모이소 전체 점검표"(https://claude.ai/artifact/ReD7BXJhebUtYhGZqkcRov)에 확인 항목을 **앱 단계 탭**(가입 · 목록 · 만들기 · 편집 · 공유 · 하객 · 관리 · My · 동기화 · 기기별 · 출시) 중 맞는 곳에 넣어요. 항목 id는 바꾸지 않아요(저장 키). 안드로이드 · 아이폰 줄이 따로 있고, 한쪽 기기에만 해당하면 그 기기 전용으로 표시해요.
3. **문서 동기화** — `docs/*.md`(SCREENS · DEVICE_CHECKLIST · TODO 등)와 Notion 할 일 페이지에도 반영해요.

## 말투 · 안내
- 사용자에게는 **한국어 반말**로 답해요. 화면에 보이는 글에는 "블록"이라는 말을 쓰지 않아요(코드 안에서만).
- 코드를 고친 뒤에는 Expo Go 실행 명령을 알려줘요: `cd ~/Desktop/Wedding_Mobile_Inviting` → `git pull origin claude/inspiring-mendel-ksvase` → `cd mobile` → (부품이 바뀌었으면 `npm install`) → `npx expo start -c`.
- 큰 화면 변경은 먼저 시안(프로토타입)을 보여주고 확인받은 뒤 적용해요.

## 지켜야 할 것
- 실제 `.env` · 키는 저장소에 올리지 않아요(`.env.example`의 자리표시자만). `service_role` · 비밀 키는 앱 · 웹 · Vercel에 쓰지 않아요.
- 음원 파일은 저장소에 커밋하지 않아요(프로토타입에도 넣지 않아요).
- 약관 · 개인정보처리방침의 회사 정보는 빈칸(자리표시자)으로 두고 지어내지 않아요.
- 사용자의 Supabase 설정 · SQL은 허락 없이 바꾸지 않아요(읽기 전용 점검은 괜찮아요).
- 커밋은 `claude/inspiring-mendel-ksvase` 브랜치에만 하고, 요청이 없으면 PR을 만들지 않아요.
