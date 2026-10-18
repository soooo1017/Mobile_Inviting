import { useState } from 'react';
import { Platform, Pressable, Text, View, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { TextField } from '../../components/TextField';
import { color, radius, space } from '../../theme/tokens';
import { textStyle } from '../../theme/typography';
import { EditorSheet, FullScreenEditor } from '../EditorSheet';
import { Chips, Help, Section, ToggleList } from '../ui';
import { LabeledInput } from './common';
import type { BlockSheetProps } from './BasicSheets';
import { formatDeadline, formatWhenShort, fromDateKey, toDateKey } from '../format';

export function DateTimeSheet({ block, onChange, onDone, project, onOpenSettings }: BlockSheetProps<'datetime'> & { onOpenSettings: () => void }) {
  const p = block.props;
  const set = (patch: Partial<typeof p>) => onChange({ ...block, props: { ...p, ...patch } });
  return (
    <EditorSheet title="일시" onDone={onDone} maxHeight={0.7}>
      <Section label="행사 일시">
        <Pressable style={styles.readonly} onPress={onOpenSettings}>
          <Text style={styles.readonlyValue}>{formatWhenShort(project.eventAt)}</Text>
          <Text style={styles.readonlySub}>행사 정보에서 가져옴 ›</Text>
        </Pressable>
        <Help>날짜·시간은 ⚙ 전체 설정 → 행사 정보에서 고쳐요. 초대장 전체에 같이 반영돼요.</Help>
      </Section>
      <ToggleList
        items={[
          { key: 'when', label: '일시 문구', value: p.showWhen, onChange: (showWhen) => set({ showWhen }) },
          { key: 'dday', label: 'D-day 띠', value: p.showDday, onChange: (showDday) => set({ showDday }) },
          { key: 'cal', label: '달력', value: p.showCalendar, onChange: (showCalendar) => set({ showCalendar }) },
          { key: 'btn', label: '캘린더에 추가 버튼', value: p.showCalendarButton, onChange: (showCalendarButton) => set({ showCalendarButton }) },
        ]}
      />
      {p.showCalendarButton ? (
        <Section label="캘린더에 추가 버튼 색">
          <Chips
            options={[
              { value: 'default', label: '기본' },
              { value: 'inverse', label: '반전' },
            ]}
            value={p.buttonTone}
            onChange={(buttonTone) => set({ buttonTone })}
          />
        </Section>
      ) : null}
      {p.showCalendar ? (
        <Section label="행사일 동그라미 색">
          <Chips
            options={[
              { value: 'red', label: '빨강 (기본)' },
              { value: 'theme', label: '테마 색' },
            ]}
            value={p.circleColor}
            onChange={(circleColor) => set({ circleColor })}
          />
        </Section>
      ) : null}
    </EditorSheet>
  );
}

export function RsvpEditor({ block, onChange, onDone, project }: BlockSheetProps<'rsvp'>) {
  const p = block.props;
  const set = (patch: Partial<typeof p>) => onChange({ ...block, props: { ...p, ...patch } });
  const setField = (key: keyof typeof p.fields, v: boolean) => set({ fields: { ...p.fields, [key]: v } });
  const [picking, setPicking] = useState(false);

  const eventDay = new Date(project.eventAt);
  const today = new Date();
  const initial = p.deadline ? fromDateKey(p.deadline) : new Date(eventDay.getFullYear(), eventDay.getMonth(), eventDay.getDate() - 7);

  return (
    <FullScreenEditor visible title="참석 응답" onClose={onDone} onDone={onDone}>
      <Section label="안내 문구">
        <TextField value={p.intro} onChangeText={(intro) => set({ intro })} multiline style={styles.multiline} placeholder="참석 여부를 미리 알려주세요." />
      </Section>
      <LabeledInput label="버튼 문구" value={p.buttonLabel} onChangeText={(buttonLabel) => set({ buttonLabel })} maxLength={16} />
      <Section label="받을 항목">
        <ToggleList
          items={[
            { key: 'attend', label: '참석 여부', value: true, fixedLabel: '항상 받음' },
            { key: 'side', label: '어느 쪽 손님', sub: '신랑측 · 신부측', value: p.fields.side, onChange: (v) => setField('side', v) },
            { key: 'comp', label: '동반 인원', value: p.fields.companions, onChange: (v) => setField('companions', v) },
            { key: 'meal', label: '식사 여부', value: p.fields.meal, onChange: (v) => setField('meal', v) },
            { key: 'phone', label: '연락처', value: p.fields.phone, onChange: (v) => setField('phone', v) },
            { key: 'msg', label: '전할 말', value: p.fields.message, onChange: (v) => setField('message', v) },
          ]}
        />
      </Section>
      <Section label="응답 마감일" sub="선택">
        <View style={styles.dateRow}>
          <Pressable style={[styles.readonly, styles.flex]} onPress={() => setPicking((v) => !v)}>
            <Text style={[styles.readonlyValue, !p.deadline && styles.placeholder]}>
              {p.deadline ? `${formatDeadline(p.deadline)} 자정까지` : '마감 없음'}
            </Text>
            <Text style={styles.readonlySub}>달력에서 고르기 ›</Text>
          </Pressable>
          {p.deadline ? (
            <Pressable onPress={() => set({ deadline: undefined })} hitSlop={10} accessibilityLabel="마감일 지우기">
              <Text style={styles.clear}>✕</Text>
            </Pressable>
          ) : null}
        </View>
        {picking ? (
          <View style={styles.pickerWrap}>
            <DateTimePicker
              locale="ko-KR"
              value={initial}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              minimumDate={today}
              maximumDate={eventDay}
              accentColor={color.select.fill}
              onChange={(e, d) => {
                if (Platform.OS !== 'ios') setPicking(false);
                if (e.type === 'set' && d) set({ deadline: toDateKey(d) });
              }}
            />
          </View>
        ) : null}
        <Help>고른 날 자정(밤 12시)까지 받아요. 비워두면 마감 없이 계속 받아요.</Help>
      </Section>
      <ToggleList items={[{ key: 'auto', label: '초대장 열면 응답 창 먼저 띄우기', value: p.autoOpen, onChange: (autoOpen) => set({ autoOpen }) }]} />
      <Help>받은 응답은 관리 화면의 응답 현황에서 봐요.</Help>
    </FullScreenEditor>
  );
}

export function GuestbookSheet({ block, onChange, onDone }: BlockSheetProps<'guestbook'>) {
  const p = block.props;
  const set = (patch: Partial<typeof p>) => onChange({ ...block, props: { ...p, ...patch } });
  return (
    <EditorSheet title="방명록" onDone={onDone} maxHeight={0.7}>
      <LabeledInput label="안내 문구" value={p.intro} onChangeText={(intro) => set({ intro })} maxLength={40} />
      <Section label="글 공개">
        <Chips
          options={[
            { value: 'public', label: '공개' },
            { value: 'private', label: '우리만 보기' },
          ]}
          value={p.visibility}
          onChange={(visibility) => set({ visibility })}
        />
        <Help>
          {p.visibility === 'public'
            ? '다른 게스트도 글을 볼 수 있어요.'
            : '게스트에게는 버튼만 보이고, 글은 관리 화면에서만 봐요.'}
        </Help>
      </Section>
      {p.visibility === 'public' ? (
        <Section label="보여줄 최근 글">
          <Chips<3 | 5 | 10>
            options={[
              { value: 3, label: '3개' },
              { value: 5, label: '5개' },
              { value: 10, label: '10개' },
            ]}
            value={p.recentCount}
            onChange={(recentCount) => set({ recentCount })}
          />
          <Help>{'더 있으면 게스트는 "전체 보기"로 모든 글을 봐요.'}</Help>
        </Section>
      ) : null}
      <View style={styles.gapSm}>
        <LabeledInput label="버튼 문구" value={p.buttonLabel} onChangeText={(buttonLabel) => set({ buttonLabel })} maxLength={16} />
        <Help>게스트는 이름 · 비밀번호 4자리 · 글(200자)을 남기고, 글을 누르면 비밀번호로 고치거나 지울 수 있어요.</Help>
      </View>
    </EditorSheet>
  );
}

const styles = StyleSheet.create({
  // iOS draws the inline calendar at its own width, flush left — center it in the sheet.
  pickerWrap: {
    alignItems: 'center',
  },
  flex: {
    flex: 1,
  },
  gapSm: {
    gap: space[3],
  },
  readonly: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space[4],
    backgroundColor: color.bg.canvas,
    borderWidth: 1,
    borderColor: color.line.default,
    borderRadius: radius.input,
    paddingHorizontal: 13,
    paddingVertical: 13,
  },
  readonlyValue: {
    ...textStyle({ size: 'control', weight: 'regular', color: color.ink.primary }),
  },
  readonlySub: {
    ...textStyle({ size: 'small', weight: 'regular', color: color.ink.muted }),
  },
  placeholder: {
    color: color.ink.placeholder,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[5],
  },
  clear: {
    ...textStyle({ size: 'control', weight: 'regular', color: color.ink.muted }),
  },
  multiline: {
    minHeight: 84,
    textAlignVertical: 'top',
  },
});
