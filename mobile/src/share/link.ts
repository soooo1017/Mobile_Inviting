import type { LinkMode, Project, ProjectLink } from '../types/project';

/**
 * 초대장 링크 — 초대장을 만들 때 정하고, **공유를 시작하기 전까지만** 바꿀 수 있어요 (QR · 홍보물도 이 주소를 써요).
 * 서버 연결 전이라 아직 열리지 않는 예시 주소예요. 진짜 도메인이 정해지면 SHARE_BASE_URL 한 곳만 바꿔요.
 *
 * 링크 모양: `주소/i/<뒷부분>` — 뒷부분은 자동(랜덤 8자) 또는 원하는 문구 + `-` + 랜덤 4자.
 * 랜덤 글자가 붙어서 추측하기 어렵고, 서버 없이도 겹칠 일이 거의 없어요.
 */
export const SHARE_BASE_URL = 'https://invite.example/i';

export const LINK_PHRASE_MIN = 3;
export const LINK_PHRASE_MAX = 12;
const AUTO_LENGTH = 8;
const RAND_LENGTH = 4;
const ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';
/** 사이트의 다른 주소와 겹칠 수 있어서 쓰지 못하는 문구. */
const RESERVED_PHRASES = ['admin', 'login', 'api', 'app', 'www', 'help', 'invite', 'static', 'assets', 'terms', 'privacy', 'support', 'test', 'guest', 'share'];

function randomChars(length: number): string {
  let out = '';
  for (let i = 0; i < length; i += 1) out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return out;
}

/** 입력창에 쓴 글자에서 쓸 수 없는 글자를 걸러요 (영문 소문자 · 숫자 · -). */
export function normalizePhrase(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9-]/g, '');
}

/** 문구가 쓸 수 있으면 null, 아니면 안내 문구. 비어 있으면 null (아직 입력 전). */
export function phraseError(phrase: string): string | null {
  if (!phrase) return null;
  if (phrase.length < LINK_PHRASE_MIN) return `${LINK_PHRASE_MIN}자 이상 적어주세요`;
  if (/^-|-$/.test(phrase)) return '- 로 시작하거나 끝낼 수 없어요';
  if (RESERVED_PHRASES.includes(phrase)) return '사용할 수 없는 문구예요';
  return null;
}

/** 링크를 고르는 화면(새 초대장 6/6 · 링크 변경)에서 쓰는 선택 상태. */
export type LinkChoice = { mode: LinkMode; phrase: string; rand: string; auto: string };

export function freshLinkChoice(): LinkChoice {
  return { mode: 'auto', phrase: '', rand: randomChars(RAND_LENGTH), auto: randomChars(AUTO_LENGTH) };
}

/** 지금 초대장의 링크에서 선택 상태를 만들어요 (링크 변경 화면을 열 때). */
export function choiceFromProject(project: Project): LinkChoice {
  const fresh = freshLinkChoice();
  const link = project.link;
  if (!link) return fresh;
  return link.mode === 'custom'
    ? { ...fresh, mode: 'custom', phrase: link.phrase, rand: link.rand }
    : { ...fresh, mode: 'auto', auto: link.slug };
}

/** 선택을 끝낼 수 있는지 — 문구 방식은 문구가 맞아야 해요. */
export function choiceReady(choice: LinkChoice): boolean {
  return choice.mode === 'auto' || (choice.phrase.length > 0 && phraseError(choice.phrase) === null);
}

export function slugFromChoice(choice: LinkChoice): string {
  return choice.mode === 'auto' ? choice.auto : `${choice.phrase}-${choice.rand}`;
}

export function linkFromChoice(choice: LinkChoice, locked = false): ProjectLink {
  return {
    slug: slugFromChoice(choice),
    mode: choice.mode,
    phrase: choice.mode === 'custom' ? choice.phrase : '',
    rand: choice.mode === 'custom' ? choice.rand : '',
    locked,
  };
}

/** 링크 뒷부분 — 새 방식이면 slug, 예전 초대장은 프로젝트 id. */
export function linkSlug(project: Project): string {
  return project.link?.slug ?? project.id;
}

/** 공유를 시작할 때 링크를 고정해요 — 예전 초대장(link 없음)은 지금 주소(프로젝트 id)를 그대로 고정. */
export function lockedLink(project: Project): ProjectLink {
  return project.link ? { ...project.link, locked: true } : { slug: project.id, mode: 'auto', phrase: '', rand: '', locked: true };
}

/** 한 번이라도 공유를 시작했으면 바꿀 수 없어요 (예전 초대장은 공유 중인 것만 고정). */
export function isLinkLocked(project: Project): boolean {
  return project.link?.locked ?? project.shared;
}

export function shareUrl(project: Project): string {
  return `${SHARE_BASE_URL}/${linkSlug(project)}`;
}

/** 화면에 보여줄 때는 https:// 를 떼요. */
export function shareUrlLabel(project: Project): string {
  return shareUrl(project).replace(/^https?:\/\//, '');
}

/** 새 초대장 예시 링크 (https:// 없이) — 입력하는 동안 보여줘요. */
export function exampleLabel(choice: LinkChoice): string {
  return `${SHARE_BASE_URL.replace(/^https?:\/\//, '')}/${choice.mode === 'auto' ? choice.auto : `${choice.phrase || 'minseok'}-${choice.rand}`}`;
}
