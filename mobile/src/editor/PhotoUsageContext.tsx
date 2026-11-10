import { createContext, useContext, useState, type ReactNode } from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { Checkbox } from '../components/Checkbox';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { color, space } from '../theme/tokens';
import { textStyle } from '../theme/typography';
import type { Block, PageKey, Photo } from './types';

type OtherPage = Extract<PageKey, 'popup' | 'thanks'>;
export type RemovedBlock = { page: PageKey; block: Block; index: number };
export type PhotoChange = 'delete' | 'replace';

/**
 * 초대장의 사진을 지우거나 바꿀 때, 같은 사진을 안내 팝업 · 감사페이지가 쓰고 있는지 알려주고 반영해요.
 * 에디터가 초대장 페이지를 편집하는 동안에만 값을 줘요(안내 팝업 · 감사페이지를 고칠 때는 물어볼 게 없어요).
 */
export type PhotoUsage = {
  /** 이 사진들이 초대장에서 빠질 때 같은 사진을 쓰고 있는 다른 페이지. */
  pagesUsing: (photos: Photo[]) => OtherPage[];
  /** 고른 페이지에 반영해요 — delete: 그 이미지 항목을 지움 · replace: 새 사진으로 바꿈. 지운 항목은 되돌리기용으로 돌려줘요. */
  apply: (kind: PhotoChange, photos: Photo[], pages: OtherPage[], next?: Photo) => RemovedBlock[];
};

export const PhotoUsageContext = createContext<PhotoUsage | null>(null);

const PAGE_LABEL: Record<OtherPage, string> = { popup: '안내 팝업', thanks: '감사페이지' };

type Request = { kind: PhotoChange; photos: Photo[]; next?: Photo; pages: OtherPage[]; proceed: (extra: RemovedBlock[]) => void };

/**
 * `request(...)`로 사진을 지우거나 바꾸려는 일을 알리면, 다른 페이지가 같은 사진을 쓰는 경우에만 확인 창을 띄우고
 * (아니면 바로 `proceed`) 고른 대로 반영한 뒤 `proceed`를 불러요. 쓰는 화면이 `dialog`를 그려야 해요(모달 안에서 부르면 그 안에).
 */
export function usePhotoChange() {
  const usage = useContext(PhotoUsageContext);
  const [req, setReq] = useState<Request | null>(null);

  const request = (kind: PhotoChange, photos: Photo[], next: Photo | undefined, proceed: (extra: RemovedBlock[]) => void) => {
    const pages = usage && photos.length ? usage.pagesUsing(photos) : [];
    if (!usage || !pages.length) {
      proceed([]);
      return;
    }
    setReq({ kind, photos, next, pages, proceed });
  };

  const dialog: ReactNode = req ? (
    <PhotoUsageDialog
      key={`${req.kind}-${req.photos.map((p) => p.id).join(',')}`}
      kind={req.kind}
      pages={req.pages}
      onCancel={() => setReq(null)}
      onConfirm={(selected) => {
        const extra = usage ? usage.apply(req.kind, req.photos, selected, req.next) : [];
        const proceed = req.proceed;
        setReq(null);
        proceed(extra);
      }}
    />
  ) : null;

  return { request, dialog };
}

function PhotoUsageDialog({ kind, pages, onCancel, onConfirm }: { kind: PhotoChange; pages: OtherPage[]; onCancel: () => void; onConfirm: (pages: OtherPage[]) => void }) {
  // 처음엔 쓰고 있는 곳 모두 함께 반영해요. 체크를 풀면 그곳은 그대로 둬요.
  const [checked, setChecked] = useState<OtherPage[]>(pages);
  const toggle = (p: OtherPage) => setChecked((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  const names = pages.map((p) => PAGE_LABEL[p]).join(' · ');
  const del = kind === 'delete';
  return (
    <ConfirmDialog
      visible
      title="다른 곳에서도 쓰는 사진이에요"
      confirmLabel={del ? '삭제하기' : '바꾸기'}
      tone={del ? 'danger' : 'primary'}
      onCancel={onCancel}
      onConfirm={() => onConfirm(checked)}
    >
      <Text style={styles.body}>{`이 사진은 ${names}에서도 쓰고 있어요.`}</Text>
      <View style={styles.list}>
        {pages.map((p) => (
          <Pressable key={p} onPress={() => toggle(p)} style={styles.row}>
            <Checkbox checked={checked.includes(p)} onPress={() => toggle(p)} tone={del ? 'error' : 'select'} />
            <Text style={styles.rowLabel}>{del ? `${PAGE_LABEL[p]}에서도 삭제` : `${PAGE_LABEL[p]}에서도 새 사진으로 바꾸기`}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.help}>
        {del
          ? '체크를 풀면 그 페이지에는 사진이 그대로 남아요. 남은 사진은 그 페이지에서 따로 추가한 사진으로 바뀌어요.'
          : '체크를 풀면 그 페이지에는 이전 사진이 그대로 남아요. 남은 사진은 그 페이지에서 따로 추가한 사진으로 바뀌어요.'}
      </Text>
    </ConfirmDialog>
  );
}

const styles = StyleSheet.create({
  body: { ...textStyle({ size: 'label', weight: 'regular', color: color.ink.secondary }), lineHeight: 21 },
  list: { gap: space[5], marginTop: space[2] },
  row: { flexDirection: 'row', alignItems: 'center', gap: space[4] },
  rowLabel: { flex: 1, ...textStyle({ size: 'label', weight: 'medium', color: color.ink.primary }) },
  help: { ...textStyle({ size: 'small', weight: 'regular', color: color.ink.muted }), lineHeight: 19 },
});
