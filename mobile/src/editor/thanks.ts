import type { EventType, Project } from '../types/project';
import { newId, type Block, type Photo, type ThanksSimple } from './types';

/** 감사페이지 간단 모드 기본 문구 (2026-10-18 확정). */
const DEFAULTS: Record<EventType, { title: string; message: string }> = {
  wedding: {
    title: '감사합니다',
    message: '귀한 시간 내어 저희의 결혼을 축하해 주셔서 진심으로 감사드립니다.\n보내주신 따뜻한 마음 잊지 않고 서로 아끼며 예쁘게 살겠습니다.',
  },
  first_birthday: {
    title: '감사합니다',
    message: '바쁘신 중에도 아이의 첫 생일을 함께 축하해 주셔서 감사합니다.\n보내주신 사랑만큼 건강하고 밝게 키우겠습니다.',
  },
  '100days': {
    title: '감사합니다',
    message: '아이의 백일을 함께 축하해 주셔서 감사합니다.\n따뜻한 축복 덕분에 더 건강하게 키우겠습니다.',
  },
  birthday: {
    title: '고마워요',
    message: '제 생일을 함께 축하해 줘서 정말 고마워요.\n덕분에 잊지 못할 하루가 됐어요.',
  },
  housewarming: {
    title: '감사합니다',
    message: '새 보금자리에 찾아와 축하해 주셔서 감사합니다.\n언제든 편하게 놀러 오세요.',
  },
  opening: {
    title: '감사합니다',
    message: '개업을 축하해 주셔서 진심으로 감사드립니다.\n보내주신 응원에 보답할 수 있도록 정성을 다하겠습니다.',
  },
  reunion: {
    title: '고마워요',
    message: '오랜만에 함께해 줘서 고마워요.\n덕분에 즐거운 시간이었어요. 다음 모임에서 또 만나요.',
  },
  other: {
    title: '감사합니다',
    message: '귀한 시간 내어 함께해 주셔서 진심으로 감사드립니다.',
  },
};

export function defaultThanksTitle(project: Project) {
  return DEFAULTS[project.eventType].title;
}

export function defaultThanksMessage(project: Project) {
  return DEFAULTS[project.eventType].message;
}

/** True when the last Hangul syllable has a final consonant (하준 → 하준이네, 지아 → 지아네). */
function hasFinalConsonant(word: string): boolean {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  return code >= 0 && code <= 11171 && code % 28 !== 0;
}

/** "신랑 민석 · 신부 지원 드림", "하준이네 드림", "카페 온기 · 대표 김민석 드림" … — empty when no names were entered. */
export function defaultThanksSender(project: Project): string {
  const name = (i: number) => project.hosts[i]?.name.trim() ?? '';
  const label = (i: number) => project.hosts[i]?.label ?? '';
  let from = '';
  switch (project.eventType) {
    case 'wedding':
      from = [0, 1].filter((i) => name(i)).map((i) => `${label(i)} ${name(i)}`).join(' · ');
      break;
    case 'first_birthday':
    case '100days':
      from = name(0) ? `${name(0)}${hasFinalConsonant(name(0)) ? '이네' : '네'}` : name(1);
      break;
    case 'opening':
      from = [name(0), name(1) && `${label(1)} ${name(1)}`].filter(Boolean).join(' · ');
      break;
    case 'reunion':
      from = name(1) ? `${label(1)} ${name(1)}` : name(0);
      break;
    default:
      from = name(0);
  }
  return from ? `${from} 드림` : '';
}

/** What the simple page shows: saved text, or the event type's defaults. */
export function resolveThanks(project: Project, simple: ThanksSimple) {
  return {
    title: simple.title ?? defaultThanksTitle(project),
    message: simple.message ?? defaultThanksMessage(project),
    sender: simple.showSender ? (simple.sender ?? defaultThanksSender(project)) : '',
  };
}

/** 간단하게 → 자유롭게: the same content as editable 텍스트 · 이미지, so nothing is lost. */
export function simpleThanksToBlocks(project: Project, simple: ThanksSimple, photo: Photo | undefined): Block[] {
  const { title, message, sender } = resolveThanks(project, simple);
  const blocks: Block[] = [];
  if (title) blocks.push({ id: newId(), type: 'text', props: { format: 'h1', content: title } });
  if (photo) blocks.push({ id: newId(), type: 'image', props: { photo, ratio: '4:5', crop: { x: 0, y: 0, scale: 1 } } });
  if (message) blocks.push({ id: newId(), type: 'text', props: { format: 'b1', content: message } });
  if (sender) blocks.push({ id: newId(), type: 'text', props: { format: 'b2', content: sender } });
  return blocks;
}
