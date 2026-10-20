import { useState } from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { color } from '../theme/tokens';
import { formatWhenShort } from './format';
import { SelectRow } from './ui';
import type { Project } from '../types/project';

/**
 * 행사 정보 rows — 날짜 · 시간 (calendar / time wheel open right below) and 장소.
 * Shared by ⚙ 전체 설정 and 관리 › 프로젝트 설정 so both always look and behave the same.
 */
export function EventInfoRows({
  project,
  onEventAt,
  onOpenVenue,
}: {
  project: Project;
  onEventAt: (iso: string) => void;
  onOpenVenue: () => void;
}) {
  const [picker, setPicker] = useState<'date' | 'time' | null>(null);
  const eventDate = new Date(project.eventAt);
  const whenShort = formatWhenShort(project.eventAt); // "2027. 5. 22. (토) 오후 1:00"
  const venueName = project.venue?.name.trim() ?? '';
  return (
    <>
      <SelectRow label={whenShort.slice(0, whenShort.indexOf(')') + 1)} value="날짜" onPress={() => setPicker(picker === 'date' ? null : 'date')} />
      <SelectRow label={whenShort.slice(whenShort.indexOf(')') + 2)} value="시간" onPress={() => setPicker(picker === 'time' ? null : 'time')} />
      {picker ? (
        <View style={styles.pickerWrap}>
          <DateTimePicker
            locale="ko-KR"
            value={eventDate}
            mode={picker}
            display={Platform.OS === 'ios' ? (picker === 'date' ? 'inline' : 'spinner') : 'default'}
            accentColor={color.select.fill}
            onChange={(e, d) => {
              if (Platform.OS !== 'ios') setPicker(null);
              if (e.type !== 'set' || !d) return;
              const next = new Date(eventDate);
              if (picker === 'date') next.setFullYear(d.getFullYear(), d.getMonth(), d.getDate());
              else next.setHours(d.getHours(), d.getMinutes(), 0, 0);
              onEventAt(next.toISOString());
            }}
          />
        </View>
      ) : null}
      <SelectRow label={venueName || '장소를 입력해주세요'} value="장소" muted={!venueName} onPress={onOpenVenue} />
    </>
  );
}

const styles = StyleSheet.create({
  // iOS draws the inline calendar at its own width, flush left — center it.
  pickerWrap: {
    alignItems: 'center',
  },
});
