import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, View, StyleSheet, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CommonActions } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { useProjects } from '../../state/ProjectsContext';
import { DEFAULT_THANKS_PAGE, useInvitation } from '../../state/InvitationsContext';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus, type AudioSource } from 'expo-audio';
import { BottomSheet } from '../../components/BottomSheet';
import { SelectChip } from '../../components/SelectChip';
import { DarkToast } from '../../editor/ui';
import { SimpleThanksView } from '../../editor/canvas/SimpleThanks';
import { ThanksSimpleSheet } from '../../editor/sheets/ThanksSimpleSheet';
import { coverPhoto } from '../../editor/photos';
import { useThanksMode } from '../../editor/thanksMode';
import { bgmSource } from '../../editor/bgm';
import { formatMonthDay, thanksEndDate, thanksStartDate } from '../../utils/projectStatus';
import { color, radius, space } from '../../theme/tokens';
import { textStyle } from '../../theme/typography';
import { Canvas } from '../../editor/canvas/Canvas';
import { GuestPopup, PopupFrame } from '../../editor/canvas/PopupFrame';
import { CanvasContext, type CanvasContextValue } from '../../editor/canvas/CanvasContext';
import { invitationTheme } from '../../editor/invitationTheme';
import { ReorderView } from '../../editor/ReorderView';
import { AddBlockSheet } from '../../editor/AddBlockSheet';
import { SettingsSheet, type Page as SettingsPage } from '../../editor/SettingsSheet';
import { BlockSheet, isFullScreenEditor } from '../../editor/sheets/BlockSheet';
import { BlockDeleteContext } from '../../editor/EditorSheet';
import { ModalSafeArea } from '../../components/ModalSafeArea';
import { EyeIcon, GearIcon, SortIcon } from '../../editor/icons';
import { blockLabel, blockSummary } from '../../editor/format';
import { defaultBlock, POPUP_BLOCK_TYPES, type Block, type BlockType, type PageKey } from '../../editor/types';
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
  const { invitation, insertBlock, updateBlock, removeBlock, duplicateBlock, moveBlock, setFont, setCoverPhoto, setBgm, setPopupEnabled, setPopupStart, updateThanks } =
    useInvitation(project.id);
  const { setThanksSettings } = useProjects();
  const { height: screenH } = useWindowDimensions();
  // [감사페이지] 탭은 감사페이지를 쓰는 경우에만 보여요.
  const hasThanks = project.thanks.enabled;
  const [pageState, setPage] = useState<PageKey>(initialTab === 'popup' ? 'popup' : hasThanks && initialTab === 'thanks' ? 'thanks' : 'invite');
  const [mode, setMode] = useState<'edit' | 'reorder'>('edit');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [addAt, setAddAt] = useState<number | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  /** 설정 창을 열 때 바로 보여줄 하위 화면 — 메뉴 줄의 [배경음악]은 'bgm'으로 열어요. */
  const [settingsPage, setSettingsPage] = useState<SettingsPage | undefined>(undefined);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [toast, setToast] = useState<Toast>(null);
  const [thanksSheetOpen, setThanksSheetOpen] = useState(false);
  const [daysOpen, setDaysOpen] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const blockY = useRef<Record<string, number>>({});
  const popupScrollRef = useRef<ScrollView>(null);

  // [안내 팝업] 탭도 설정에서 쓰기로 한 경우에만 보여요 (감사페이지와 같은 방식). 끄면 초대장으로 돌아가요.
  const popupOn = invitation?.popup?.enabled ?? false;
  const page: PageKey = (pageState === 'popup' && !popupOn) || (pageState === 'thanks' && !hasThanks) ? 'invite' : pageState;

  const theme = invitationTheme(project);
  const blocks = invitation?.pages[page] ?? [];
  const selected = blocks.find((b) => b.id === selectedId) ?? null;
  const thanksPage = invitation?.thanks ?? DEFAULT_THANKS_PAGE;
  // 안내 팝업: 초대장을 열면 먼저 뜨는 작은 페이지.
  const isPopup = page === 'popup';
  const pageTabs: PageKey[] = ['invite', ...(popupOn ? (['popup'] as const) : []), ...(hasThanks ? (['thanks'] as const) : [])];
  const PAGE_LABEL: Record<PageKey, string> = { invite: '초대장', popup: '안내 팝업', thanks: '감사페이지' };
  // 감사페이지 간단 모드: a fixed layout instead of the free block list.
  const simpleThanks = page === 'thanks' && thanksPage.mode === 'simple';
  // 감사페이지는 행사 다음 날 자정부터 공개 기간(1~7일) 동안 보여요 — 새 초대장 3/4와 같은 규칙.
  const thanksDays = project.thanks.days ?? 7;
  const thanksStart = thanksStartDate(new Date(project.eventAt));
  const thanksPeriod = `${formatMonthDay(thanksStart.toISOString())} ~ ${formatMonthDay(thanksEndDate(thanksStart, thanksDays).toISOString())} (${thanksDays}일)`;

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
      const target = page === 'popup' ? popupScrollRef : scrollRef;
      if (y !== undefined) setTimeout(() => target.current?.scrollTo({ y: Math.max(0, y - 12), animated: true }), 60);
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
    if (block.type === 'map') {
      // The map links picked on the new-project step decide which buttons start on (both when none was picked).
      const links = project.venue?.mapLinks;
      if (links && (links.naver || links.kakao)) block.props = { ...block.props, showNaver: links.naver, showKakao: links.kakao };
    }
    // 방명록 어느 쪽 손님 받기: on by default for weddings (신랑측 / 신부측).
    if (block.type === 'guestbook') block.props = { ...block.props, askSide: project.eventType === 'wedding' };
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
    setToast({ message: '삭제했어요', undo: () => insertBlock(page, block, index) });
  };

  const thanksMode = useThanksMode(project);
  const switchThanksMode = (next: 'simple' | 'free') => {
    setThanksSheetOpen(false);
    setSelectedId(null);
    thanksMode.switchTo(next);
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
              <Pressable
                onPress={() => {
                  setSettingsPage(undefined);
                  setSettingsOpen(true);
                }}
                hitSlop={10}
                accessibilityLabel="전체 설정"
              >
                <GearIcon color={color.ink.secondary} />
              </Pressable>
            </View>
            {pageTabs.length > 1 ? (
              <View style={styles.tabs}>
                {pageTabs.map((k) => (
                  <Pressable
                    key={k}
                    onPress={() => {
                      setPage(k);
                      setSelectedId(null);
                      setThanksSheetOpen(false);
                    }}
                    style={[styles.tab, page === k && styles.tabOn]}
                  >
                    <Text style={[styles.tabLabel, page === k && styles.tabLabelOn]}>{PAGE_LABEL[k]}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
            {page === 'thanks' ? (
              <View style={styles.thanksBar}>
                <View style={styles.thanksModes}>
                  <SelectChip label="간단하게" selected={thanksMode.mode === 'simple'} onPress={() => switchThanksMode('simple')} />
                  <SelectChip label="자유롭게" selected={thanksMode.mode === 'free'} onPress={() => switchThanksMode('free')} />
                </View>
                <Pressable onPress={() => setDaysOpen(true)} style={styles.daysRow} hitSlop={6}>
                  <Text style={styles.daysText}>{`공개 기간 ${thanksPeriod}`}</Text>
                  <Text style={styles.daysAction}>바꾸기 ›</Text>
                </Pressable>
              </View>
            ) : null}
            {simpleThanks ? null : (
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
              {page !== 'thanks' ? (
                <Pressable
                  onPress={() => {
                    setSelectedId(null);
                    setSettingsPage('bgm');
                    setSettingsOpen(true);
                  }}
                  style={styles.menuBtn}
                >
                  <Text style={styles.menuGlyph}>♪</Text>
                  <Text style={styles.menuLabel}>배경음악</Text>
                </Pressable>
              ) : null}
            </View>
            )}
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
        ) : simpleThanks ? (
          <ScrollView
            style={[styles.flex, { backgroundColor: theme.paper }]}
            contentContainerStyle={{ flexGrow: 1, paddingBottom: thanksSheetOpen ? screenH * 0.66 : 40 }}
          >
            <Pressable onPress={() => setThanksSheetOpen(true)} style={[styles.flexGrow, thanksSheetOpen && styles.thanksSelected]} accessibilityHint="감사페이지 편집">
              <View pointerEvents="none" style={styles.flexGrow}>
                <SimpleThanksView simple={thanksPage.simple} photo={coverPhoto(invitation)} />
              </View>
            </Pressable>
          </ScrollView>
        ) : isPopup ? (
          <View style={[styles.flex, styles.popupStage]}>
            <PopupFrame
              blocks={blocks}
              selectedId={selectedId}
              scrollRef={popupScrollRef}
              onPressBlock={select}
              onLongPressBlock={openReorder}
              onAdd={() => setAddAt(0)}
              onBlockLayout={(id, y) => {
                blockY.current[id] = y;
              }}
            />
          </View>
        ) : blocks.length === 0 ? (
          <View style={[styles.flex, styles.empty, { backgroundColor: theme.paper }]}>
            <Text style={[styles.emptyTitle, { color: theme.ink }]}>아직 아무것도 없어요</Text>
            <Text style={[styles.emptyDesc, { color: theme.inkSoft }]}>
              {'글, 사진, 일시 같은 내용을\n위에서부터 하나씩 쌓아 초대장을 만들어요.'}
            </Text>
            <Pressable style={styles.emptyBtn} onPress={() => setAddAt(0)}>
              <Text style={styles.emptyBtnLabel}>+ 추가하기</Text>
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

        {mode === 'edit' && !simpleThanks && blocks.length > 0 && !selected ? (
          <Pressable style={[styles.addBar, theme.isDark && styles.addBarOnDark]} onPress={() => setAddAt(blocks.length)}>
            <Text style={[styles.addBarLabel, theme.isDark && styles.addBarLabelOnDark]}>+ 추가하기</Text>
          </Pressable>
        ) : null}

        {mode === 'edit' && selected ? (
          <BlockDeleteContext.Provider
            value={() => {
              setSelectedId(null);
              deleteBlock(selected, blocks.indexOf(selected));
            }}
          >
            <BlockSheet
              key={selected.id}
              block={selected}
              project={project}
              defaultFont={invitation.font}
              onChange={(next) => updateBlock(page, next.id, () => next)}
              onDone={() => setSelectedId(null)}
              onOpenSettings={() => {
                setSelectedId(null);
                setSettingsPage(undefined);
                setSettingsOpen(true);
              }}
              onProject={(patch) => updateProject(project.id, patch)}
            />
          </BlockDeleteContext.Provider>
        ) : null}

        {mode === 'edit' && simpleThanks && thanksSheetOpen ? (
          <ThanksSimpleSheet
            project={project}
            invitation={invitation}
            simple={thanksPage.simple}
            onChange={(simple) => updateThanks((t) => ({ ...t, simple }))}
            onCover={setCoverPhoto}
            onDone={() => setThanksSheetOpen(false)}
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

        <AddBlockSheet visible={addAt !== null} where={addWhere} onPick={addBlock} onClose={() => setAddAt(null)} types={isPopup ? POPUP_BLOCK_TYPES : undefined} />

        <SettingsSheet
          visible={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          project={project}
          font={invitation.font}
          onFont={setFont}
          onProject={(patch) => updateProject(project.id, patch)}
          invitation={invitation}
          onCover={setCoverPhoto}
          onBgm={setBgm}
          onPopupEnabled={setPopupEnabled}
          onPopupStart={setPopupStart}
          onEditPopup={() => {
            setPage('popup');
            setSelectedId(null);
          }}
          onThanksEnabled={(enabled) => setThanksSettings(project.id, { ...project.thanks, enabled, days: project.thanks.days ?? 7 })}
          onEditThanks={() => {
            setPage('thanks');
            setSelectedId(null);
          }}
          onShared={(shared) => updateProject(project.id, { shared })}
          initialPage={settingsPage}
        />

        <BottomSheet visible={daysOpen} onClose={() => setDaysOpen(false)} title="감사페이지 공개 기간">
          <View style={styles.daysSheet}>
            <View style={styles.thanksModes}>
              {([1, 2, 3, 4, 5, 6, 7] as const).map((d) => (
                <SelectChip
                  key={d}
                  label={`${d}일`}
                  selected={thanksDays === d}
                  onPress={() => {
                    setThanksSettings(project.id, { ...project.thanks, days: d });
                    setDaysOpen(false);
                  }}
                />
              ))}
            </View>
            <Text style={styles.daysHelp}>{`행사 다음 날 자정부터 공유한 링크가 감사페이지로 바뀌어요.\n기간 : ${thanksPeriod}`}</Text>
          </View>
        </BottomSheet>

        {thanksMode.dialog}

        <PreviewModal
          visible={previewOpen}
          onClose={() => setPreviewOpen(false)}
          blocks={isPopup ? invitation.pages.invite : blocks}
          popupBlocks={page !== 'thanks' && popupOn && invitation.pages.popup.length ? invitation.pages.popup : null}
          base={canvasValue}
          music={page !== 'thanks' ? bgmSource(invitation.bgm) : null}
        />
      </SafeAreaView>
    </CanvasContext.Provider>
  );
}

/** 미리보기: the page as guests see it — no edit frames, guest buttons (전화 · 복사 · 펼치기…) work. */
function PreviewModal({
  visible,
  onClose,
  blocks,
  popupBlocks,
  base,
  music,
}: {
  visible: boolean;
  onClose: () => void;
  blocks: Block[];
  /** 안내 팝업 — shown over the invitation when it opens, like for guests. null = no popup. */
  popupBlocks: Block[] | null;
  base: CanvasContextValue;
  music: AudioSource | null;
}) {
  const [toast, setToast] = useState<string | null>(null);
  const [popupOpen, setPopupOpen] = useState(false);
  const [wasVisible, setWasVisible] = useState(visible);
  // Every time the preview opens the popup comes up again (오늘 하루 보지 않기 is not saved in the preview).
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) setPopupOpen(true);
  }
  const value = useMemo<CanvasContextValue>(() => ({ ...base, mode: 'preview', showToast: setToast }), [base]);
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <CanvasContext.Provider value={value}>
        <ModalSafeArea style={[styles.screen, { backgroundColor: base.theme.paper }]}>
          <View style={[styles.previewHead, { borderBottomColor: base.theme.rule }]}>
            <Text style={[styles.previewTitle, { color: base.theme.ink }]}>미리보기</Text>
            <Pressable onPress={onClose} style={styles.previewBack}>
              <Text style={styles.previewBackLabel}>편집으로</Text>
            </Pressable>
          </View>
          <View style={styles.flex}>
            <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
              <Canvas blocks={blocks} />
            </ScrollView>
            {visible && music ? <MusicButton source={music} /> : null}
            {popupOpen && popupBlocks ? <GuestPopup blocks={popupBlocks} onClose={() => setPopupOpen(false)} /> : null}
          </View>
          <DarkToast message={toast} onHide={() => setToast(null)} bottom={28} />
        </ModalSafeArea>
      </CanvasContext.Provider>
    </Modal>
  );
}

/**
 * ♪ 배경음악 button, top right of the invitation. Guests' browsers block autoplay with sound,
 * so music starts when they tap it — the preview behaves the same way.
 */
function MusicButton({ source }: { source: AudioSource }) {
  const player = useAudioPlayer(source);
  const status = useAudioPlayerStatus(player);
  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
  }, []);
  useEffect(() => {
    // Loop like the guest page will; a song that ends restarts from the top.
    if (status.didJustFinish) {
      player.seekTo(0).then(() => player.play()).catch(() => {});
    }
  }, [status.didJustFinish, player]);
  return (
    <Pressable
      onPress={() => (status.playing ? player.pause() : player.play())}
      style={[styles.music, status.playing && styles.musicOn]}
      hitSlop={8}
      accessibilityLabel={status.playing ? '배경음악 끄기' : '배경음악 켜기'}
    >
      <Text style={[styles.musicGlyph, !status.playing && styles.musicGlyphOff]}>♪</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flexGrow: {
    flexGrow: 1,
  },
  thanksSelected: {
    borderWidth: 1.5,
    borderColor: color.accent.base,
  },
  popupStage: {
    alignItems: 'center',
    paddingTop: space[6],
  },
  thanksBar: {
    paddingHorizontal: space.screenX,
    paddingTop: space[5],
    paddingBottom: space[5],
    gap: space[4],
  },
  thanksModes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[3],
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  daysText: {
    ...textStyle({ size: 'small', weight: 'regular', color: color.ink.secondary }),
  },
  daysAction: {
    ...textStyle({ size: 'small', weight: 'semibold', color: color.accent.base }),
  },
  daysSheet: {
    paddingHorizontal: space.screenX,
    paddingBottom: space[6],
    gap: space[6],
  },
  daysHelp: {
    ...textStyle({ size: 'small', weight: 'regular', color: color.ink.muted }),
  },
  music: {
    position: 'absolute',
    top: 12,
    right: 14,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(35,33,42,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  musicOn: {
    backgroundColor: 'rgba(35,33,42,0.85)',
  },
  musicGlyph: {
    color: '#ffffff',
    fontSize: 17,
  },
  musicGlyphOff: {
    opacity: 0.6,
  },
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
  menuGlyph: {
    ...textStyle({ size: 'label', weight: 'semibold', color: color.ink.primary }),
    fontSize: 15,
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
