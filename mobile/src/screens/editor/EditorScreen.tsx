import { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, View, StyleSheet, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CommonActions } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { useProjects } from '../../state/ProjectsContext';
import { useInvitation } from '../../state/InvitationsContext';
import { color, radius, space } from '../../theme/tokens';
import { textStyle } from '../../theme/typography';
import { Canvas } from '../../editor/canvas/Canvas';
import { CanvasContext, type CanvasContextValue } from '../../editor/canvas/CanvasContext';
import { invitationTheme } from '../../editor/invitationTheme';
import { ReorderView } from '../../editor/ReorderView';
import { AddBlockSheet } from '../../editor/AddBlockSheet';
import { SettingsSheet } from '../../editor/SettingsSheet';
import { BlockSheet, isFullScreenEditor } from '../../editor/sheets/BlockSheet';
import { DarkToast } from '../../editor/ui';
import { EyeIcon, GearIcon, SortIcon } from '../../editor/icons';
import { blockLabel, blockSummary } from '../../editor/format';
import { defaultBlock, type Block, type BlockType, type PageKey } from '../../editor/types';
import type { Project } from '../../types/project';

type Props = NativeStackScreenProps<RootStackParamList, 'Editor'>;

type Toast = { message: string; undo?: () => void } | null;

export function EditorScreen({ navigation, route }: Props) {
  const { getProject, updateProject } = useProjects();
  const project = getProject(route.params.projectId);

  if (!project) {
    return (
      <SafeAreaView style={styles.screen}>
        <Text style={styles.missing}>초대장을 찾을 수 없어요</Text>
      </SafeAreaView>
    );
  }
  return <Editor project={project} initialTab={route.params.tab} navigation={navigation} updateProject={updateProject} />;
}

function Editor({
  project,
  initialTab,
  navigation,
  updateProject,
}: {
  project: Project;
  initialTab?: PageKey;
  navigation: Props['navigation'];
  updateProject: ReturnType<typeof useProjects>['updateProject'];
}) {
  const { invitation, insertBlock, updateBlock, removeBlock, duplicateBlock, moveBlock, setFont } = useInvitation(project.id);
  const { height: screenH } = useWindowDimensions();
  // [감사페이지] 탭은 감사페이지를 쓰는 경우에만 보여요.
  const hasThanks = project.thanks.enabled;
  const [page, setPage] = useState<PageKey>(hasThanks && initialTab === 'thanks' ? 'thanks' : 'invite');
  const [mode, setMode] = useState<'edit' | 'reorder'>('edit');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [addAt, setAddAt] = useState<number | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [toast, setToast] = useState<Toast>(null);
  const scrollRef = useRef<ScrollView>(null);
  const blockY = useRef<Record<string, number>>({});

  const theme = invitationTheme(project.themeId);
  const blocks = invitation?.pages[page] ?? [];
  const selected = blocks.find((b) => b.id === selectedId) ?? null;

  const showToast = useCallback((message: string) => setToast({ message }), []);
  const canvasValue = useMemo<CanvasContextValue | null>(
    () => (invitation ? { project, theme, defaultFont: invitation.font, mode: 'edit', showToast } : null),
    [invitation, project, theme, showToast],
  );

  const exit = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'MainTabs' }] }));
  };

  const select = (block: Block) => {
    setSelectedId(block.id);
    // Keep the tapped block visible above the sheet.
    if (!isFullScreenEditor(block.type)) {
      const y = blockY.current[block.id];
      if (y !== undefined) setTimeout(() => scrollRef.current?.scrollTo({ y: Math.max(0, y - 12), animated: true }), 60);
    }
  };

  const openReorder = (block?: Block) => {
    setSelectedId(null);
    setHighlightId(block?.id ?? null);
    setMode('reorder');
  };

  const addBlock = (type: BlockType) => {
    const index = addAt ?? blocks.length;
    const block = defaultBlock(type);
    insertBlock(page, block, index);
    setAddAt(null);
    if (mode === 'reorder') {
      setHighlightId(block.id);
    } else {
      // A new block opens straight into its editor so it can be filled in.
      setTimeout(() => select(block), 250);
    }
  };

  const deleteBlock = (block: Block, index: number) => {
    removeBlock(page, block.id);
    if (highlightId === block.id) setHighlightId(null);
    setToast({ message: '블록을 삭제했어요', undo: () => insertBlock(page, block, index) });
  };

  if (!invitation || !canvasValue) {
    return (
      <SafeAreaView style={[styles.screen, styles.center]}>
        <ActivityIndicator color={color.accent.base} />
      </SafeAreaView>
    );
  }

  const addWhere =
    addAt === null || addAt >= blocks.length
      ? '맨 아래에 추가돼요'
      : addAt === 0
        ? '맨 위에 추가돼요'
        : `“${blockLabel(blocks[addAt - 1])} · ${blockSummary(blocks[addAt - 1])}” 아래에 추가돼요`;

  return (
    <CanvasContext.Provider value={canvasValue}>
      <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
        {mode === 'reorder' ? (
          <View style={styles.header}>
            <Text style={[styles.title, styles.flex]}>순서 편집</Text>
            <Pressable
              onPress={() => {
                setMode('edit');
                setHighlightId(null);
              }}
              hitSlop={10}
            >
              <Text style={styles.done}>완료</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.header}>
              <Pressable onPress={exit} hitSlop={10} accessibilityLabel="나가기">
                <Text style={styles.back}>←</Text>
              </Pressable>
              <Text style={[styles.title, styles.flex]} numberOfLines={1}>
                {project.title}
              </Text>
              <Pressable onPress={() => setSettingsOpen(true)} hitSlop={10} accessibilityLabel="전체 설정">
                <GearIcon color={color.ink.secondary} />
              </Pressable>
            </View>
            {hasThanks ? (
              <View style={styles.tabs}>
                {(['invite', 'thanks'] as PageKey[]).map((k) => (
                  <Pressable
                    key={k}
                    onPress={() => {
                      setPage(k);
                      setSelectedId(null);
                    }}
                    style={[styles.tab, page === k && styles.tabOn]}
                  >
                    <Text style={[styles.tabLabel, page === k && styles.tabLabelOn]}>{k === 'invite' ? '초대장' : '감사페이지'}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
            <View style={styles.menu}>
              <Pressable onPress={() => openReorder()} disabled={!blocks.length} style={[styles.menuBtn, !blocks.length && styles.menuOff]}>
                <SortIcon color={color.ink.primary} />
                <Text style={styles.menuLabel}>순서 편집</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setSelectedId(null);
                  setPreviewOpen(true);
                }}
                style={styles.menuBtn}
              >
                <EyeIcon color={color.ink.primary} />
                <Text style={styles.menuLabel}>미리보기</Text>
              </Pressable>
            </View>
          </>
        )}

        {mode === 'reorder' ? (
          <View style={styles.flex}>
            <ReorderView
              blocks={blocks}
              highlightId={highlightId}
              onMove={(from, to) => moveBlock(page, from, to)}
              onDuplicate={(b) => setHighlightId(duplicateBlock(page, b))}
              onDelete={deleteBlock}
              onInsertAt={(i) => setAddAt(i)}
            />
          </View>
        ) : blocks.length === 0 ? (
          <View style={[styles.flex, styles.empty, { backgroundColor: theme.paper }]}>
            <Text style={[styles.emptyTitle, { color: theme.ink }]}>아직 블록이 없어요</Text>
            <Text style={[styles.emptyDesc, { color: theme.inkSoft }]}>
              {'텍스트, 사진, 일시 같은 블록을\n위에서부터 하나씩 쌓아 초대장을 만들어요.'}
            </Text>
            <Pressable style={styles.emptyBtn} onPress={() => setAddAt(0)}>
              <Text style={styles.emptyBtnLabel}>+ 첫 블록 추가</Text>
            </Pressable>
          </View>
        ) : (
          <ScrollView
            ref={scrollRef}
            style={[styles.flex, { backgroundColor: theme.paper }]}
            contentContainerStyle={{ flexGrow: 1, paddingBottom: selected ? screenH * 0.66 : 96 }}
            keyboardShouldPersistTaps="handled"
          >
            <Canvas
              blocks={blocks}
              selectedId={selectedId}
              onPressBlock={select}
              onLongPressBlock={openReorder}
              onBlockLayout={(id, y) => {
                blockY.current[id] = y;
              }}
            />
          </ScrollView>
        )}

        {mode === 'edit' && blocks.length > 0 && !selected ? (
          <Pressable style={[styles.addBar, theme.isDark && styles.addBarOnDark]} onPress={() => setAddAt(blocks.length)}>
            <Text style={[styles.addBarLabel, theme.isDark && styles.addBarLabelOnDark]}>+ 블록 추가</Text>
          </Pressable>
        ) : null}

        {mode === 'edit' && selected ? (
          <BlockSheet
            key={selected.id}
            block={selected}
            project={project}
            defaultFont={invitation.font}
            onChange={(next) => updateBlock(page, next.id, () => next)}
            onDone={() => setSelectedId(null)}
            onOpenSettings={() => {
              setSelectedId(null);
              setSettingsOpen(true);
            }}
          />
        ) : null}

        <DarkToast
          message={toast?.message ?? null}
          actionLabel={toast?.undo ? '되돌리기' : undefined}
          onAction={() => {
            toast?.undo?.();
            setToast(null);
          }}
          onHide={() => setToast(null)}
          bottom={mode === 'edit' ? 84 : 28}
        />

        <AddBlockSheet visible={addAt !== null} where={addWhere} onPick={addBlock} onClose={() => setAddAt(null)} />

        <SettingsSheet
          visible={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          project={project}
          font={invitation.font}
          onFont={setFont}
          onProject={(patch) => updateProject(project.id, patch)}
        />

        <PreviewModal visible={previewOpen} onClose={() => setPreviewOpen(false)} blocks={blocks} base={canvasValue} />
      </SafeAreaView>
    </CanvasContext.Provider>
  );
}

/** 미리보기: the page as guests see it — no edit frames, guest buttons (전화 · 복사 · 펼치기…) work. */
function PreviewModal({ visible, onClose, blocks, base }: { visible: boolean; onClose: () => void; blocks: Block[]; base: CanvasContextValue }) {
  const [toast, setToast] = useState<string | null>(null);
  const value = useMemo<CanvasContextValue>(() => ({ ...base, mode: 'preview', showToast: setToast }), [base]);
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <CanvasContext.Provider value={value}>
        <SafeAreaView style={[styles.screen, { backgroundColor: base.theme.paper }]} edges={['top', 'bottom']}>
          <View style={[styles.previewHead, { borderBottomColor: base.theme.rule }]}>
            <Text style={[styles.previewTitle, { color: base.theme.ink }]}>미리보기</Text>
            <Pressable onPress={onClose} style={styles.previewBack}>
              <Text style={styles.previewBackLabel}>편집으로</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
            <Canvas blocks={blocks} />
          </ScrollView>
          <DarkToast message={toast} onHide={() => setToast(null)} bottom={28} />
        </SafeAreaView>
      </CanvasContext.Provider>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.bg.canvas,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: {
    flex: 1,
  },
  missing: {
    ...textStyle({ size: 'control', weight: 'medium', color: color.ink.muted }),
    textAlign: 'center',
    marginTop: 80,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[5],
    paddingHorizontal: space.screenX,
    paddingVertical: space[5],
  },
  back: {
    ...textStyle({ size: 'title1', weight: 'regular', color: color.ink.primary }),
  },
  title: {
    ...textStyle({ size: 'title3', weight: 'semibold', color: color.ink.primary }),
  },
  done: {
    ...textStyle({ size: 'control', weight: 'semibold', color: color.accent.base }),
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: space.screenX,
    backgroundColor: color.bg.segment,
    borderRadius: 10,
    padding: 3,
    gap: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: space[4],
    alignItems: 'center',
    borderRadius: 8,
  },
  tabOn: {
    backgroundColor: color.bg.surface,
  },
  tabLabel: {
    ...textStyle({ size: 'label', weight: 'medium', color: color.ink.muted }),
  },
  tabLabelOn: {
    color: color.ink.primary,
    fontFamily: 'Pretendard-SemiBold',
  },
  menu: {
    flexDirection: 'row',
    gap: space[3],
    paddingHorizontal: space.screenX,
    paddingTop: space[5],
    paddingBottom: space[5],
  },
  menuBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    borderWidth: 1,
    borderColor: color.line.chip,
    borderRadius: radius.pill,
    backgroundColor: color.bg.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  menuOff: {
    opacity: 0.4,
  },
  menuLabel: {
    ...textStyle({ size: 'label', weight: 'medium', color: color.ink.primary }),
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space[10],
    gap: space[4],
    paddingBottom: 60,
  },
  emptyTitle: {
    ...textStyle({ size: 'control', weight: 'semibold' }),
  },
  emptyDesc: {
    ...textStyle({ size: 'label', weight: 'regular' }),
    textAlign: 'center',
    lineHeight: 21,
  },
  emptyBtn: {
    marginTop: space[4],
    backgroundColor: color.ink.primary,
    borderRadius: radius.button,
    paddingHorizontal: space[8],
    paddingVertical: space[5],
  },
  emptyBtnLabel: {
    ...textStyle({ size: 'control', weight: 'semibold', color: color.ink.onPrimary }),
  },
  addBar: {
    position: 'absolute',
    left: space.screenX,
    right: space.screenX,
    bottom: 28,
    backgroundColor: color.ink.primary,
    borderRadius: 12,
    paddingVertical: space[6],
    alignItems: 'center',
  },
  addBarLabel: {
    ...textStyle({ size: 'control', weight: 'semibold', color: color.ink.onPrimary }),
  },
  // On the dark 잉크 theme the usual dark bar would disappear into the page.
  addBarOnDark: {
    backgroundColor: color.bg.surface,
  },
  addBarLabelOnDark: {
    color: color.ink.primary,
  },
  previewHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.screenX,
    paddingVertical: space[5],
    borderBottomWidth: 1,
  },
  previewTitle: {
    ...textStyle({ size: 'title3', weight: 'semibold' }),
  },
  previewBack: {
    backgroundColor: color.ink.primary,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  previewBackLabel: {
    ...textStyle({ size: 'label', weight: 'semibold', color: color.ink.onPrimary }),
  },
});
