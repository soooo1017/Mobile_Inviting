import type { Project } from '../types/project';
import { formatWhen } from '../editor/format';
import { shareUrl } from './link';

/** 메시지 작성하기 — 인사말 속 {정보}를 초대장의 실제 값으로 바꿔서 보내요(문자 보낼 때 이름을 끼워 넣는 "머지 문자"와 같은 방식). */

export const MESSAGE_MAX = 500;
/** 버튼으로 바로 넣는 정보 — 거의 매번 쓰는 것들. 사람 이름은 [이름 ▾]에서 골라요. */
export const FIXED_TOKENS = ['초대장 링크', '일시', '장소'] as const;

/** 넣을 수 있는 정보와 지금 값. 사람은 저장된 구성원별로(신랑 · 신부 · 아이 · 총무 …) 들어 있고, 이름이 빈 칸은 빼요. */
export function messageValues(project: Project): Record<string, string> {
  const values: Record<string, string> = {
    '초대장 링크': shareUrl(project),
    일시: formatWhen(project.eventAt),
    장소: project.venue?.name?.trim() ?? '',
    '초대장 이름': project.title,
  };
  for (const h of project.hosts) {
    const label = h.label.trim();
    const name = h.name.trim();
    if (label && name && !(label in values)) values[label] = name;
  }
  return values;
}

/** [이름 ▾]에 보여줄 정보 — {초대장 이름}과 구성원별 이름. */
export function personTokens(project: Project): string[] {
  return Object.keys(messageValues(project)).filter((k) => !(FIXED_TOKENS as readonly string[]).includes(k));
}

/** {정보}를 값으로 바꿔요. 이름이 다른 {…}는 그대로 남겨요. */
export function resolveMessage(text: string, values: Record<string, string>): string {
  return text.replace(/\{([^{}]+)\}/g, (whole, key: string) => (key in values ? values[key] : whole));
}

/** 커서(선택) 자리에 {정보}를 넣어요. 글자 수를 넘으면 null. */
export function insertToken(text: string, selection: { start: number; end: number }, token: string): { text: string; cursor: number } | null {
  const tag = `{${token}}`;
  const start = Math.min(selection.start, selection.end);
  const end = Math.max(selection.start, selection.end);
  if (text.length - (end - start) + tag.length > MESSAGE_MAX) return null;
  return { text: text.slice(0, start) + tag + text.slice(end), cursor: start + tag.length };
}
