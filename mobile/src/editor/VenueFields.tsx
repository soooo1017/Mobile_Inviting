import { LabeledInput } from './sheets/common';
import type { Project, Venue } from '../types/project';

export function currentVenue(project: Project): Venue {
  return project.venue ?? { name: '', address: '', sido: '', mapLinks: { naver: true, kakao: true } };
}

/** 장소 이름 · 주소 — the project's 행사 장소, edited from the 장소 sheet and ⚙ 초대장 설정. */
export function VenueFields({ project, onVenue }: { project: Project; onVenue: (venue: Venue) => void }) {
  const venue = currentVenue(project);
  // 입력칸에는 적은 그대로(띄어쓰기 · 끝의 공백 포함)를 보여줘요 — 다듬은 값을 되돌려 넣으면 끝에 친 띄어쓰기가 바로 지워져요.
  const addressValue = venue.address.trim() === venue.name.trim() ? '' : venue.address;
  return (
    <>
      <LabeledInput
        label="장소 이름"
        value={venue.name}
        onChangeText={(name) =>
          // The new-project step stores one text as both name and address — keep them together until the address is set apart.
          onVenue(venue.address === venue.name ? { ...venue, name, address: name } : { ...venue, name })
        }
        placeholder="예: 더채플앳청담"
        maxLength={40}
      />
      <LabeledInput
        label="주소"
        sub="층 · 홀까지 적어도 돼요"
        value={addressValue}
        onChangeText={(address) => onVenue({ ...venue, address })}
        placeholder="예: 서울 강남구 선릉로 757 · 3층 그랜드홀"
        maxLength={80}
      />
    </>
  );
}
