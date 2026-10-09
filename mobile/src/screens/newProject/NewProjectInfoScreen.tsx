import { useState } from 'react';
import { Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { useNewProjectDraft } from '../../state/NewProjectDraftContext';
import { WizardHeader } from './WizardHeader';
import { FieldLabel } from '../../components/FieldLabel';
import { TextField } from '../../components/TextField';
import { HelperText } from '../../components/HelperText';
import { SelectChip } from '../../components/SelectChip';
import { PrimaryButton } from '../../components/PrimaryButton';
import { color, space } from '../../theme/tokens';
import { textStyle } from '../../theme/typography';
import { eventTypeMeta, SIDO_LIST, type MapLink } from '../../types/project';
import { formatEventDateTime } from '../../utils/projectStatus';

type Props = NativeStackScreenProps<RootStackParamList, 'NewProjectInfo'>;

export function NewProjectInfoScreen({ navigation }: Props) {
  const { draft, update } = useNewProjectDraft();
  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);
  const [venueText, setVenueText] = useState(draft.venue?.name ?? '');

  const eventDate = new Date(draft.eventAt);
  const typeLabel = eventTypeMeta(draft.eventType).label;

  const setHostName = (index: number, name: string) => {
    const hosts = draft.hosts.map((h, i) => (i === index ? { ...h, name } : h));
    update({ hosts });
  };

  const setVenueField = (text: string) => {
    setVenueText(text);
    update({
      venue: text
        ? { name: text, address: text, sido: draft.venue?.sido ?? '', mapLinks: draft.venue?.mapLinks ?? { naver: false, kakao: false } }
        : undefined,
    });
  };

  const setSido = (sido: string) => {
    if (!venueText) return;
    update({ venue: { name: venueText, address: venueText, sido, mapLinks: draft.venue?.mapLinks ?? { naver: false, kakao: false } } });
  };

  const toggleMapLink = (link: MapLink) => {
    if (!draft.venue) return;
    update({ venue: { ...draft.venue, mapLinks: { ...draft.venue.mapLinks, [link]: !draft.venue.mapLinks[link] } } });
  };

  const canProceed = draft.hosts.every((h) => h.name.trim().length > 0);

  return (
    <View style={styles.screen}>
      <WizardHeader onBack={() => navigation.goBack()} step={2} stepLabel={`기본 정보 · ${typeLabel}`} />
      <ScrollView contentContainerStyle={styles.content}>
        <FieldLabel>주인공</FieldLabel>
        <View style={styles.hostRow}>
          {draft.hosts.map((h, i) => (
            <View key={h.label} style={styles.hostField}>
              <Text style={styles.hostLabel}>{h.label}</Text>
              <TextField value={h.name} onChangeText={(v) => setHostName(i, v)} placeholder={h.label} />
            </View>
          ))}
        </View>
        <HelperText>칸 이름은 행사 유형에 맞춰 미리 채워져요.</HelperText>

        <View style={styles.section}>
          <FieldLabel>행사 일시</FieldLabel>
          <View style={styles.dateTimeRow}>
            <Pressable style={styles.dateTimeField} onPress={() => setShowDate(true)}>
              <Text style={styles.dateTimeText}>{formatEventDateTime(draft.eventAt).split(' ').slice(0, 4).join(' ')}</Text>
            </Pressable>
            <Pressable style={styles.dateTimeField} onPress={() => setShowTime(true)}>
              <Text style={styles.dateTimeText}>{formatEventDateTime(draft.eventAt).split(' ').slice(4).join(' ')}</Text>
            </Pressable>
          </View>
          {showDate ? (
            <DateTimePicker
              value={eventDate}
              mode="date"
              onChange={(_, selected) => {
                setShowDate(false);
                if (selected) {
                  const next = new Date(eventDate);
                  next.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
                  update({ eventAt: next.toISOString() });
                }
              }}
            />
          ) : null}
          {showTime ? (
            <DateTimePicker
              value={eventDate}
              mode="time"
              onChange={(_, selected) => {
                setShowTime(false);
                if (selected) {
                  const next = new Date(eventDate);
                  next.setHours(selected.getHours(), selected.getMinutes());
                  update({ eventAt: next.toISOString() });
                }
              }}
            />
          ) : null}
        </View>

        <View style={styles.section}>
          <FieldLabel>행사 장소</FieldLabel>
          <TextField value={venueText} onChangeText={setVenueField} placeholder="장소명 또는 주소 검색" />
          {venueText ? (
            <View style={styles.sidoRow}>
              {SIDO_LIST.map((s) => (
                <SelectChip key={s} label={s} selected={draft.venue?.sido === s} onPress={() => setSido(s)} />
              ))}
            </View>
          ) : null}
        </View>

        <View style={styles.section}>
          <View style={styles.mapHeaderRow}>
            <FieldLabel>지도 · 길찾기 연결</FieldLabel>
            <Text style={styles.mapHint}>선택 · 중복 가능</Text>
          </View>
          <View style={styles.mapToggleRow}>
            <MapToggle label="네이버 지도" selected={!!draft.venue?.mapLinks.naver} onPress={() => toggleMapLink('naver')} />
            <MapToggle label="카카오맵" selected={!!draft.venue?.mapLinks.kakao} onPress={() => toggleMapLink('kakao')} />
          </View>
          <HelperText>{'선택하지 않으면 장소 이름과 주소만 표시돼요.\n나중에 입력해도 괜찮아요.'}</HelperText>
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <PrimaryButton label="다음" onPress={() => navigation.navigate('NewProjectThanks')} disabled={!canProceed} />
      </View>
    </View>
  );
}

function MapToggle({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.mapToggle, selected && styles.mapToggleSelected]} onPress={onPress}>
      <View style={[styles.mapCheckbox, selected && styles.mapCheckboxSelected]}>
        {selected ? <Text style={styles.mapCheckMark}>✓</Text> : null}
      </View>
      <Text style={[styles.mapToggleLabel, selected && styles.mapToggleLabelSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.bg.canvas,
  },
  content: {
    paddingHorizontal: space.screenX,
    paddingTop: space[8],
    gap: space[3],
  },
  hostRow: {
    flexDirection: 'row',
    gap: space[5],
  },
  hostField: {
    flex: 1,
  },
  hostLabel: {
    ...textStyle({ size: 'small', weight: 'regular', color: color.ink.muted }),
    marginBottom: space[2],
  },
  section: {
    marginTop: space[8],
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: space[5],
  },
  dateTimeField: {
    flex: 1,
    backgroundColor: color.bg.surface,
    borderWidth: 1,
    borderColor: color.line.default,
    borderRadius: 8,
    paddingHorizontal: 13,
    paddingVertical: 13,
  },
  dateTimeText: {
    ...textStyle({ size: 'control', weight: 'regular', color: color.ink.primary }),
  },
  sidoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[3],
    marginTop: space[5],
  },
  mapHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mapHint: {
    ...textStyle({ size: 'small', weight: 'regular', color: color.ink.muted }),
  },
  mapToggleRow: {
    flexDirection: 'row',
    gap: space[5],
  },
  mapToggle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    borderWidth: 1,
    borderColor: color.line.chip,
    borderRadius: 8,
    paddingVertical: space[5],
    paddingHorizontal: space[5],
    backgroundColor: color.bg.surface,
  },
  mapToggleSelected: {
    backgroundColor: color.select.fill,
    borderColor: color.select.fill,
  },
  mapCheckbox: {
    width: 17,
    height: 17,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: color.line.strong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapCheckboxSelected: {
    borderColor: '#ffffff',
  },
  mapCheckMark: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  mapToggleLabel: {
    ...textStyle({ size: 'label', weight: 'medium', color: color.ink.primary }),
  },
  mapToggleLabelSelected: {
    color: color.select.on,
  },
  footer: {
    paddingHorizontal: space.screenX,
    paddingBottom: space[9],
    paddingTop: space[6],
  },
});
