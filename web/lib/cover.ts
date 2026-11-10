import type { Block, InvitationContent, Photo } from './model';

/** 서버에 올라간 https 사진만(폰 안의 파일 주소는 하객이 열 수 없어요). */
export function usablePhoto(p: Photo | undefined): p is Photo {
  return !!p && /^https:\/\//i.test(p.uri) && p.width > 0 && p.height > 0;
}

/** 대표 사진 — 초대장 사진 중 골라 둔 것, 없으면 첫 사진 (앱의 coverPhoto와 같아요). 감사페이지 · 공유 미리보기에 써요. */
export function coverPhoto(pages: { invite: Block[] }, coverId: string | undefined): Photo | undefined {
  const all: Photo[] = [];
  for (const b of pages.invite) {
    if (b.type === 'image' && b.props.photo) all.push(b.props.photo);
    if (b.type === 'gallery') all.push(...b.props.photos);
  }
  const ok = all.filter(usablePhoto);
  return ok.find((p) => p.id === coverId) ?? ok[0];
}

export function coverOf(content: InvitationContent | undefined): Photo | undefined {
  return content?.pages ? coverPhoto({ invite: content.pages.invite ?? [] }, content.coverPhotoId) : undefined;
}
