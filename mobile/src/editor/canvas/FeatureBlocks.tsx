import { View, StyleSheet } from 'react-native';
import { useCanvas } from './CanvasContext';
import { InvText, InvUiText } from './InvText';
import { InvButton } from './BasicBlocks';
import { CalendarIcon } from '../icons';
import { EVENT_RED } from '../invitationTheme';
import { formatDday, formatDeadline, formatWhen, isPastDeadline, monthGrid, weekdayLabels } from '../format';
import type { BlockOfType } from '../types';

const SUNDAY = '#b5534b';

export function DateTimeBlockView({ block }: { block: BlockOfType<'datetime'> }) {
  const { project, theme, mode, showToast } = useCanvas();
  const p = block.props;
  const font = block.style?.font;
  const date = new Date(project.eventAt);
  const cells = monthGrid(project.eventAt);
  const weeks = Array.from({ length: cells.length / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7));
  const circle = p.circleColor === 'red' ? EVENT_RED : theme.accent;
  const nothing = !p.showWhen && !p.showDday && !p.showCalendar && !p.showCalendarButton;

  if (nothing) {
    return mode === 'edit' ? (
      <InvUiText size={13} soft style={styles.center}>
        일시 블록 · 모두 꺼져 있어요
      </InvUiText>
    ) : null;
  }

  return (
    <View style={styles.wrap}>
      {p.showWhen ? (
        <InvText font={font} size={17} bold leading={1.5} style={styles.center}>
          {formatWhen(project.eventAt)}
        </InvText>
      ) : null}
      {p.showDday ? (
        // 확정: "D-222"만, 띠 너비는 글자에 맞춤, 달력과 사이 여백 넉넉히
        <View style={[styles.band, { backgroundColor: theme.band }, p.showCalendar && styles.bandBeforeCalendar]}>
          <InvUiText size={14} bold style={{ color: theme.bandInk }}>
            {formatDday(project.eventAt)}
          </InvUiText>
        </View>
      ) : null}
      {p.showCalendar ? (
        <View style={styles.calendar}>
          <InvText font={font} size={20} bold leading={1.3} style={[styles.center, styles.calTitle]}>
            {`${date.getFullYear()}. ${String(date.getMonth() + 1).padStart(2, '0')}`}
          </InvText>
          {/* Rows of 7 with flex cells: 1/7-percent widths wrap early on iOS and push 토 to the next line. */}
          <View style={[styles.calGrid, { borderTopColor: theme.rule }]}>
            <View style={styles.calRow}>
              {weekdayLabels().map((w, i) => (
                <View key={w} style={styles.cell}>
                  <InvUiText size={11} soft style={i === 0 ? { color: SUNDAY } : null}>
                    {w}
                  </InvUiText>
                </View>
              ))}
            </View>
            {weeks.map((week, w) => (
              <View key={w} style={styles.calRow}>
                {week.map((day, i) => {
                  const isEvent = day === date.getDate();
                  return (
                    <View key={i} style={styles.cell}>
                      {day ? (
                        <View style={[styles.dayInner, isEvent && { borderColor: circle, borderWidth: 1.5 }]}>
                          <InvUiText
                            size={13}
                            bold={isEvent}
                            style={isEvent ? { color: circle } : i === 0 ? { color: SUNDAY } : null}
                          >
                            {day}
                          </InvUiText>
                        </View>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        </View>
      ) : null}
      {p.showCalendarButton ? (
        <View style={styles.calButton}>
          <InvButton
            label="캘린더에 추가"
            tone={p.buttonTone === 'inverse' ? 'fill' : 'outline'}
            hug
            icon={<CalendarIcon color={p.buttonTone === 'inverse' ? theme.paper : theme.ink} />}
            onPress={mode === 'preview' ? () => showToast('캘린더 추가는 게스트 화면에서 동작해요') : undefined}
          />
        </View>
      ) : null}
    </View>
  );
}

export function RsvpBlockView({ block }: { block: BlockOfType<'rsvp'> }) {
  const { mode, showToast } = useCanvas();
  const p = block.props;
  const closed = isPastDeadline(p.deadline);
  return (
    <View style={styles.rsvp}>
      {p.intro.trim() ? (
        <InvText font={block.style?.font} size={15} soft style={styles.center}>
          {p.intro}
        </InvText>
      ) : null}
      <InvButton
        label={closed ? '응답이 마감됐어요' : p.buttonLabel || '참석 의사 전달하기'}
        tone="fill"
        disabled={closed}
        onPress={mode === 'preview' ? () => showToast('참석 응답은 게스트 화면에서 받아요') : undefined}
      />
      {p.deadline && !closed ? (
        <InvUiText size={12} soft style={styles.center}>
          {`${formatDeadline(p.deadline)} 자정까지 응답해 주세요`}
        </InvUiText>
      ) : null}
    </View>
  );
}

export function GuestbookBlockView({ block }: { block: BlockOfType<'guestbook'> }) {
  const { mode, showToast } = useCanvas();
  const p = block.props;
  return (
    <View style={styles.rsvp}>
      {p.intro.trim() ? (
        <InvText font={block.style?.font} size={13.5} soft style={styles.center}>
          {p.intro}
        </InvText>
      ) : null}
      {p.visibility === 'public' ? (
        // Real posts arrive with the guest pages (D) + server storage; until then this is the empty state.
        <InvUiText size={12.5} soft style={[styles.center, styles.gbEmpty]}>
          {mode === 'edit' ? `게스트가 남긴 글이 최근 ${p.recentCount}개까지 여기에 보여요` : '아직 남겨진 글이 없어요'}
        </InvUiText>
      ) : null}
      <InvButton
        label={p.buttonLabel || '방명록 남기기'}
        tone="outline"
        onPress={mode === 'preview' ? () => showToast('방명록 작성은 게스트 화면에서 동작해요') : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'stretch',
  },
  center: {
    textAlign: 'center',
  },
  band: {
    alignSelf: 'center',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 18,
    marginTop: 10,
  },
  bandBeforeCalendar: {
    marginBottom: 22,
  },
  calendar: {
    alignSelf: 'center',
    width: '86%',
    maxWidth: 320,
    marginTop: 6,
  },
  calTitle: {
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  calGrid: {
    borderTopWidth: 1,
    paddingTop: 8,
  },
  calRow: {
    flexDirection: 'row',
  },
  cell: {
    flex: 1,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayInner: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calButton: {
    marginTop: 16,
  },
  rsvp: {
    gap: 12,
  },
  gbEmpty: {
    paddingVertical: 10,
  },
});
