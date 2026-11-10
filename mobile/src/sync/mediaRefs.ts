import type { Block, Invitation, Photo } from '../editor/types';

/**
 * 초대장 안의 사진 · 내 음악 파일을 찾고 주소를 바꾸는 계산 (순수 계산 — 서버를 부르지 않아요).
 * 사진은 폰 안의 파일(file://…)로 시작하고, 서버(Storage)에 올라가면 인터넷 주소(https://…)로 바뀌어요.
 * 주소가 https로 시작하면 이미 올라간 거예요.
 */

export const isRemoteUri = (uri: string) => /^https?:\/\//i.test(uri);

function mapBlockPhotos(block: Block, fn: (p: Photo) => Photo): Block {
  if (block.type === 'image' && block.props.photo) return { ...block, props: { ...block.props, photo: fn(block.props.photo) } };
  if (block.type === 'gallery') return { ...block, props: { ...block.props, photos: block.props.photos.map(fn) } };
  return block;
}

/** 모든 페이지(초대장 · 안내 팝업 · 감사페이지)의 사진을 하나씩 바꿔요. */
export function mapPhotos(inv: Invitation, fn: (p: Photo) => Photo): Invitation {
  const pages = {
    invite: inv.pages.invite.map((b) => mapBlockPhotos(b, fn)),
    popup: inv.pages.popup.map((b) => mapBlockPhotos(b, fn)),
    thanks: inv.pages.thanks.map((b) => mapBlockPhotos(b, fn)),
  };
  return { ...inv, pages };
}

export function allPhotos(inv: Invitation): Photo[] {
  const out: Photo[] = [];
  mapPhotos(inv, (p) => {
    out.push(p);
    return p;
  });
  return out;
}

export type PendingMedia = {
  /** 아직 서버에 안 올라간 사진 파일 (같은 파일이 여러 곳에 쓰여도 한 번만). */
  photoUris: string[];
  /** 아직 안 올라간 내 음악 파일. */
  music?: string;
};

export function pendingMedia(inv: Invitation): PendingMedia {
  const photoUris = [...new Set(allPhotos(inv).map((p) => p.uri).filter((uri) => !isRemoteUri(uri)))];
  const file = inv.bgm?.mode === 'file' ? inv.bgm.file : undefined;
  return { photoUris, music: file && !isRemoteUri(file.uri) ? file.uri : undefined };
}

export const hasPendingMedia = (inv: Invitation) => {
  const p = pendingMedia(inv);
  return p.photoUris.length > 0 || Boolean(p.music);
};

export type UploadedPhoto = { url: string; width: number; height: number };

/** 올라간 파일의 인터넷 주소로 바꿔요(같은 파일을 쓰는 곳은 모두). */
export function applyUploads(inv: Invitation, photos: Record<string, UploadedPhoto>, music?: { from: string; url: string }): Invitation {
  let next = mapPhotos(inv, (p) => {
    const up = photos[p.uri];
    return up ? { ...p, uri: up.url, width: up.width, height: up.height } : p;
  });
  if (music && next.bgm?.file && next.bgm.file.uri === music.from) next = { ...next, bgm: { ...next.bgm, file: { ...next.bgm.file, uri: music.url } } };
  return next;
}

/** 이 초대장이 쓰고 있는 서버 파일 주소들 (사진 + 내 음악). */
export function referencedUrls(inv: Invitation): string[] {
  const urls = allPhotos(inv).map((p) => p.uri).filter(isRemoteUri);
  const file = inv.bgm?.file;
  if (file && isRemoteUri(file.uri)) urls.push(file.uri);
  return [...new Set(urls)];
}
