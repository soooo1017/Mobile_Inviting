# 친구들에게 테스트 앱 보내기 (Expo Go 없이)

> 지금은 내 컴퓨터에서 `npx expo start`로 Expo Go에 연결해야만 볼 수 있어요. 이 문서는 **친구 폰에 앱을 직접 설치해서** 써 보게 하는 방법이에요.
> 2026-11-15 정리. 설정 파일(`mobile/eas.json`, `mobile/app.json`의 앱 ID)은 만들어 두었고, **빌드는 내 Expo 계정으로 로그인해야 해서 사용자가 직접** 실행해요.

## 먼저 알아둘 것
- 빌드는 **EAS**(Expo 빌드 서버)가 해 줘요. 컴퓨터에 Android Studio · Xcode가 없어도 돼요. 무료 계정으로 한 달에 정해진 횟수까지 빌드할 수 있어요.
- 테스트 앱은 **내 Supabase 서버**를 같이 써요. 친구가 가입 · 만든 초대장 · 문의가 내 Supabase에 쌓여요(Table Editor에서 볼 수 있어요).
- 바로 반영되지는 않아요. 코드를 고치면 **새로 빌드**해서 다시 보내야 해요(빌드에 10~20분).
- 앱 ID `kr.moiso.app`는 **임시 값**이에요. 스토어에 올리기 전에 바꿀 수 있어요(테스트 빌드만 쓰는 동안은 상관없어요).

## 친구가 가입할 수 있으려면 (꼭 먼저)
친구가 가입하면 **인증 메일**이 가야 해요. Supabase 기본 메일 서버는 보내는 양이 아주 적고 받는 주소가 제한될 수 있어서, 둘 중 하나를 먼저 해요.
1. **(추천) 자체 메일 서비스(SMTP) 연결** — Supabase › Authentication › Emails › SMTP Settings. 출시 때도 필요해요.
2. **(테스트 기간만) 이메일 인증 끄기** — Supabase › Authentication › Providers › Email › *Confirm email* 끄기. 메일 없이 바로 로그인돼요. 대신 인증 메일 흐름은 이 기간 동안 시험할 수 없고, 끝나면 다시 켜야 해요.
그리고 Authentication › URL Configuration의 **Site URL**(`https://moiso-ten.vercel.app`)과 Redirect URLs를 `AUTH_MAIL.md` 대로 맞춰요. 한국어 메일 문구도 거기 있어요.

## 처음 한 번: 준비
```
cd ~/Desktop/Wedding_Mobile_Inviting
git pull origin claude/inspiring-mendel-ksvase
cd mobile
npm install
npx eas-cli login          # Expo 계정(없으면 expo.dev에서 무료 가입)
npx eas-cli init           # 이 앱을 내 Expo 계정에 등록 (projectId가 app.json에 들어가요)
```

### 서버 주소 · 키를 빌드에 넣기 (`.env`는 깃에 올리지 않아요)
빌드 서버는 내 컴퓨터의 `mobile/.env`를 못 봐요. 같은 값을 EAS 환경변수로 넣어요(값은 `mobile/.env`에 있는 것 그대로).
```
npx eas-cli env:create --name EXPO_PUBLIC_SUPABASE_URL      --value "<.env의 값>" --environment preview --visibility sensitive
npx eas-cli env:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "<.env의 값>" --environment preview --visibility sensitive
npx eas-cli env:create --name EXPO_PUBLIC_BGM_BASE_URL      --value "<.env의 값>" --environment preview --visibility sensitive
```
- `service_role` · 비밀 키는 절대 넣지 않아요(앱에는 공개용 anon/publishable 키만).
- 값을 잘못 넣었으면 `npx eas-cli env:list` 로 확인하고 `env:update`로 고쳐요.

## Android — 파일(APK) 하나로 설치
```
cd ~/Desktop/Wedding_Mobile_Inviting/mobile
npx eas-cli build --platform android --profile preview
```
- 끝나면 **설치 링크 · QR**이 나와요. 친구에게 링크를 보내요.
- 친구 폰(Android): 링크를 열어 APK를 받고 → "출처를 알 수 없는 앱 설치"를 허용 → 설치. (구글 Play 보호 경고가 뜰 수 있어요. 내가 보낸 테스트 앱이라고 알려 주세요.)

## iOS — 두 가지 길
애플은 허용된 방법으로만 설치돼서 **Android보다 번거로워요.**
1. **TestFlight (추천, 유료)** — Apple Developer Program 가입(연 약 13만 원, 승인에 며칠). 가입 후:
   ```
   npx eas-cli build --platform ios --profile production
   npx eas-cli submit --platform ios
   ```
   App Store Connect › TestFlight에서 친구 이메일을 추가(또는 공개 링크)하면 친구는 **TestFlight 앱**으로 설치해요. 외부 테스터는 간단한 심사(보통 하루 내)를 거쳐요.
2. **Expo Go로 열기 (무료, 아직 시험 안 해 봤어요)** — EAS Update로 올린 버전을 친구가 Expo Go에서 링크로 열 수 있는지 확인해 봐야 해요. 친구도 Expo Go를 설치해야 하고, Expo Go가 지원하는 SDK 범위 안에서만 돼요. 되는지 알게 되면 이 문서에 적을게요.

> 웹(브라우저) 링크로 앱을 여는 방법은 권장하지 않아요: 음악 · 사진 저장 · 파일 열기 등 폰 기능을 많이 써서 웹에서는 제대로 안 돌아가요.

## 친구에게 알려줄 것
- 가입은 **실제 이메일**로(또는 인증을 끈 기간이면 아무 이메일 형식으로도) 해요.
- 문제가 보이면 **화면 캡처 + 어떤 화면에서 무엇을 눌렀는지** 보내 달라고 해요.
- 친구가 만든 초대장 링크는 실제 Vercel 주소로 열려요 — 공유를 시작하면 누구나 볼 수 있으니 개인정보는 넣지 말라고 알려 주세요.

## 업데이트할 때
- 코드를 고친 뒤 위 `eas build`를 다시 하면 **새 링크**가 나와요. Android는 새 APK로 덮어 설치, iOS는 TestFlight에 새 빌드가 올라가요.
- 나중에 `expo-updates`(EAS Update)를 넣으면 **글자 · 화면 수정은 재설치 없이** 바로 보낼 수 있어요(아직 안 했어요).
