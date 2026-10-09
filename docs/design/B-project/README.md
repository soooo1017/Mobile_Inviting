# Handoff: B. 프로젝트 목록 · 생성 (B6 – B8)

## Overview
로그인 후 "내 초대장" 탭의 프로젝트 목록(B6)과 새 초대장 생성 흐름(B7 → B8)이다. 행사 유형은 결혼식·돌잔치·백일·생일파티·집들이·개업식·동창회·기타 8종이다. 감사 페이지 전환 규칙도 이 범위에 포함된다.

## About the Design Files
`reference/B 프로젝트 목록.dc.html`은 HTML 디자인 레퍼런스(프로토타입)이고 배포용 코드가 아니다. 같은 폴더의 `support.js`와 함께 브라우저에서 열면 볼 수 있다. A파트와 같은 스택(권장: React Native/Expo)으로 새로 구현한다. 화면 이미지는 `screenshots/`에 있다.

## Fidelity
**High-fidelity.** 색·타이포·여백이 최종값이다. 썸네일 그라디언트는 초대장 커버 이미지 자리이고, 상태바는 목업용이다.

## 공통 규칙 (A파트 규칙 + 추가)
- 화면 높이 660pt 기준. **목록은 화면 안에서 스크롤**되고 탭바는 하단에 고정된다.
- 색 역할:
  - `--ink-primary`: 진행 버튼(다음, 결과 보기, 제작 시작하기)
  - `--select #6d5bb0`: **모든 선택 표시**(타일·칩·월/기간 셀·체크 토글·필터 적용 버튼·액션시트 [편집]). 선택된 요소는 배경 `--select`, 글씨 흰색.
  - `--error`: 삭제·오류. 선택색으로 바꾸지 않는다.
  - `--success`: 감사 페이지 "설정" 표시
- 바텀시트: bg `--bg-sheet`, 상단 radius 16, 그랩바 36×4 `--line-chip`, 딤 `--overlay-sheet`
- 모달: 좌우 24 inset, radius 14, `--shadow-modal`, 딤 `--overlay-modal`
- 칩 공통: 10px/500, radius 4, padding 4 6

### 상태칩
| 상태 | 스타일 |
|---|---|
| 작성중 | `--ink-secondary` / bg #fff / 1px `--line-chip` |
| 공유중 | `--accent` / bg `--accent-tint-soft` / 1px `--accent-tint-border` |
| 감사 페이지 (공개 중) | `--ink-secondary` / bg `--bg-placeholder` |
| 지난 행사 | `--ink-secondary` / 1px `--line-chip` |
| 감사 페이지 **설정됨** (썸네일형 보조칩) | 600 `--success` / bg `--success-tint` / 1px `--success-border` |

---

## 데이터 모델 (제안)
```ts
type EventType = 'wedding'|'first_birthday'|'100days'|'birthday'|'housewarming'|'opening'|'reunion'|'other';
type Project = {
  id: string; title: string;            // 목록 표시명 (검색 대상)
  eventType: EventType; customTypeName?: string;   // 기타일 때
  hosts: { label: string; name: string }[];        // 예: 신랑/신부, 아이/부모님
  eventAt: string;                      // ISO, 행사 시작
  venue?: { name: string; address: string; sido: string; mapLinks: { naver: boolean; kakao: boolean } };
  thanks: { enabled: boolean; days?: 1|2|3|4|5|6|7; hasContent: boolean };
  shared: boolean;                      // 링크 공유 시작 여부
  themeId: string; updatedAt: string; createdAt: string;
  counts: { rsvp: number; guestbook: number };
};
```

## 상태 파생 규칙 (확정)
`eventDay` = 행사 날짜, `thanksStart` = 행사 **다음 날 00:00**, `thanksEnd` = thanksStart + days일 - 1일 23:59
1. `!shared` → **작성중**
2. `shared && now < thanksStart` → **공유중**
3. `thanks.enabled && thanksStart ≤ now ≤ thanksEnd` → **감사 페이지** (같은 링크가 감사 페이지로 전환)
4. 그 외(기간 종료, 또는 감사 페이지 미설정이고 now ≥ thanksStart) → **지난 행사**
   - 감사 페이지를 설정하지 않았으면 행사 다음 날 00:00부터 **링크 접속 불가**

### 목록 안내 (공유중 상태에서 D-7부터)
| 조건 | 자세한 카드형 | 썸네일형 | 리스트형 |
|---|---|---|---|
| thanks.enabled && hasContent | 라벤더 띠 `감사 페이지 기간 : M. D. ~ M. D.` | 초록 "감사 페이지" 칩 | 라벤더 한 줄 |
| thanks.enabled && !hasContent | 빨강 띠 `감사 페이지가 비어 있어요` + [작성하기] → B9 감사페이지 탭 | 초록 칩 | 빨강 한 줄 |
| !thanks.enabled | 없음 | 칩 없음 | 없음 |
| 전환 후 (감사 페이지/지난 행사) | 없음, 상태칩만 | 없음 | 없음 |
- 썸네일형의 초록 칩은 D-7 조건과 상관없이, 감사 페이지를 설정한 작성중·공유중 카드에 항상 표시한다.
- 띠 스타일: margin 0 13 13, padding 9 10, radius 6, 11px/500. soon은 `--accent-tint`/`--accent`, warn은 `--error-tint`/`--error`.

---

## Screens

### B6-1 목록 · 보기 3종 (최종: B6p / B6q / B6r) + 빈 상태 B6b
상단 구성(공통, 위에서부터):
1. 헤더: `내 초대장` 19px/600, 우측 아바타 28 → 마이
2. 검색창: bg #fff, 1px `--line`, radius 8, padding 11 12, 돋보기 15, placeholder `프로젝트명 검색`
3. 개수 줄(padding 0 18 12):
   - 좌: `초대장 N개` 11.5px/500 `--ink-secondary`. 검색 중에는 `‘{q}’ 검색 결과 N개`.
   - 우: **[+ 새 초대장 만들기]** pill(padding 7 13, 12px/600, bg `--ink-primary`) → B7a
4. 툴바:
   - 좌: [필터] pill(필터 아이콘 13 + 텍스트) + 정렬 텍스트 버튼 `최근 수정순 ▼`
   - 우: 보기 토글 3분할(bg `--bg-segment`, 각 28×28, 활성은 흰 배경 + 1px `--line` 링). 순서: 자세한 카드 / 썸네일 / 리스트.
   - 필터가 적용되면 [필터] 버튼이 `--select` 배경, 흰 글씨, 흰 원 안에 개수.

보기별 스펙:
- **① 자세한 카드형 (기본)**:
  - 카드 bg #fff, 1px `--line`, radius 10, padding 13, 썸네일 62×78 radius 6.
  - 메타 줄: 상태칩 · 유형 · D-day.
  - 제목 15px/600, 일시·장소 11.5px/1.5.
  - 하단 줄: 공유중은 `RSVP n · 방명록 n`(`--accent`), 작성중은 `오늘 수정`/`n일 전 수정`, 감사 페이지는 `감사 페이지 공개 중`, 지난 행사는 `행사 완료`.
  - 그 아래 안내 띠. 지난 행사 카드는 bg `--bg-card-past`. 카드 간격 10.
- **② 썸네일 카드형**: 2열 그리드(gap 14 10), 썸네일 3:4 radius 8. 좌상단에 상태칩과, 설정 시 초록 칩. 아래 제목 13px/600 한 줄 말줄임. 정보는 최소로 하는 앨범형이다.
- **③ 리스트형**:
  - 흰 박스 하나(radius 10) 안에 행, 행 사이 1px `--line-soft`.
  - 행 padding 14. 좌측은 제목 14px/600, `유형 · 일시` / 장소 11px, 안내 한 줄. 우측은 상태칩과 D-day.
- **카드/행 버튼 없음**: 어떤 보기든 항목을 탭하면 B6s/B6t 액션 시트가 열린다.
- **B6b 빈 상태**: 초대장이 0개일 때 안내와 [+ 새 초대장 만들기].

### B6-2 검색 · 필터 · 정렬
- **B6e 검색**: 프로젝트명 부분 일치(대소문자·공백 무시 권장). 일치 구간을 `--accent-tint` 배경과 `--accent` 글씨로 강조한다. 입력 중 포커스 테두리는 `--line-focus`, 우측 지우기 ✕.
- **B6f 필터 시트**:
  - 높이 **화면 3/4**(top 165), 내부 스크롤. 하단 고정 바: [초기화](흰색) + [결과 N개 보기](`--ink-primary`, 실시간 개수).
  - 섹션 간격 26, 제목 12.5px/600, 제목과 칩 간격 12.
    1. 초대장 상태: 전체 · 작성중 · 공유중 · 감사 페이지 · 지난 행사
    2. 행사 월: 연도 ‹ › 이동 + 12개월 6열 그리드
    3. 행사 종류: 8종
    4. 장소 지역: 시·도 17개(서울~제주)
  - **모든 항목 복수 선택**. 단 상태의 "전체"는 단독 선택이라, 누르면 다른 상태 선택을 해제한다. 다른 상태를 고르면 전체가 해제된다. 아무것도 안 고르면 전체와 같다.
  - 선택 칩은 `--select` 배경, 흰 글씨, 600.
  - 항목 간 조합은 AND, 같은 항목 안은 OR.
- **B6g 정렬 시트**: 단일 선택. 고르면 바로 닫힌다. 선택 항목은 `--accent` 600 + ✓.
  - 최근 수정순(기본) · 최근 행사순(행사일 내림차순) · 오래된 행사순(오름차순) · 최근 만든순 · 이름순(가나다·ABC)
- **B6i 결과 없음**: 원형 아이콘, `조건에 맞는 초대장이 없어요`, `검색어를 바꾸거나 필터를 해제해 보세요.`, [필터 초기화](outline).
  - 적용된 필터는 툴바 아래에 칩(`--accent-tint`, ✕로 개별 해제)으로 보여주고, 끝에 `초기화` 텍스트 링크를 둔다.
- 보기 방법·정렬은 기기에 저장해 유지하는 것을 권장한다. 필터는 세션 단위.

### B6-3 행사 탭 → 액션 시트 (B6s 감사 설정됨 / B6t 미설정)
위에서부터:
1. 그랩바
2. 상태칩 · 유형 · D-day, 제목 15px/600
3. 2분할 큰 버튼(gap 8, padding 14 0, radius 10):
   - **[편집]**: `--select` 배경, 흰 글씨, 부제 `블록 · 디자인`(`--on-select-sub`) → B9
   - **[관리]**: 흰 배경, 1px `--select`, `--select` 글씨, 부제 `응답 · 공유 · 설정` → E21
4. **감사 페이지 설정 박스**(항상 표시, 흰 배경, 1px `--line`, radius 10, padding 14, gap 10):
   - 헤더: `감사 페이지 설정` 13px/600, 우측 상태 버튼(radius 6, padding 5 9, 11px/600)
     - 설정: `--success` / `--success-tint` / `--success-border`
     - 미설정: `--error` / `--error-tint` / `--error-border`
   - 설정됨:
     - `기간 : 12. 29. ~ 1. 4. (7일)`
     - `공유한 링크에서 자동으로 감사 페이지로 전환되어 행사에 참석해주신 분들에게 감사 인사를 드려요.`
     - 버튼 [기간 변경] [감사 페이지 편집]
   - 미설정: 기간 줄 없음.
     - `행사 종료일 이후에는 초대장 접속이 불가합니다.` / `행사에 참석해주신 분들에게 감사 인사를 드리고 싶으시면 감사 페이지를 설정해주세요.`
     - 버튼 [기간 설정] [감사 페이지 편집]
   - [기간 변경/설정]은 기간 선택 시트(1~7일, B7e와 같은 UI) 또는 E22로 연결한다.
5. 메뉴 행(15px 18 padding, 13.5px/500, 행 사이 `--line-soft`): 미리보기 · 공유 링크 복사
6. 구분선 뒤 **삭제하기**(`--error`) → B6-4

### B6-4 삭제 (B6l / B6m / B6n / B6o)
- **작성중(공유 전) B6l**:
  - 제목 `‘{title}’을 삭제할까요?` 16px/600
  - 본문 `작성한 내용과 사진은 모두 지워지고 복구할 수 없어요.` 12.5px/1.7
  - [취소](흰색) [삭제하기](`--error` 배경, 흰 글씨)
- **공유중·감사 페이지·지난 행사 B6m/B6n**:
  - 제목 `공유 중인 초대장이에요. 정말 삭제할까요?`
  - 본문 `초대장을 받은 사람들은 더 이상 링크를 열 수 없어요.`
  - 정보 박스(bg `--bg-sheet`, 1px `--line`, radius 8, 행 간격 9, 12px):
    - 초대장 이름
    - 공유 링크 `즉시 열리지 않음`(`--error`)
    - RSVP 응답 `n건 삭제`
    - 방명록 `n건 삭제`
  - `응답 데이터 먼저 내려받기` 링크(`--accent`, 밑줄) → CSV 내보내기
  - 체크박스 `공유 링크와 응답 데이터가 함께 삭제되는 것을 확인했어요`. 체크 전에는 [삭제하기]가 opacity 0.45로 비활성.
- **완료 B6o**:
  - 목록으로 돌아가고 해당 카드를 제거하고 개수를 갱신한다.
  - 토스트: 하단 탭바 위(bottom 62, 좌우 18), bg `--error`, 흰 글씨, 흰 원 ✓ 아이콘, `‘{title}’을 삭제했어요`, 3초.
- 휴지통·되돌리기·보관 기능은 **없음**(확정). 삭제는 즉시, 영구.

### B7 · B8 새 초대장 (4단계)
공통 레이아웃:
- 헤더 `←` + `새 초대장`
- 진행 바 2px(`--line` 트랙, `--accent` 채움 25/50/75/100%)
- 단계 라벨 `n / 4 · {단계명}` 10.5px/500
- 하단 진행 버튼 **`다음`**(`--ink-primary`). 마지막 단계만 **`제작 시작하기`**.

| 단계 | 화면 | 내용 |
|---|---|---|
| 1/4 | **B7a** 행사 유형 | `어떤 행사인가요?` 18px/600 + 설명. 2열 타일 8개(이름 13.5px + 칸 이름 예시 11px). 선택 타일은 `--select` 배경, 흰 글씨, 부제 `--on-select-sub` |
| 1/4 | **B7d** 기타 | 기타 선택 시 아래에 `행사 이름` 입력(포커스 상태). 헬퍼 `프로젝트 목록에 표시돼요.` |
| 2/4 | **B7b/B7c** 기본 정보 | 주인공 2칸(유형별 라벨: 결혼식 신랑·신부 / 돌잔치·백일 아이·부모님 / 생일파티 주인공 / 집들이 집주인 / 개업식 가게·대표 / 동창회 모임·총무). 행사 일시(날짜 1.3 : 시간 1). 행사 장소 |
| 3/4 | **B7e** 감사 페이지 | 아래 참조 |
| 4/4 | **B8** 테마 | 테마 6종 2열 카드. 앱 UI는 바뀌지 않고 결과물에만 적용. 버튼 `제작 시작하기` → B9 |

**행사 장소 (B7b/B7c)**
- 검색 입력 `장소명 또는 주소 검색`(돋보기 아이콘). 결과에서 선택하면 name/address/sido를 저장한다.
- `지도 · 길찾기 연결` 체크 토글 2개 [네이버 지도] [카카오맵]은 **각각 독립 선택**이다(0·1·2개 모두 가능).
  - 선택: `--select` 배경, 흰 글씨, 흰 체크박스에 ✓
  - 미선택: 흰 배경, 1px `--line`
- 아무것도 선택하지 않으면 초대장에 장소 이름과 주소만 표시한다. 선택한 앱마다 지도 보기·길찾기 딥링크 버튼을 노출한다.
- 헬퍼: `선택하지 않으면 장소 이름과 주소만 표시돼요.` / `나중에 입력해도 괜찮아요.`

**감사 페이지 (B7e)**
- 제목 `행사 후 감사 페이지를 보여줄까요?`
- 설명 `행사 다음 날 자정부터 공유한 링크가 감사 페이지로 바뀌어요.` / `행사에 참석해주신 분에게 감사 인사를 드려요.`
- 선택 버튼 2개(세로, padding 15 0, radius 10):
  - `감사 페이지 설정하기`
  - `감사 페이지 설정하지 않기`
  - 선택: `--select` 배경, 흰 글씨. 미선택: 흰 배경, 1px `--line-chip`.
- `공개 기간` 라벨 + 우측 `최소 1일 ~ 최대 7일`, 7열 셀 `1일`~`7일`. 선택 셀은 `--select` 배경, 흰 글씨.
  - "설정하지 않기"를 고르면 기간 영역을 숨긴다.
- 기간 미리보기 박스(흰 배경, 1px `--line`): `기간 : 2026. 5. 17. ~ 5. 23. (7일)`. 행사일 기준으로 계산한다.
- 헬퍼: `감사 페이지 내용은 에디터에서 작성해요.` / `페이지 전환 및 기간 등의 설정은 나중에 바꿀 수 있어요.`

---

## Interactions & Navigation
```
A3/탭바 ─▶ B6 목록
B6 [+ 새 초대장 만들기] ─▶ B7a ─▶ (B7d) ─▶ B7b ─▶ B7e ─▶ B8 ─제작 시작하기─▶ B9
B6 항목 탭 ─▶ B6s/B6t 시트 ─[편집]▶ B9  ─[관리]▶ E21
                                ─[기간 설정/변경]▶ 기간 시트 or E22
                                ─[감사 페이지 편집]▶ B9 (감사페이지 탭)
                                ─삭제하기▶ B6l | B6m→B6n ─▶ B6o
B6 [필터] ─▶ B6f   B6 정렬 ─▶ B6g   검색 입력 ─▶ B6e / 0건 B6i
안내 띠 [작성하기] ─▶ B9 (감사페이지 탭)
```
- 시트: 아래에서 슬라이드업 240ms, 딤 페이드. 바깥을 탭하거나 아래로 스와이프하면 닫힌다.
- B7 뒤로가기는 입력값을 유지한다. 1단계에서 뒤로가면 "작성을 그만둘까요?" 확인을 권장한다.

## State (클라이언트)
- `listView: 'detail'|'thumb'|'list'` (persist)
- `sort: 'updated'|'eventDesc'|'eventAsc'|'created'|'name'` (persist)
- `filters: { status: Set<'draft'|'shared'|'thanks'|'past'>|'all', months: Set<'YYYY-MM'>, types: Set<EventType>, sido: Set<string> }`
- `query: string`
- `createDraft: { eventType, customTypeName, hosts, eventAt, venue, thanks:{enabled, days}, themeId }`

## Assets
- 폰트: Pretendard(A파트와 동일).
- 아이콘: 검색·필터·보기 3종 아이콘은 레퍼런스의 인라인 SVG를 참고하고, 실제로는 앱의 아이콘 세트로 교체한다.
- 지도: 네이버 지도·카카오맵 장소 검색 API와 앱 딥링크(각 사 개발자 가이드 기준).

## Files
- `reference/B 프로젝트 목록.dc.html`, `reference/support.js`
- `screenshots/` — 화면별 PNG(2x): `B6p-list-detail` `B6q-list-thumb` `B6r-list-text` `B6b-empty` `B6e-search` `B6f-filter` `B6g-sort` `B6i-no-result` `B6s-sheet-thanks-on` `B6t-sheet-thanks-off` `B6l-delete-draft` `B6m-delete-shared` `B6n-delete-shared-checked` `B6o-deleted-toast` `B7a-type` `B7d-type-other` `B7b-info-wedding` `B7c-info-dol` `B7e-thanks` `B8-theme`
- `../tokens.json`, `../tokens.css` (v0.2.0)
