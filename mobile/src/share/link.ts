import type { Project } from '../types/project';

/**
 * 초대장 링크 — 초대장을 만들는 순간 정해지고 바뀌지 않아요 (QR · 홍보물도 이 주소를 써요).
 * 서버 연결 전이라 아직 열리지 않는 예시 주소예요. 진짜 도메인이 정해지면 이 한 곳만 바꿔요.
 */
export const SHARE_BASE_URL = 'https://invite.example/i';

export function shareUrl(project: Project): string {
  return `${SHARE_BASE_URL}/${project.id}`;
}

/** 화면에 보여줄 때는 https:// 를 떼요. */
export function shareUrlLabel(project: Project): string {
  return shareUrl(project).replace(/^https?:\/\//, '');
}
