#!/bin/bash
# 더블클릭하면 최신 코드를 받고 Expo Go용 서버를 켜요. (이 파일이 있는 폴더 기준이라 위치가 바뀌어도 돼요)
cd "$(dirname "$0")" || exit 1
git pull origin claude/inspiring-mendel-ksvase
cd mobile || exit 1
# 새 부품이 추가된 업데이트면 설치가 필요해요(이미 있으면 몇 초 만에 끝나요).
npm install
npx expo start -c
