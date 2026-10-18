import type { Invitation, Photo } from './types';

export type PhotoGroup = { key: string; label: string; photos: Photo[] };

/** Every photo on the invite page, grouped by where it sits (이미지 / 갤러리 · N장), top to bottom. */
export function invitePhotoGroups(inv: Invitation): PhotoGroup[] {
  const groups: PhotoGroup[] = [];
  for (const b of inv.pages.invite) {
    if (b.type === 'image' && b.props.photo) groups.push({ key: b.id, label: '이미지', photos: [b.props.photo] });
    if (b.type === 'gallery' && b.props.photos.length) groups.push({ key: b.id, label: `갤러리 · ${b.props.photos.length}장`, photos: b.props.photos });
  }
  return groups;
}

/** 대표 사진: the chosen one while it's still on the invite page, otherwise the first photo. */
export function coverPhoto(inv: Invitation): Photo | undefined {
  const all = invitePhotoGroups(inv).flatMap((g) => g.photos);
  return all.find((p) => p.id === inv.coverPhotoId) ?? all[0];
}
