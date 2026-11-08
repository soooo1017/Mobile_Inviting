# 배경음악(BGM) 음원 · 라이선스 관리

> 상태: **첫 곡 확정 (2026-10-31)** — Musopen이 CC BY 버전을 보여주지 않아 "CC BY"로 표기해요(핵심 조건인 저작자 표시는 3.0 · 4.0 같음). 이후 곡은 PD(퍼블릭 도메인) 표시 곡을 우선해요. 음원 파일은 git에 넣지 않고(용량), 서버 연결 때 Supabase Storage에 올려요. 이 문서는 **어떤 곡을 어떤 조건으로 받았는지** 증빙을 남기는 표예요.

## 1. 우리가 쓰는 기준

서비스는 무료로 시작하지만 **광고 수익 · 추후 유료 곡(포인트)** 계획이 있어서 **상업 서비스**로 봐요. 사용자가 곡을 골라 자기 초대장에 넣고, 링크를 받은 사람이 웹에서 재생하는 구조라 **곡을 다른 사람에게 제공(재배포)**하는 일이기도 해요.

| 라이선스 | 사용 |
|---|---|
| CC0 · 퍼블릭 도메인(PD) | ✅ |
| CC BY (저작자 표시) | ✅ — 앱에 **표기 필수** |
| CC BY-SA | ⚠️ 피함 |
| CC BY-NC · BY-ND 등 NC · ND가 붙은 것 | ❌ |
| "무료" 사이트 곡 · 구독형 음원(BGM팩토리 · Artlist · Epidemic Sound) | ❌ 내 작품에 넣는 용도라 "사용자에게 곡 제공"은 별도 사업자 계약이 필요 (유료 곡 단계에서 문의) |
| 가요 · OST · 커버 · 출처 불명 | ❌ |

- **작곡**(저작권 만료)과 **녹음(연주)**은 권리가 따로예요. 녹음의 라이선스 아이콘을 곡마다 확인해요.
- 같은 곡도 **녹음마다 라이선스가 달라요** (예: Musopen의 Salut d'amour — Luis Sarro 녹음은 BY-NC-ND라 ❌, Emanuel Salvador 녹음은 BY라 ✅).
- 유료 곡(포인트)은 **서비스 내 배포 · 유료 제공**을 허락한 계약(작곡가 직접 계약 등)이 있는 곡만. 출시 이후에 정해요.

## 2. 받을 때 남길 것
곡 제목 · 연주자 · **곡 페이지 주소** · **라이선스 이름과 버전 · 링크** · 받은 날짜 · 표기 문구 · **라이선스 화면 캡처**(파일은 따로 보관).

> **Musopen에서 라이선스 버전(CC BY 3.0 / 4.0 등)을 확인하는 법**: 곡 목록의 라이선스 아이콘은 링크가 아닌 아이콘 글꼴이라 눌러도 아무것도 안 나와요(소스에도 곡 줄이 없고 자바스크립트로 채워져요). ① 녹음 줄의 제목을 눌러 상세 페이지 확인 ② Terms of Use(`musopen.org/tos/`)의 라이선스 설명 확인 ③ 그래도 없으면 Musopen에 메일로 문의하고 답장을 보관. 사이트 안내문: "All the music we host is royalty and copyright free. For specific restrictions when applicable, check the license icons." 첫 묶음은 **PD 표시 곡**을 우선(표기 의무가 없어 확인 부담이 적어요).

## 2-1. 보관함 폴더 · 파일 이름 규칙 (2026-11-01)

음원과 증빙은 코드 저장소(git)에 넣지 않고 본인 컴퓨터 + 개인 클라우드에 두어요. 곡이 늘어나도 같은 규칙을 써요.

- **곡 번호**(세 자리: `001`, `002`, … `999`)가 곡의 고유 번호예요. 한 번 쓴 번호는 곡을 지워도 다시 쓰지 않아요. 이 문서 표의 ID(`bgm001`)와 숫자가 같아요.
- **폴더**: `곡번호. 곡 제목 (작곡가)` — 예: `001. Salut d'amour, Op. 12 (Edward Elgar)`
- **파일**: `곡번호-종류번호. 종류이름.확장자` — 종류 이름은 영문 소문자와 `_`만 (`proof_list`처럼 `_`로 통일).

| 종류번호 | 종류 이름 | 뜻 |
|---|---|---|
| `-1` | `audio_original` | 받은 원본 음원 (수정 금지) |
| `-2` | `audio_app` | 앱에 넣을 편집본 (1~3분 · 128kbps MP3) — 앱용을 만들면 추가 |
| `-3` | `proof_row` | 목록에서 해당 곡 한 줄(연주자 · 라이선스 아이콘) 캡처 |
| `-4` | `proof_list` | 목록 전체 화면 캡처 (주소창 + 일시가 보이게) |
| `-5` | `proof_page` | 곡 설명 페이지 캡처 (주소창 + 일시가 보이게) |
| `-6` | `source` | 곡 · 연주자 · 라이선스 · 주소 · **캡처 일시**를 글자로 기록 (txt) |

```
BGM/
  001. Salut d'amour, Op. 12 (Edward Elgar)/
    001-1. audio_original.mp3
    001-2. audio_app.mp3        (앱용을 만들면 추가)
    001-3. proof_row.png
    001-4. proof_list.png
    001-5. proof_page.png
    001-6. source.txt
```
- 날짜는 파일 이름이 아니라 `source.txt` 안에 적어요. 같은 종류를 다시 캡처하면 `001-3. proof_row_2`처럼 `_2`, `_3`을 붙여 새 파일로 저장해요(예전 파일은 지우지 않아요 — 사이트 조건이 바뀐 걸 보여주는 증빙).
- 서버(Supabase Storage)에 올릴 때는 한글 · 공백 · 점이 들어간 이름을 쓰지 않고, 곡 번호로 `bgm001.mp3`처럼 영문 ID 이름으로 바꿔서 올려요.

> **앱 출시 전 할 일**: 확정한 곡의 앱용 파일(`bgm001.mp3` …)을 Supabase Storage의 공개 폴더에 올리고, 앱 · 손님 웹페이지가 그 주소로 재생하도록 연결해요. (출시 전에 하기로 2026-11-01 결정. 그 전까지 앱 코드는 곡 정보만 두고 파일은 git에 넣지 않아요.)

## 3. 곡 목록

| ID | 상태 | 곡 | 작곡 | 연주 | 라이선스 | 출처 | 받은 날 | 파일 | 확인 |
|---|---|---|---|---|---|---|---|---|
| bgm001 | 확정 | Salut d'amour, Op. 12 | Edward Elgar | Emanuel Salvador · Pau Casan (파일 태그 기준) | **CC BY** (Musopen 목록에 `cc` 원 + 사람 모양 `BY` 원 아이콘, 버전은 사이트가 보여주지 않아 표기 안 함 — 2026-10-31 결정) | Musopen — https://musopen.org/music/5232-salut-damour-op-12/#recordings | 2026-10-31 | mp3 192kbps · 2분 44초 · 3.9MB | ✅ 사용 결정 · ☐ 라이선스 화면 캡처 보관 · ☐ (선택) 버전 문의 |
| bgm002 | 확정 | Schumann Papillons Op. 2 - No. 5 | Robert Schumann | Greg Tait (Musopen 사이트 표기 · 파일 태그는 Gregory Tait — 앱에는 사이트 표기를 씀) | **PD** (Musopen 목록에 `cc` 원 + `PD` 원 아이콘 두 개로 표시, 퍼블릭 도메인 — 표기 의무 없음) | Musopen — https://musopen.org/music/2360-papillons-op-2/#recordings | 2026-11-01 | mp3 128kbps · 1분 44초 · 1.7MB (앱용 변환 불필요) | ✅ 사용 결정 · ☐ 증빙 4종 폴더 보관 |

### 상태 (곡 표의 "상태" 칸)
| 상태 | 뜻 |
|---|---|
| 후보 | 곡만 받아 둔 상태 (증빙이 덜 모임) |
| 확정 | 라이선스 · 증빙이 갖춰져 앱에 올려도 되는 상태 |
| 게시 | 지금 앱에 올라가 있는 곡 |
| 내림 | 앱에서 뺀 곡 (번호는 그대로 보관) |

음원은 앱에 올리지 않아도 미리 많이(100~200곡) 모아 둘 수 있고, 유행에 맞춰 **확정** 곡 중에서만 골라 올려요.

### 표기 문구 (초대장 맨 아래 · "음원 출처 · 라이선스" 곡 상세, 같은 구조)
CC BY 곡은 표기가 의무라서 초대장 맨 아래(손님 페이지 포함)에 꼭 들어가요. 퍼블릭 도메인 곡도 같은 구조로 보여줘서 화면을 통일해요(의무는 아님).
```
♪ 배경음악
제목  "Salut d'amour, Op. 12" (Edward Elgar)
연주  Emanuel Salvador, Pau Casan
출처  Musopen        라이선스  CC BY
```
```
♪ 배경음악
제목  "Papillons, Op. 2 No. 5" (Robert Schumann)
연주  Greg Tait
출처  Musopen        라이선스  퍼블릭 도메인
```
- 곡 상세 화면에는 라이선스 아이콘을 Musopen처럼 보여줘요: CC BY = `cc` 원 + 사람 모양 `BY` 원, 퍼블릭 도메인 = `cc` 원 + `PD` 원. (프로토타입은 비슷하게 직접 그린 것. 앱에는 Creative Commons 공식 아이콘 사용 조건을 확인한 뒤 결정)
- 곡 목록(음원 출처 · 라이선스)은 **곡 이름 · 작곡가 · 원제**만 보이고, 누르면 곡 상세가 열려요(곡이 많아져도 목록이 짧게).

### 편집한 곡의 표기 (2026-11-08)
노래 편집에서 구간을 자르거나 속도를 바꾸면 **곡을 변형해 쓰는 것**이라 CC BY 곡은 초대장 맨 아래 제목 줄 끝에 `· 일부 구간 사용` / `· 속도 조정`을 붙여요(퍼블릭 도메인 곡 · 내 음악에는 안 붙임). 파일 자체는 자르지 않고 "몇 초부터 몇 초까지 · 몇 배속"만 저장해요.

### 3-1. 후보 곡 아이디어 (아직 확인 안 한 목록)
**주의**: 곡(작곡) 자체가 퍼블릭 도메인이어도 **연주 녹음마다 라이선스가 달라요.** 아래는 "이 곡을 Musopen에서 찾아보자"는 후보일 뿐이고, 곡 페이지의 **녹음(Recordings) 목록에서 라이선스 아이콘이 `cc`+`PD`(퍼블릭 도메인) 또는 `cc`+`BY`인 녹음**만 받아요. (NC · ND · SA 아이콘이 붙은 녹음은 제외. 이 세션에서는 Musopen에 접속할 수 없어서 라이선스를 직접 확인하지 못했어요.)

| 행사 | 후보 곡 (Musopen 검색어) | 분위기 |
|---|---|---|
| 결혼식 | Pachelbel Canon in D · Mendelssohn Wedding March · Wagner Bridal Chorus (Lohengrin) · Bach Air on the G String · Bach Jesu, Joy of Man's Desiring · Schubert Ave Maria | 잔잔한 · 입장 |
| 결혼식 · 모임 | Debussy Clair de Lune · Satie Gymnopédie No. 1 · Chopin Nocturne Op. 9 No. 2 | 잔잔한 |
| 돌잔치 | Brahms Lullaby (Wiegenlied) · Tchaikovsky Waltz of the Flowers · Mozart Piano Sonata No. 16 (K. 545) | 밝은 · 포근한 |
| 개업식 · 집들이 · 생일 | Vivaldi Four Seasons - Spring · Handel Arrival of the Queen of Sheba · Strauss Blue Danube · Mozart Eine kleine Nachtmusik | 밝은 · 경쾌한 |

받았으면 위 3항 곡 목록 표에 `후보`로 한 줄 추가(ID는 bgm003부터) → 증빙 4종까지 모이면 `확정`.

## 4. 앱에 넣기 전 처리
- 1~3분 길이로 맞추고(필요하면 자르기 · 페이드 인/아웃), **MP3 128kbps**로 줄여요(곡당 약 2~3MB).
- 앱의 **My Page › 약관 및 정책 › 음원 출처 · 라이선스** 화면과 BGM 곡 목록(`라이선스`, `출처` 필드)은 구현돼 있어요(2026-11-08). 새 곡을 넣을 때는 `mobile/src/editor/bgm.ts`의 `BGM_TRACKS`에 한 줄 추가(곡 이름 · 원제 · 작곡가 · 연주 · 라이선스 · 출처 주소 · 길이 · 파형)하고, 음원 파일은 Supabase Storage `bgm` 폴더에 `bgmNNN.mp3`로 올려요.
- **파형(peaks)**: 곡마다 72개 막대 높이(0~100)를 미리 계산해 `peaks`에 넣어요. 128kbps mp3에서 8kHz 모노로 풀어 72등분한 구간의 소리 크기(RMS)를 0~100으로 맞춘 값이에요(`ffmpeg`로 변환 후 계산).
