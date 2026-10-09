# Handoff: A. 앱 공통 화면 (A1–A7)

## Overview
행사 초대장(결혼식·돌잔치·백일·생일파티·집들이·개업식·동창회·기타) 제작 모바일 앱의 공통 진입 화면이다. 스플래시, 로그인 전·후 홈, 로그인, 로그인 실패, 회원가입, 비밀번호 찾기가 포함된다. A2(로그인 전 홈)는 구조만 확정됐고 앱 소개 문구·이미지는 **임시안**이다. 구조대로 구현하고 내용은 차차 교체한다.

## About the Design Files
`reference/A 앱 공통 화면.dc.html`은 HTML로 만든 **디자인 레퍼런스**다. 모양과 동작을 보여주는 프로토타입이며 그대로 배포하는 코드가 아니다. 저장소에는 아직 UI 코드가 없으므로 모바일 앱에 맞는 프레임워크를 골라 이 디자인을 새로 구현한다. React Native(Expo)를 권장한다. 브라우저에서 열어 보려면 같은 폴더에 `support.js`가 있어야 한다.

## Fidelity
**High-fidelity.** 색·타이포·여백이 최종값이다. 단 아래는 자리표시 상태로 둔다.
- 로고, 앱 이름, 로고 문구: 점선 박스(`--line-dashed`)로 크기만 확보했다. 브랜딩이 정해지면 교체한다.
- 상태바(9:41, ▪▪▪ ◗)는 목업용이다. 실제로는 OS 상태바와 SafeArea를 쓴다.
- 썸네일 그라디언트는 이미지 자리다.

## 공통 규칙
- 기준 폭 320pt. 좌우 여백 `18` 고정. 레이아웃은 세로 flex이고, 하단 CTA는 `margin-top:auto`로 바닥에 붙인다.
- 화면 배경 `--bg-canvas`. 입력창과 카드는 `--bg-surface`에 1px `--line` 테두리를 두르고, 그림자는 쓰지 않는다.
- 숫자(날짜, 시각, D-day)에는 `font-feature-settings:'tnum'`.
- **텍스트 색 고정 규칙**: 11px 이하 보조 텍스트는 `--ink-secondary #66626e`, 플레이스홀더만 `--ink-placeholder #a29ba8`. 12px 이상 설명문은 `--ink-muted #7a7580`.
- 용어는 행사 범용으로 쓴다. "청첩장·예식" 대신 "초대장·행사"라고 쓴다.

### 공통 컴포넌트
| 컴포넌트 | 스펙 |
|---|---|
| BackButton | `←` 17px/400 `--ink-primary`, 상단 여백 14 |
| ScreenTitle | 21px/600, lh 1.35, ls -0.025em, 상단 여백 22 |
| TextField | bg #fff, 1px `--line`, radius 8, padding 13, 13.5px/400. 포커스: 테두리 `--line-focus`, 커서 `--accent`. 오류: 테두리 `--error` |
| FieldLabel | 11.5px/500 `--ink-label`, 입력창과 간격 7 |
| HelperText | 10.5px/400, 기본 `--ink-muted`, 오류 `--error` |
| PrimaryButton | bg `--ink-primary`, text `--ink-on-primary`, 13.5px/600, ls -0.01em, padding 14 0, radius 10, 폭 100% |
| TextLink | 11.5px, 강조 링크는 600 `--accent` |
| StatusChip | 10px/500 `--accent` on `--accent-tint`, radius 4, padding 4 6 |
| Placeholder | 1px dashed `--line-dashed`, radius 4, 10px `--ink-placeholder` 라벨 가운데 |
| Checkbox | 17×17, radius 4. 체크: bg `--accent` + 흰 ✓. 미체크: 1px `--line-strong`, bg #fff |

Pressed 상태(디자인에는 없음, 제안): 주버튼은 opacity 0.85, 보조 요소는 bg `--accent-tint`. 비활성은 opacity 0.45.

---

## Screens

### A1 스플래시
- 목적: 앱을 시작할 때 브랜드를 노출하고, 1.2초 뒤 자동으로 전환한다.
- 레이아웃: 전체 높이, 가운데 정렬. 세로 간격 16.
  - 로고 자리: 64×64 원형, 점선
  - 앱 이름 자리: 168×28 점선 / 로고 문구 자리: 120×18 점선 (둘 사이 간격 7)
- 하단: 로딩 바 26×2, 트랙 `--line`, 채움 `--accent` 60%. 하단 여백 46.
- 전환: 로그인 세션이 있으면 A3, 없으면 A2.

### A2 홈 (로그인 전) — 내용 임시
- 목적: 처음 온 사용자에게 앱을 소개하고, 가입이나 로그인으로 이어준다.
- 레이아웃(상단 padding 28 18 0):
  - 앱 이름 자리 84×16
  - 헤드라인(상단 14) `블록을 고르고 쌓아서<br>나만의 초대장을` 23px/600, lh 1.42, ls -0.025em
  - 설명(상단 10) `인사말, 갤러리, 지도, RSVP, 방명록.<br>필요한 것만 골라 순서대로 놓으면 됩니다.` 12.5px/1.7 `--ink-muted`
- 미리보기(상단 20):
  - 카드: bg #fff, 1px `--line`, radius 12, padding 5
  - 안쪽 이미지 영역: 높이 176, radius 9. 좌하단에 라벨 `갤러리 블록 · 2열 그리드`(흰 배경, radius 6, padding 7 10, 10.5px/500)
  - 이미지 영역은 추후 앱 소개 이미지나 캐러셀로 교체한다.
- 블록 칩(상단 10, gap 6, wrap):
  - 공통: pill, padding 6 10, 10.5px/500
  - 활성 1개: bg `--accent-tint`, text `--accent`
  - 나머지: bg #fff, 1px `--line`, text `--ink-muted`
  - 칩 목록: 인사말 · 갤러리 · 오시는 길 · RSVP · 방명록. 탭하면 미리보기가 해당 블록으로 바뀐다(제안).
- 하단(padding 26 18 22, gap 9):
  - 주버튼 `시작하기` → A4 로그인
  - 그 아래(상단 4) `계정이 없으신가요?` 11.5px `--ink-muted` + `회원가입` 600 `--accent` 밑줄(offset 3) → A5
- 교체 예정: 헤드라인, 설명, 미리보기 이미지, 칩 목록. 레이아웃은 유지한다.

### A3 홈 (로그인 후)
- 목적: 진행 중인 초대장으로 바로 이동한다.
- 헤더(padding 16 18 12): 좌측 앱 이름 자리 84×16, 우측 아바타 28 원형(bg `--bg-placeholder`, 1px `--line-strong`) → 마이 화면.
- 인사: `{이름}님,<br>행사까지 {n}일 남았어요`, 20px/600, lh 1.35.
- 대표 프로젝트 카드(상단 여백 18, radius 12):
  - 본문 padding 14, gap 12. 썸네일 62×78 radius 6.
  - 메타 줄(gap 6): StatusChip `공유중` · 행사 유형 `결혼식` 10px/500 `--ink-secondary` · 구분점 `·` `--line-strong` · `D-142` tnum.
  - 제목 15px/600 ls -0.02em (예: `김지원 · 이민석`).
  - 일시·장소 11.5px/1.5 `--ink-muted` tnum, 두 줄.
  - 하단 액션 2분할(상단 1px `--line-soft`): `편집` 12.5px/500 ink → B9 / `관리` 12.5px/500 `--accent` → 관리 화면. 가운데 세로선 `--line-soft`.
- 알림 행 2개(gap 8, radius 10, padding 14): 제목 12.5px/500, 부제 11px `--ink-muted`, 우측 `›` `--ink-placeholder`.
  - `새 응답 3건` / `RSVP · 방명록 1건`
  - `아직 비어 있는 블록 2개` / `오시는 길 · 마음 전하기` → 에디터의 해당 블록으로 이동
- 탭바(bg `--bg-tabbar`, 상단 1px `--line`, 항목 padding 12 0 16, 11px): `홈`(활성 600 `--accent`) · `내 초대장`(500 ink) · `마이`(500 `--ink-inactive`).
- 상태: 진행 중인 프로젝트가 없으면 카드 대신 B6 빈 상태로 안내한다. 행사일이 지난 경우에는 "감사 페이지" 칩을 쓴다.

### A4 로그인
- 순서: Back → 제목 `로그인` → 이메일 → 비밀번호 → 주버튼 → 구분선 → 소셜 → 링크 → 약관 고지.
- 입력 그룹 gap 9.
  - 이메일 placeholder `이메일`.
  - 비밀번호 placeholder `비밀번호`, 우측 `보기` 11px `--ink-secondary`(누르면 표시/숨김 토글).
  - 주버튼 `로그인`.
- 구분선(상단 20): 좌우 1px `--line` + 가운데 `간편 로그인` 10.5px `--ink-secondary`, gap 10.
- 소셜(상단 16, gap 9, 좌우 1:1):
  - 카카오: bg `#fee500`, text `#191600`, 13px/600, 아이콘 15px + gap 7, radius 10, padding 14 0.
  - Apple: bg #fff, 1px `--ink-primary`, text ink. 나머지는 카카오와 같다.
- 링크(상단 18, gap 14): `비밀번호 찾기`(`--ink-muted`) → A6, 구분 `|` `--line-separator`, `회원가입`(600 `--accent`) → A5.
- 하단 고지(padding 24 18 26): `로그인하면 이용약관과 개인정보처리방침에<br>동의한 것으로 봅니다.` 11px/1.6 `--ink-secondary`, 가운데 정렬.

### A7 로그인 실패
- A4와 같은 화면에 인라인 오류만 추가한다. 토스트나 모달은 쓰지 않는다.
- 비밀번호 필드 테두리가 `--error`로 바뀐다.
- 오류 줄(padding 2 2 0, gap 6): 14px 원형 `--error` 배경에 흰 `!` 9px/600, 문구 `이메일 또는 비밀번호가 맞지 않습니다.` 11.5px/1.5 `--error`.
- 링크 강조가 `비밀번호 찾기`(600 `--accent`)로 옮겨가고, `회원가입`은 `--ink-muted`가 된다.
- 소셜 영역과 약관 고지는 숨긴다(디자인 기준).
- 입력을 다시 수정하면 오류 상태를 해제한다.

### A5 회원가입
- 필드 그룹 gap 15. 각 필드는 Label + TextField + HelperText.
  - 이메일(포커스 예시)
  - 비밀번호: 도움말 `영문·숫자 포함 8자 이상`
  - 비밀번호 확인: 불일치 시 `비밀번호가 일치하지 않아요`(`--error`)
- 약관(상단 20, gap 9):
  - `약관 전체 동의` 12px/500, 아래 1px `--line` 구분선.
  - 개별 항목 11.5px `--ink-label`, 우측 `보기` 11px `--ink-placeholder` → 약관 웹뷰.
  - 항목: `(필수) 이용약관` / `(필수) 개인정보 수집·이용` / `(선택) 마케팅 정보 수신`.
- 하단 주버튼 `가입하고 시작하기`. 필수 약관 2개 동의 + 유효성 통과 전에는 비활성(opacity 0.45).
- 검증 규칙:
  - 이메일 형식
  - 비밀번호 8자 이상 + 영문·숫자 포함
  - 확인 값 일치(blur 또는 입력 중 실시간)
- 전체 동의는 모든 항목을 토글한다. 개별 항목이 모두 체크되면 전체 동의도 체크된다.

### A6 비밀번호 찾기 (2단계)
**A6-1 요청**
- 제목 `비밀번호 찾기`, 설명 `가입한 이메일로 재설정 링크를 보내드려요.` 12.5px/1.6 `--ink-muted`(상단 8).
- 이메일 필드 → 주버튼 `재설정 링크 보내기`(상단 18).
- 하단 고지: `카카오·Apple로 가입한 계정은<br>해당 서비스에서 비밀번호를 관리합니다.` 11px `--ink-secondary`.

**A6-2 발송 완료**
- 가운데 정렬, gap 14, 좌우 padding 26.
- 아이콘: 52 원형, bg `--accent-tint`, 1px `--accent-tint-border`, ✓ 19px `--accent`.
- 제목 `메일을 보냈어요` 17px/600. 본문 `{email} 으로 보낸<br>링크에서 새 비밀번호를 설정해 주세요.<br>링크는 30분간 유효합니다.` 12.5px/1.75 `--ink-muted`.
- 하단(gap 9):
  - 주버튼 `로그인으로 돌아가기` → A4
  - 텍스트 버튼 `메일이 오지 않았나요? 다시 보내기` 11.5px/500 `--accent`, padding 12 0. 재발송 쿨다운 60초를 권장한다.

---

## Interactions & Navigation
```
A1 ──(세션 O)──▶ A3
   └─(세션 X)──▶ A2 ─시작하기─▶ A4 / ─회원가입─▶ A5
A4 ─로그인 성공─▶ A3     A4 ─실패─▶ A7(같은 화면 상태)
A4 ─비밀번호 찾기─▶ A6-1 ─발송─▶ A6-2 ─▶ A4
A4 ─회원가입─▶ A5 ─가입─▶ A3 (또는 B7 새 초대장)
A4 ─카카오/Apple─▶ OAuth ─▶ A3
A3 ─편집─▶ B9   A3 ─관리─▶ 관리   A3 ─알림 행─▶ 응답/에디터
```
- 전환: 스택 push/pop 기본값. 스플래시는 fade 200ms.
- 로딩: 로그인과 가입 버튼은 요청 중 라벨 대신 스피너를 보여주고 중복 탭을 막는다.

## State
- `auth`: `{ status: 'unknown'|'guest'|'authed', user?: { name, email, provider } }`
- `loginForm`: `{ email, password, showPassword, error?: 'invalid_credentials' }`
- `signupForm`: `{ email, password, confirm, agree: { terms, privacy, marketing } }` → `canSubmit`는 파생값.
- `resetForm`: `{ email, sentAt?, cooldownLeft }`
- `home`: 대표 프로젝트 `{ id, status, eventType, dDay, title, dateTime, venue, thumb }`, 알림 요약 `{ newResponses, emptyBlocks[] }`

## Design Tokens
`../tokens.json`(원본)과 `../tokens.css`(CSS 변수)를 참고한다. 값은 둘이 같다. 초대장 테마(B8, 6종 이상)는 이 토큰과 분리된 `theme.*` 세트로 결과물에만 적용한다. 앱 UI는 테마에 따라 바뀌지 않는다.

## Assets
- 폰트: Pretendard v1.3.9 (https://cdn.jsdelivr.net/gh/orioncactus/pretendard). 앱에서는 번들로 넣는다.
- 아이콘: 카카오·Apple 로고는 각 사의 공식 로그인 버튼 가이드 에셋으로 교체한다(목업의 SVG는 참고용).
- 로고와 앱 이름: 미정(자리표시).

## Files
- `reference/A 앱 공통 화면.dc.html` — 디자인 레퍼런스
- `screenshots/` — 화면별 PNG(640×1244, 2x): `A1-splash`, `A2-home-guest`, `A3-home`, `A4-login`, `A5-signup`, `A6-1-reset-request`, `A6-2-reset-sent`, `A7-login-error`
- `reference/support.js` — 레퍼런스 실행용 런타임
- `../tokens.json`, `../tokens.css`
