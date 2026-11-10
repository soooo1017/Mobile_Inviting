import type { Block, Invitation, Photo } from './types';

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

/** 초대장 페이지의 사진 전부 (이미지 · 갤러리, 위에서 아래로). */
export function invitePhotos(inv: Invitation): Photo[] {
  return invitePhotoGroups(inv).flatMap((g) => g.photos);
}

/** 이미지 항목이 쓰고 있는 사진 (갤러리는 여러 장). */
export function blockPhotos(block: Block): Photo[] {
  if (block.type === 'image') return block.props.photo ? [block.props.photo] : [];
  if (block.type === 'gallery') return block.props.photos;
  return [];
}

/**
 * 안내 팝업 · 감사페이지의 이미지는 초대장 사진 중 하나를 그대로 쓸 수 있어요. 같은 파일을 가리키면 사진 id는 달라도 uri가 같아요.
 * 초대장에서 `removed` 사진들이 빠지면(삭제 · 바꾸기) 그 파일을 쓰고 있는 안내 팝업 / 감사페이지(자유)를 돌려줘요.
 * 초대장 안의 다른 곳에 같은 파일이 남아 있으면 빠지는 게 아니라서 제외해요.
 */
export function otherPagesUsing(inv: Invitation, removed: Photo[]): ('popup' | 'thanks')[] {
  const removedIds = new Set(removed.map((p) => p.id));
  const staying = new Set(invitePhotos(inv).filter((p) => !removedIds.has(p.id)).map((p) => p.uri));
  const leaving = new Set(removed.map((p) => p.uri).filter((uri) => !staying.has(uri)));
  if (!leaving.size) return [];
  return (['popup', 'thanks'] as const).filter((page) => inv.pages[page].some((b) => b.type === 'image' && b.props.photo && leaving.has(b.props.photo.uri)));
}
