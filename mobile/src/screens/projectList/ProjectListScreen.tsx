import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View, StyleSheet } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainTabParamList, RootStackParamList } from '../../navigation/types';
import { useProjects } from '../../state/ProjectsContext';
import { Placeholder } from '../../components/Placeholder';
import { Toast } from '../../components/Toast';
import { color, radius, space } from '../../theme/tokens';
import { textStyle } from '../../theme/typography';
import {
  EMPTY_FILTERS,
  eventTypeMeta,
  filterCount,
  STATUS_LABEL,
  type FilterState,
  type ListView,
  type Project,
  type SortKey,
} from '../../types/project';
import { matchesFilters, matchesQuery, sortProjects, SORT_OPTIONS } from '../../utils/projectFilters';
import { ProjectDetailCard, ProjectThumbCard, ProjectListRow } from './ProjectCards';
import { FilterSheet } from './FilterSheet';
import { SortSheet } from './SortSheet';
import { ActionSheet } from './ActionSheet';
import { DeleteDialog } from './DeleteDialog';
import { PeriodSheet } from './PeriodSheet';

type Props = BottomTabScreenProps<MainTabParamList, 'ProjectList'>;

export function ProjectListScreen(_props: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { projects, deleteProject, setThanksSettings } = useProjects();

  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [sort, setSort] = useState<SortKey>('updated');
  const [view, setView] = useState<ListView>('detail');

  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [sortSheetOpen, setSortSheetOpen] = useState(false);
  const [actionProjectId, setActionProjectId] = useState<string | null>(null);
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null);
  const [periodProjectId, setPeriodProjectId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ visible: boolean; message: string; tone: 'error' | 'success' }>({
    visible: false,
    message: '',
    tone: 'success',
  });

  const filtered = useMemo(
    () => projects.filter((p) => matchesQuery(p, query) && matchesFilters(p, filters)),
    [projects, query, filters],
  );
  const sorted = useMemo(() => sortProjects(filtered, sort), [filtered, sort]);

  const activeFilterCount = filterCount(filters);
  const sortLabel = SORT_OPTIONS.find((o) => o.key === sort)?.label ?? '';

  const actionProject = projects.find((p) => p.id === actionProjectId) ?? null;
  const deleteProjectTarget = projects.find((p) => p.id === deleteProjectId) ?? null;
  const periodProject = projects.find((p) => p.id === periodProjectId) ?? null;

  const showToast = (message: string, tone: 'error' | 'success' = 'success') =>
    setToast({ visible: true, message, tone });

  const removeStatusFilter = () => setFilters((f) => ({ ...f, status: 'all' }));
  const removeMonthFilter = (m: string) => setFilters((f) => ({ ...f, months: f.months.filter((x) => x !== m) }));
  const removeTypeFilter = (t: Project['eventType']) => setFilters((f) => ({ ...f, types: f.types.filter((x) => x !== t) }));
  const removeSidoFilter = (s: string) => setFilters((f) => ({ ...f, sido: f.sido.filter((x) => x !== s) }));

  const handleCopyLink = async (project: Project) => {
    await Clipboard.setStringAsync(`https://invite.app/i/${project.id}`);
    setActionProjectId(null);
    showToast('링크를 복사했어요');
  };

  const handleConfirmDelete = () => {
    if (!deleteProjectTarget) return;
    deleteProject(deleteProjectTarget.id);
    const title = deleteProjectTarget.title;
    setDeleteProjectId(null);
    showToast(`'${title}'을 삭제했어요`, 'error');
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.headerTitle}>내 초대장</Text>
          <Pressable>
            <View style={styles.avatar} />
          </Pressable>
        </View>

        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="프로젝트명 검색"
            placeholderTextColor={color.ink.placeholder}
            style={styles.searchInput}
          />
          {query.length > 0 ? (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <Text style={styles.searchClear}>✕</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.countRow}>
          <Text style={styles.countText}>
            {query ? `'${query}' 검색 결과 ${sorted.length}개` : `초대장 ${sorted.length}개`}
          </Text>
          <Pressable style={styles.newButton} onPress={() => navigation.navigate('NewProjectType')}>
            <Text style={styles.newButtonLabel}>+ 새 초대장 만들기</Text>
          </Pressable>
        </View>

        <View style={styles.toolbar}>
          <View style={styles.toolbarLeft}>
            <Pressable
              style={[styles.filterButton, activeFilterCount > 0 && styles.filterButtonActive]}
              onPress={() => setFilterSheetOpen(true)}
            >
              <Text style={[styles.filterLabel, activeFilterCount > 0 && styles.filterLabelActive]}>필터</Text>
              {activeFilterCount > 0 ? (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeLabel}>{activeFilterCount}</Text>
                </View>
              ) : null}
            </Pressable>
            <Pressable style={styles.sortButton} onPress={() => setSortSheetOpen(true)}>
              <Text style={styles.sortLabel}>{sortLabel} ▾</Text>
            </Pressable>
          </View>
          <ViewToggle value={view} onChange={setView} />
        </View>

        {activeFilterCount > 0 ? (
          <View style={styles.activeFilterRow}>
            {filters.status !== 'all' &&
              filters.status.map((s) => (
                <RemovableChip key={s} label={STATUS_LABEL[s]} onRemove={removeStatusFilter} />
              ))}
            {filters.months.map((m) => (
              <RemovableChip key={m} label={`${Number(m.split('-')[1])}월`} onRemove={() => removeMonthFilter(m)} />
            ))}
            {filters.types.map((t) => (
              <RemovableChip key={t} label={eventTypeMeta(t).label} onRemove={() => removeTypeFilter(t)} />
            ))}
            {filters.sido.map((s) => (
              <RemovableChip key={s} label={s} onRemove={() => removeSidoFilter(s)} />
            ))}
            <Pressable onPress={() => setFilters(EMPTY_FILTERS)}>
              <Text style={styles.resetLink}>초기화</Text>
            </Pressable>
          </View>
        ) : null}

        {projects.length === 0 ? (
          <EmptyState onCreate={() => navigation.navigate('NewProjectType')} />
        ) : sorted.length === 0 ? (
          <NoResultState onReset={() => { setFilters(EMPTY_FILTERS); setQuery(''); }} />
        ) : (
          <ListBody view={view} projects={sorted} onPressItem={(p) => setActionProjectId(p.id)} />
        )}
      </ScrollView>

      <FilterSheet
        visible={filterSheetOpen}
        filters={filters}
        allProjects={projects}
        query={query}
        onApply={(f) => { setFilters(f); setFilterSheetOpen(false); }}
        onClose={() => setFilterSheetOpen(false)}
      />
      <SortSheet
        visible={sortSheetOpen}
        value={sort}
        onSelect={(k) => { setSort(k); setSortSheetOpen(false); }}
        onClose={() => setSortSheetOpen(false)}
      />
      <ActionSheet
        visible={actionProjectId != null}
        project={actionProject}
        onClose={() => setActionProjectId(null)}
        onEdit={() => { if (actionProject) navigation.navigate('EditorPlaceholder', { projectId: actionProject.id }); setActionProjectId(null); }}
        onManage={() => { if (actionProject) navigation.navigate('ManagePlaceholder', { projectId: actionProject.id }); setActionProjectId(null); }}
        onPreview={() => { setActionProjectId(null); showToast('미리보기는 다음 핸드오프에서 제공됩니다'); }}
        onCopyLink={() => actionProject && handleCopyLink(actionProject)}
        onDelete={() => { setDeleteProjectId(actionProjectId); setActionProjectId(null); }}
        onThanksPeriod={() => { setPeriodProjectId(actionProjectId); setActionProjectId(null); }}
        onThanksEdit={() => { if (actionProject) navigation.navigate('EditorPlaceholder', { projectId: actionProject.id, tab: 'thanks' }); setActionProjectId(null); }}
      />
      <DeleteDialog
        visible={deleteProjectId != null}
        project={deleteProjectTarget}
        onCancel={() => setDeleteProjectId(null)}
        onConfirm={handleConfirmDelete}
      />
      <PeriodSheet
        visible={periodProjectId != null}
        project={periodProject}
        onClose={() => setPeriodProjectId(null)}
        onSave={(thanks) => { if (periodProjectId) setThanksSettings(periodProjectId, thanks); setPeriodProjectId(null); }}
      />

      <Toast visible={toast.visible} message={toast.message} tone={toast.tone} onHide={() => setToast((t) => ({ ...t, visible: false }))} />
    </View>
  );
}

function ViewToggle({ value, onChange }: { value: ListView; onChange: (v: ListView) => void }) {
  const items: { key: ListView; icon: string }[] = [
    { key: 'detail', icon: '▤' },
    { key: 'thumb', icon: '▦' },
    { key: 'list', icon: '≡' },
  ];
  return (
    <View style={styles.viewToggle}>
      {items.map((item) => {
        const active = item.key === value;
        return (
          <Pressable key={item.key} onPress={() => onChange(item.key)} style={[styles.viewToggleItem, active && styles.viewToggleItemActive]}>
            <Text style={[styles.viewToggleIcon, active && styles.viewToggleIconActive]}>{item.icon}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function RemovableChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <Pressable style={styles.removableChip} onPress={onRemove}>
      <Text style={styles.removableChipLabel}>{label}</Text>
      <Text style={styles.removableChipX}>✕</Text>
    </Pressable>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <View style={styles.emptyWrap}>
      <Placeholder width={120} height={150} label="" />
      <Text style={styles.emptyTitle}>아직 만든 초대장이 없어요</Text>
      <Text style={styles.emptyDesc}>행사 유형과 일시만 입력하면{'\n'}블록을 쌓아 5분 만에 완성할 수 있어요.</Text>
      <Pressable style={styles.emptyButton} onPress={onCreate}>
        <Text style={styles.emptyButtonLabel}>+ 새 초대장 만들기</Text>
      </Pressable>
    </View>
  );
}

function NoResultState({ onReset }: { onReset: () => void }) {
  return (
    <View style={styles.emptyWrap}>
      <View style={styles.noResultIcon}>
        <Text style={styles.noResultIconMark}>⌕</Text>
      </View>
      <Text style={styles.emptyTitle}>조건에 맞는 초대장이 없어요</Text>
      <Text style={styles.emptyDesc}>검색어를 바꾸거나 필터를 해제해 보세요.</Text>
      <Pressable style={styles.resetButton} onPress={onReset}>
        <Text style={styles.resetButtonLabel}>필터 초기화</Text>
      </Pressable>
    </View>
  );
}

function ListBody({ view, projects, onPressItem }: { view: ListView; projects: Project[]; onPressItem: (p: Project) => void }) {
  if (view === 'detail') {
    return (
      <View style={styles.detailList}>
        {projects.map((p) => (
          <ProjectDetailCard key={p.id} project={p} onPress={() => onPressItem(p)} />
        ))}
      </View>
    );
  }
  if (view === 'thumb') {
    return (
      <View style={styles.thumbGrid}>
        {projects.map((p) => (
          <View key={p.id} style={styles.thumbGridItem}>
            <ProjectThumbCard project={p} onPress={() => onPressItem(p)} />
          </View>
        ))}
      </View>
    );
  }
  return (
    <View style={styles.listBox}>
      {projects.map((p, i) => (
        <View key={p.id} style={i > 0 ? styles.listRowDivider : undefined}>
          <ProjectListRow project={p} onPress={() => onPressItem(p)} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.bg.canvas,
  },
  scrollContent: {
    paddingBottom: space[10],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingHorizontal: space.screenX,
    paddingBottom: space[6],
  },
  headerTitle: {
    ...textStyle({ size: 'listTitle', weight: 'semibold', color: color.ink.primary }),
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: radius.circle,
    backgroundColor: color.bg.placeholderFill,
    borderWidth: 1,
    borderColor: color.line.strong,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[4],
    marginHorizontal: space.screenX,
    backgroundColor: color.bg.surface,
    borderWidth: 1,
    borderColor: color.line.default,
    borderRadius: radius.input,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  searchIcon: {
    color: color.ink.placeholder,
    fontSize: 15,
  },
  searchInput: {
    flex: 1,
    padding: 0,
    ...textStyle({ size: 'control', weight: 'regular', color: color.ink.primary }),
  },
  searchClear: {
    color: color.ink.placeholder,
    fontSize: 13,
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.screenX,
    paddingTop: space[6],
    paddingBottom: space[5],
  },
  countText: {
    ...textStyle({ size: 'label', weight: 'medium', color: color.ink.secondary }),
  },
  newButton: {
    backgroundColor: color.ink.primary,
    borderRadius: radius.pill,
    paddingHorizontal: 13,
    paddingVertical: 7,
  },
  newButtonLabel: {
    ...textStyle({ size: 'chip', weight: 'semibold', color: color.ink.onPrimary }),
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.screenX,
    paddingBottom: space[6],
  },
  toolbarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[4],
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    borderWidth: 1,
    borderColor: color.line.chip,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filterButtonActive: {
    backgroundColor: color.select.fill,
    borderColor: color.select.fill,
  },
  filterLabel: {
    ...textStyle({ size: 'label', weight: 'medium', color: color.ink.primary }),
  },
  filterLabelActive: {
    color: color.select.on,
  },
  filterBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeLabel: {
    ...textStyle({ size: 'caption', weight: 'semibold', color: color.select.fill }),
  },
  sortButton: {
    paddingVertical: 8,
  },
  sortLabel: {
    ...textStyle({ size: 'label', weight: 'medium', color: color.ink.primary }),
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: color.bg.segment,
    borderRadius: 8,
    padding: 2,
    gap: 2,
  },
  viewToggleItem: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  viewToggleItemActive: {
    backgroundColor: color.bg.surface,
    borderWidth: 1,
    borderColor: color.line.default,
  },
  viewToggleIcon: {
    fontSize: 14,
    color: color.ink.muted,
  },
  viewToggleIconActive: {
    color: color.ink.primary,
  },
  activeFilterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: space[3],
    paddingHorizontal: space.screenX,
    paddingBottom: space[6],
  },
  removableChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    backgroundColor: color.accent.tint,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  removableChipLabel: {
    ...textStyle({ size: 'caption', weight: 'medium', color: color.accent.base }),
  },
  removableChipX: {
    color: color.accent.base,
    fontSize: 10,
  },
  resetLink: {
    ...textStyle({ size: 'label', weight: 'medium', color: color.ink.secondary }),
    textDecorationLine: 'underline',
  },
  detailList: {
    paddingHorizontal: space.screenX,
    gap: 10,
  },
  thumbGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: space.screenX,
    gap: 14,
  },
  thumbGridItem: {
    width: '46%',
  },
  listBox: {
    marginHorizontal: space.screenX,
    backgroundColor: color.bg.surface,
    borderRadius: radius.card,
    overflow: 'hidden',
  },
  listRowDivider: {
    borderTopWidth: 1,
    borderTopColor: color.line.soft,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingTop: space[10] * 2,
    paddingHorizontal: space.screenX,
    gap: space[6],
  },
  emptyTitle: {
    ...textStyle({ size: 'title3', weight: 'semibold', color: color.ink.primary }),
  },
  emptyDesc: {
    ...textStyle({ size: 'body', weight: 'regular', color: color.ink.muted }),
    textAlign: 'center',
    lineHeight: 12.5 * 1.6,
  },
  emptyButton: {
    marginTop: space[6],
    backgroundColor: color.ink.primary,
    borderRadius: radius.button,
    paddingVertical: space[6],
    paddingHorizontal: space[9],
  },
  emptyButtonLabel: {
    ...textStyle({ size: 'control', weight: 'semibold', color: color.ink.onPrimary }),
  },
  noResultIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: color.bg.surface,
    borderWidth: 1,
    borderColor: color.line.default,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noResultIconMark: {
    fontSize: 24,
    color: color.ink.placeholder,
  },
  resetButton: {
    borderWidth: 1,
    borderColor: color.line.chip,
    borderRadius: radius.button,
    paddingVertical: space[5],
    paddingHorizontal: space[8],
  },
  resetButtonLabel: {
    ...textStyle({ size: 'control', weight: 'medium', color: color.ink.primary }),
  },
});
