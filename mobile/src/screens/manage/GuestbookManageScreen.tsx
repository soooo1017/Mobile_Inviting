import { useState } from 'react';
import { Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { useProjects } from '../../state/ProjectsContext';
import { useInvitation } from '../../state/InvitationsContext';
import { useGuestData } from '../../state/guestData';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { SelectChip } from '../../components/SelectChip';
import { DarkToast } from '../../editor/ui';
import { guestSides } from '../../editor/format';
import type { BlockOfType } from '../../editor/types';
import { color, radius, space } from '../../theme/tokens';
import { textStyle } from '../../theme/typography';
import { EmptyNote, Guide, HeaderLink, isShared, ManageHeader, manageStyles, NotShared } from './common';
import { SideTag } from './RsvpStatusScreen';

type Props = NativeStackScreenProps<RootStackParamList, 'ManageGuestbook'>;

const PAGE_SIZE = 10;

/** "10.18 오후 9:12" */
function formatPostAt(iso: string) {
  const d = new Date(iso);
  const h = d.getHours();
  return `${d.getMonth() + 1}.${d.getDate()} ${h < 12 ? '오전' : '오후'} ${h % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/**
 * 방명록 관리 (E24) — every post in full, 10 per page. 만든 사람은 비밀번호 없이 지울 수 있어요:
 * [삭제하기] → 지울 글 고르기 → 한 번 더 확인.
 */
export function GuestbookManageScreen({ navigation, route }: Props) {
  const { getProject } = useProjects();
  const project = getProject(route.params.projectId);
  const { invitation, updateBlock } = useInvitation(route.params.projectId);
  const { posts, deletePosts } = useGuestData(route.params.projectId);
  const [side, setSide] = useState<'all' | 0 | 1>('all');
  const [page, setPage] = useState(0);
  const [picking, setPicking] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [confirm, setConfirm] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  if (!project) return <SafeAreaView style={manageStyles.screen} />;
  const blocks = (invitation?.pages.invite ?? []).filter((b): b is BlockOfType<'guestbook'> => b.type === 'guestbook');
  const block = blocks[0];
  const shared = isShared(project);
  const canPick = shared && !!block && posts.length > 0;

  const sides = block?.props.askSide ? guestSides(project) : [];
  const shown = posts.filter((p) => side === 'all' || p.side === side);
  const pages = Math.max(1, Math.ceil(shown.length / PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  const visible = shown.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE);

  const setVisibility = (visibility: 'public' | 'private') =>
    blocks.forEach((b) => updateBlock('invite', b.id, () => ({ ...b, props: { ...b.props, visibility } })));
  const pickSide = (next: 'all' | 0 | 1) => {
    setSide(next);
    setPage(0);
  };
  const togglePick = (id: string) => setPicked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const stopPicking = () => {
    setPicking(false);
    setPicked([]);
  };

  let body;
  if (!shared) {
    body = <NotShared what="방명록 글이" onShare={() => setToast('공유하기는 준비 중이에요')} />;
  } else if (!block) {
    body = (
      <Guide
        title="초대장에 방명록이 없어요"
        desc={'에디터에서 [+ 추가하기] › 방명록을 넣으면\n게스트가 남긴 글이 여기 모여요.'}
        action="에디터로 가기"
        onAction={() => navigation.navigate('Editor', { projectId: project.id })}
      />
    );
  } else {
    body = (
      <>
        <ScrollView contentContainerStyle={manageStyles.body}>
          {!picking ? (
            <>
              <View style={styles.topRow}>
                <Text style={styles.count}>{`${posts.length}개`}</Text>
                <View style={manageStyles.chips}>
                  <SelectChip label="공개" selected={block.props.visibility === 'public'} onPress={() => setVisibility('public')} />
                  <SelectChip label="우리만 보기" selected={block.props.visibility === 'private'} onPress={() => setVisibility('private')} />
                </View>
              </View>
              {sides.length ? (
                <View style={manageStyles.chips}>
                  <SelectChip label={`전체 ${posts.length}`} selected={side === 'all'} onPress={() => pickSide('all')} />
                  {([0, 1] as const).map((s) => (
                    <SelectChip
                      key={s}
                      label={`${sides[s]} ${posts.filter((p) => p.side === s).length}`}
                      selected={side === s}
                      onPress={() => pickSide(s)}
                    />
                  ))}
                </View>
              ) : null}
            </>
          ) : null}
          {visible.length ? (
            visible.map((p) => {
              const on = picked.includes(p.id);
              const content = (
                <>
                  <View style={styles.postHead}>
                    {sides.length && p.side !== undefined ? <SideTag side={p.side} label={sides[p.side]} /> : null}
                    <Text style={styles.postName}>{p.name}</Text>
                    <Text style={styles.postAt}>{formatPostAt(p.at)}</Text>
                  </View>
                  <Text style={styles.postText}>{p.text}</Text>
                </>
              );
              return picking ? (
                <Pressable key={p.id} onPress={() => togglePick(p.id)} style={[styles.post, styles.postPick, on && styles.postOn]}>
                  <View style={[styles.box, on && styles.boxOn]}>{on ? <Text style={styles.boxMark}>✓</Text> : null}</View>
                  <View style={styles.flex}>{content}</View>
                </Pressable>
              ) : (
                <View key={p.id} style={styles.post}>
                  {content}
                </View>
              );
            })
          ) : (
            <EmptyNote text={posts.length ? '조건에 맞는 글이 없어요' : '아직 남긴 글이 없어요'} />
          )}
          {pages > 1 ? (
            <View style={styles.pager}>
              <Pressable onPress={() => setPage(Math.max(0, current - 1))} hitSlop={8} disabled={current === 0}>
                <Text style={[styles.pageArrow, current === 0 && manageStyles.off]}>‹</Text>
              </Pressable>
              {Array.from({ length: pages }, (_, i) => (
                <Pressable key={i} onPress={() => setPage(i)} style={[styles.pageNum, i === current && styles.pageNumOn]}>
                  <Text style={[styles.pageNumText, i === current && styles.pageNumTextOn]}>{i + 1}</Text>
                </Pressable>
              ))}
              <Pressable onPress={() => setPage(Math.min(pages - 1, current + 1))} hitSlop={8} disabled={current === pages - 1}>
                <Text style={[styles.pageArrow, current === pages - 1 && manageStyles.off]}>›</Text>
              </Pressable>
            </View>
          ) : null}
        </ScrollView>
        <View style={manageStyles.footer}>
          {picking ? (
            <Pressable disabled={!picked.length} onPress={() => setConfirm(true)} style={[styles.danger, !picked.length && manageStyles.off]}>
              <Text style={styles.dangerLabel}>{picked.length ? `${picked.length}개 삭제하기` : '삭제할 글을 골라주세요'}</Text>
            </Pressable>
          ) : (
            <Pressable
              disabled={!posts.length}
              onPress={() => setToast('엑셀 내려받기는 준비 중이에요')}
              style={[manageStyles.outlineBtn, !posts.length && manageStyles.off]}
            >
              <Text style={manageStyles.outlineBtnLabel}>엑셀로 내려받기</Text>
            </Pressable>
          )}
        </View>
      </>
    );
  }

  return (
    <SafeAreaView style={manageStyles.screen} edges={['top', 'bottom']}>
      {picking ? (
        <View style={styles.pickHeader}>
          <HeaderLink label="취소" tone="muted" onPress={stopPicking} />
          <Text style={styles.pickTitle}>삭제할 글 고르기</Text>
          <HeaderLink label="전체 선택" onPress={() => setPicked(visible.map((p) => p.id))} />
        </View>
      ) : (
        <ManageHeader
          title="방명록 관리"
          onBack={() => navigation.goBack()}
          right={canPick ? <HeaderLink label="삭제하기" tone="danger" onPress={() => setPicking(true)} /> : undefined}
        />
      )}
      {body}
      <ConfirmDialog
        visible={confirm}
        title={`글 ${picked.length}개를 삭제할까요?`}
        confirmLabel="삭제하기"
        onCancel={() => setConfirm(false)}
        onConfirm={() => {
          deletePosts(picked);
          setConfirm(false);
          stopPicking();
          setToast('삭제했어요');
        }}
      >
        <Text style={styles.confirmBody}>삭제하면 되돌릴 수 없어요.</Text>
      </ConfirmDialog>
      <DarkToast message={toast} onHide={() => setToast(null)} bottom={90} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  count: {
    ...textStyle({ size: 'control', weight: 'semibold', color: color.ink.primary }),
  },
  post: {
    backgroundColor: color.bg.surface,
    borderWidth: 1,
    borderColor: color.line.default,
    borderRadius: radius.card,
    padding: space[6],
    gap: space[3],
  },
  postPick: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space[5],
  },
  postOn: {
    borderColor: color.status.error,
  },
  postHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
  },
  postName: {
    ...textStyle({ size: 'label', weight: 'semibold', color: color.ink.primary }),
  },
  postAt: {
    marginLeft: 'auto',
    ...textStyle({ size: 'caption', weight: 'regular', color: color.ink.muted }),
  },
  postText: {
    ...textStyle({ size: 'label', weight: 'regular', color: color.ink.secondary }),
    lineHeight: 21,
  },
  box: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: color.line.strong,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  boxOn: {
    backgroundColor: color.status.error,
    borderColor: color.status.error,
  },
  boxMark: {
    color: '#ffffff',
    fontSize: 11,
    fontFamily: 'Pretendard-SemiBold',
  },
  pager: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: space[3],
  },
  pageArrow: {
    ...textStyle({ size: 'title3', weight: 'regular', color: color.ink.secondary }),
    paddingHorizontal: space[3],
  },
  pageNum: {
    minWidth: 28,
    height: 28,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageNumOn: {
    backgroundColor: color.ink.primary,
  },
  pageNumText: {
    ...textStyle({ size: 'label', weight: 'regular', color: color.ink.muted }),
  },
  pageNumTextOn: {
    color: color.ink.onPrimary,
    fontFamily: 'Pretendard-SemiBold',
  },
  pickHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.screenX,
    paddingVertical: space[6],
  },
  pickTitle: {
    ...textStyle({ size: 'title3', weight: 'semibold', color: color.ink.primary }),
  },
  danger: {
    backgroundColor: color.status.error,
    borderRadius: radius.button,
    paddingVertical: 14,
    alignItems: 'center',
  },
  dangerLabel: {
    ...textStyle({ size: 'control', weight: 'semibold', color: '#ffffff' }),
  },
  confirmBody: {
    ...textStyle({ size: 'label', weight: 'regular', color: color.ink.secondary }),
  },
});
