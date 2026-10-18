# Expo Go로 앱 실행하는 방법 (맥북)

맥북 터미널에서 앱을 띄우고, 폰의 Expo Go로 확인하는 순서.
맥북에는 `~/Desktop/Wedding_Mobile_Inviting` 폴더로 받아져 있다.

> GitHub 저장소 이름이 `Wedding_Mobile_Inviting` → `Mobile_Inviting`으로 바뀌었다. 예전 주소도 자동으로 연결되므로 기존 폴더는 그대로 쓰면 된다(폴더 이름은 안 바뀜).

## 매번 할 것

```bash
cd ~/Desktop/Wedding_Mobile_Inviting
git pull origin claude/inspiring-mendel-ksvase
cd mobile
npm install
npx expo start -c
```

1. 터미널에 QR코드가 뜨면 아이폰 **카메라**로 찍는다 → Expo Go에서 열림 (안드로이드는 Expo Go 앱 안에서 스캔)
2. 맥북과 폰이 **같은 와이파이**에 있어야 한다
3. 끝낼 때는 터미널에서 `Ctrl + C`

| 명령어 | 하는 일 |
|---|---|
| `cd ~/Desktop/Wedding_Mobile_Inviting` | 프로젝트 폴더로 이동 |
| `git pull origin claude/inspiring-mendel-ksvase` | GitHub에 올라간 최신 코드 받기 |
| `cd mobile` | 앱 코드가 있는 `mobile` 폴더로 이동 |
| `npm install` | 새로 추가된 라이브러리 설치 (없으면 금방 끝남) |
| `npx expo start -c` | 앱 서버 실행. `-c`는 이전 캐시를 지우고 새로 시작 |

## 처음 한 번만 (새 맥북이거나 폴더가 없을 때)

1. 프로그램 확인: `git --version`, `node -v` — node가 없거나 20 미만이면 [nodejs.org](https://nodejs.org)에서 LTS 설치 후 터미널 재시작
2. 받아둔 폴더 찾기:
   ```bash
   find ~ -maxdepth 4 -type d -iname "Wedding_Mobile_Inviting" 2>/dev/null
   ```
   `mobile` 폴더 **안에** 또 `Wedding_Mobile_Inviting`이 있으면 실수로 생긴 복사본이니 밖으로 옮긴다(같은 파일이 두 벌이면 실행 오류가 날 수 있음).
3. 폴더가 없으면 코드 받기:
   ```bash
   cd ~/Desktop
   git clone https://github.com/soooo1017/Mobile_Inviting.git Wedding_Mobile_Inviting
   cd Wedding_Mobile_Inviting
   git checkout claude/inspiring-mendel-ksvase
   ```
   비밀번호를 물으면 GitHub 비밀번호가 아니라 Personal access token을 넣는다. GitHub Desktop 앱으로 Clone해도 된다.
4. `mobile/.env` 만들기 — 저장소에는 올리지 않는 파일이라 직접 만든다. 형식은 `mobile/.env.example`, 실제 값은 노션 "Expo Go로 앱 실행하는 방법" 페이지 참고.

## 잘 안 될 때

| 증상 | 해결 |
|---|---|
| `cd: no such file or directory` | 폴더 위치가 다름 → 위 2번(폴더 찾기) |
| QR 찍어도 연결이 안 됨 | 같은 와이파이인지 확인. 그래도 안 되면 `npx expo start -c --tunnel` |
| `git pull`에서 `conflict` / `error` | 다음으로 넘어가지 말고 메시지를 그대로 전달 |
| 빨간 화면 / 바뀐 게 안 보임 | `Ctrl + C` 후 `npx expo start -c` 다시 실행, 폰에서 Expo Go 완전히 껐다 켜기 |
| 로그인 등 Supabase 오류 | `mobile/.env`가 있는지 확인 |
