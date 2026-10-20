import { LabeledInput } from './sheets/common';
import { venueAddressLine } from './maps';
import type { Project, Venue } from '../types/project';

export function currentVenue(project: Project): Venue {
  return project.venue ?? { name: '', address: '', sido: '', mapLinks: { naver: true, kakao: true } };
}

/** 장소 이름 · 주소 — the project's 행사 장소, edited from the 장소 sheet, ⚙ 전체 설정 and 프로젝트 설정 alike. */
export function VenueFields({ project, onVenue }: { project: Project; onVenue: (venue: Venue) => void }) {
  const venue = currentVenue(project);
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
        value={venueAddressLine(venue)}
        onChangeText={(address) => onVenue({ ...venue, address })}
        placeholder="예: 서울 강남구 선릉로 757 · 3층 그랜드홀"
        maxLength={80}
      />
    </>
  );
}
