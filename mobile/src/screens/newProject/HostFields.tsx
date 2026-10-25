import { useState } from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { FieldLabel } from '../../components/FieldLabel';
import { TextField } from '../../components/TextField';
import { HelperText } from '../../components/HelperText';
import { SelectChip } from '../../components/SelectChip';
import { color, space } from '../../theme/tokens';
import { textStyle } from '../../theme/typography';
import { eventTypeMeta, FREE_ROLES, GROUP_ROLES, MAX_FREE_HOSTS, type EventType } from '../../types/project';

type Host = { label: string; name: string };

type Props = {
  eventType: EventType;
  hosts: Host[];
  onChange: (hosts: Host[]) => void;
  onFocus?: () => void;
};

/** 앞에서부터 꼭 적어야 하는 칸을 다 적었는지 — 다음 버튼을 켜는 기준. */
export function hostsComplete(eventType: EventType, hosts: Host[]): boolean {
  const meta = eventTypeMeta(eventType);
  if (meta.hostMode === 'group') return !!hosts[0]?.name.trim() && !!hosts[1]?.name.trim() && !!hosts[1]?.label.trim();
  if (meta.hostMode === 'free') return hosts.length > 0 && hosts.every((h) => h.label.trim() && h.name.trim());
  return hosts.slice(0, meta.requiredHosts).every((h) => h.name.trim().length > 0);
}

/**
 * 주인공 입력 — 행사 종류마다 달라요.
 * 결혼식 신랑 · 신부 / 돌잔치 · 백일 아이 · 아버지 · 어머니(아이만 필수) / 동창회 · 동호회 모임명 + 직책 + 이름 / 기타 호스트 1부터 구분 + 이름(추가 가능).
 */
export function HostFields({ eventType, hosts, onChange, onFocus }: Props) {
  const meta = eventTypeMeta(eventType);
  const set = (i: number, patch: Partial<Host>) => onChange(hosts.map((h, k) => (k === i ? { ...h, ...patch } : h)));

  if (meta.hostMode === 'group') {
    const role = hosts[1]?.label ?? '';
    return <GroupFields hosts={hosts} role={role} set={set} onFocus={onFocus} club={eventType === 'club'} />;
  }

  if (meta.hostMode === 'free') {
    return (
      <>
        <FieldLabel>호스트</FieldLabel>
        {hosts.map((h, i) => (
          <View key={i} style={styles.extra}>
            <View style={styles.extraHead}>
              <Text style={styles.hostLabel}>{`호스트 ${i + 1}`}</Text>
              {hosts.length > 1 ? (
                <Pressable onPress={() => onChange(hosts.filter((_, n) => n !== i))} hitSlop={10}>
                  <Text style={styles.remove}>✕</Text>
                </Pressable>
              ) : null}
            </View>
            <View style={styles.chips}>
              {FREE_ROLES.map((r) => (
                <SelectChip key={r} label={r} selected={h.label === r} onPress={() => set(i, { label: r })} />
              ))}
            </View>
            <View style={styles.pair}>
              <View style={styles.roleBox}>
                <TextField value={h.label} onChangeText={(v) => set(i, { label: v.slice(0, 7) })} onFocus={onFocus} placeholder="구분 (직접 입력)" maxLength={7} />
              </View>
              <View style={styles.flex}>
                <TextField value={h.name} onChangeText={(v) => set(i, { name: v })} onFocus={onFocus} placeholder="이름" />
              </View>
            </View>
          </View>
        ))}
        {hosts.length < MAX_FREE_HOSTS ? (
          <Pressable onPress={() => onChange([...hosts, { label: '', name: '' }])} style={styles.add}>
            <Text style={styles.addLabel}>+ 호스트 추가</Text>
          </Pressable>
        ) : null}
        <HelperText>회장 · 부회장 · 총무처럼 구분을 적고 이름을 넣어요. 호스트는 여러 명 넣을 수 있어요.</HelperText>
      </>
    );
  }

  // fixed: 칸 이름은 행사 종류에 맞춰 미리 채워져요. 돌잔치 · 백일은 아이 한 줄 + 아버지 · 어머니 한 줄.
  const solo = hosts.length === 3 ? [hosts[0]] : [];
  const rest = hosts.length === 3 ? hosts.slice(1) : hosts;
  const offset = solo.length;
  const field = (h: Host, i: number) => (
    <View key={h.label} style={styles.hostField}>
      <Text style={styles.hostLabel}>{i < meta.requiredHosts ? h.label : `${h.label} (선택)`}</Text>
      <TextField value={h.name} onChangeText={(v) => set(i, { name: v })} onFocus={onFocus} placeholder={h.label} />
    </View>
  );
  return (
    <>
      <FieldLabel>주인공</FieldLabel>
      {solo.map((h) => (
        <View key={h.label} style={styles.field}>
          {field(h, 0)}
        </View>
      ))}
      <View style={styles.hostRow}>{rest.map((h, k) => field(h, k + offset))}</View>
      <HelperText>
        {meta.requiredHosts < hosts.length ? '아이 이름만 꼭 적으면 돼요. 부모님은 나중에 넣어도 괜찮아요.' : '칸 이름은 행사 유형에 맞춰 미리 채워져요.'}
      </HelperText>
    </>
  );
}

function GroupFields({ hosts, role, set, onFocus, club }: { hosts: Host[]; role: string; set: (i: number, p: Partial<Host>) => void; onFocus?: () => void; club: boolean }) {
  const preset = (GROUP_ROLES as readonly string[]).includes(role);
  const [custom, setCustom] = useState(!preset && role !== '' && role !== '기타');
  const other = custom || role === '기타';
  return (
    <>
      <FieldLabel>모임명</FieldLabel>
      <TextField value={hosts[0]?.name ?? ''} onChangeText={(v) => set(0, { name: v })} onFocus={onFocus} placeholder={club ? '예: 주말 러닝 모임' : '예: 한울고 12회 동창회'} />
      <View style={styles.section}>
        <FieldLabel>직책</FieldLabel>
        <View style={styles.chips}>
          {GROUP_ROLES.map((r) => (
            <SelectChip
              key={r}
              label={r}
              selected={!other && role === r}
              onPress={() => {
                setCustom(false);
                set(1, { label: r });
              }}
            />
          ))}
          <SelectChip
            label="기타"
            selected={other}
            onPress={() => {
              setCustom(true);
              set(1, { label: '' });
            }}
          />
        </View>
        {other ? (
          <View style={styles.gap}>
            <TextField value={role === '기타' ? '' : role} onChangeText={(v) => set(1, { label: v.slice(0, 7) })} onFocus={onFocus} placeholder="직책을 직접 적어요 (예: 홍보)" maxLength={7} />
          </View>
        ) : null}
      </View>
      <View style={styles.section}>
        <FieldLabel>이름</FieldLabel>
        <TextField value={hosts[1]?.name ?? ''} onChangeText={(v) => set(1, { name: v })} onFocus={onFocus} placeholder="이름" />
        <HelperText>고른 직책과 이름이 연락처 · 감사 문구에도 같이 쓰여요.</HelperText>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  field: { marginBottom: space[3] },
  hostRow: { flexDirection: 'row', gap: space[5] },
  hostField: { flex: 1 },
  hostLabel: { ...textStyle({ size: 'small', weight: 'regular', color: color.ink.muted }), marginBottom: space[2] },
  section: { marginTop: space[7] },
  gap: { marginTop: space[4] },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space[3] },
  extra: { marginTop: space[6], gap: space[4], padding: space[6], backgroundColor: color.bg.surface, borderRadius: 10, borderWidth: 1, borderColor: color.line.default },
  extraHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  remove: { ...textStyle({ size: 'label', weight: 'regular', color: color.status.error }) },
  pair: { flexDirection: 'row', gap: space[4] },
  roleBox: { width: 124 },
  add: { marginTop: space[5], borderWidth: 1, borderStyle: 'dashed', borderColor: color.accent.tintBorder, backgroundColor: color.accent.tint, borderRadius: 8, paddingVertical: space[5], alignItems: 'center' },
  addLabel: { ...textStyle({ size: 'label', weight: 'semibold', color: color.accent.base }) },
});
