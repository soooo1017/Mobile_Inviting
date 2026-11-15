import { SIDO_LIST } from '../types/project';

/**
 * 주소 검색(카카오 · 다음 우편번호 서비스)이 돌려주는 값을 앱의 장소 입력으로 바꿔요 — 순수한 함수라 시험하기 쉬워요.
 * 장소 이름은 직접 적고, 주소는 검색으로 고르고, 상세 주소(층 · 홀)는 따로 적어요. 지도 앱에는 기본 주소만 넘겨요.
 */

export type AddressPick = {
  /** 기본 주소 — 도로명(없으면 지번). 층 · 홀은 안 들어가요. */
  address: string;
  zip: string;
  /** 앱의 시 · 도 이름(서울 · 경기 …) — 목록 필터에 써요. */
  sido: string;
  /** 건물 이름(없으면 빈 글자) — 장소 이름이 비어 있을 때 채워 줘요. */
  building: string;
};

const LONG_SIDO: [string, string][] = [
  ['충청북', '충북'],
  ['충청남', '충남'],
  ['전라북', '전북'],
  ['전북', '전북'],
  ['전라남', '전남'],
  ['경상북', '경북'],
  ['경상남', '경남'],
];

/** "서울" · "경기도" · "강원특별자치도" · "충청북도" … → 앱이 쓰는 17개 시 · 도 이름. 모르면 빈 글자. */
export function normalizeSido(raw: string): string {
  const s = raw.trim();
  const long = LONG_SIDO.find(([prefix]) => s.startsWith(prefix));
  if (long) return long[1];
  return SIDO_LIST.find((x) => s.startsWith(x)) ?? '';
}

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

/** 검색 창이 보내는 값(JSON)에서 고른 주소를 꺼내요. 쓸 수 없는 값이면 null. */
export function parsePostcode(data: unknown): AddressPick | null {
  if (!data || typeof data !== 'object') return null;
  const d = data as Record<string, unknown>;
  const road = str(d.roadAddress);
  const jibun = str(d.jibunAddress);
  // 사용자가 지번(J)을 골랐으면 지번, 아니면 도로명을 써요.
  const address = d.userSelectedType === 'J' && jibun ? jibun : road || jibun || str(d.address);
  if (!address) return null;
  return { address, zip: str(d.zonecode), sido: normalizeSido(str(d.sido)), building: str(d.buildingName) };
}
