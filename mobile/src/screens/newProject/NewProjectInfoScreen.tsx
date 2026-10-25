import { useState } from 'react';
import { Platform, Pressable, Text, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { useNewProjectDraft } from '../../state/NewProjectDraftContext';
import { WizardHeader } from './WizardHeader';
import { HostFields, hostsComplete } from './HostFields';
import { FieldLabel } from '../../components/FieldLabel';
import { TextField } from '../../components/TextField';
import { HelperText } from '../../components/HelperText';
import { SelectChip } from '../../components/SelectChip';
import { PrimaryButton } from '../../components/PrimaryButton';
import { KeyboardAwareForm, useKeyboardAwareForm } from '../../components/KeyboardAwareForm';
import { color, space } from '../../theme/tokens';
import { textStyle } from '../../theme/typography';
import { eventTypeMeta, SIDO_LIST, type MapLink } from '../../types/project';
import { formatEventDateTime } from '../../utils/projectStatus';

type Props = NativeStackScreenProps<RootStackParamList, 'NewProjectInfo'>;

export function NewProjectInfoScreen({ navigation }: Props) {
  const { draft, update } = useNewProjectDraft();
  const { scrollRef, fieldLayout, onFieldFocus } = useKeyboardAwareForm();
  // Same as ⚙ 전체 설정: tapping 일자/시간 opens the calendar / time wheel right away (tap again to close).
  const [picker, setPicker] = useState<'date' | 'time' | null>(null);
  const [venueText, setVenueText] = useState(draft.venue?.name ?? '');

  const eventDate = new Date(draft.eventAt);
  const typeLabel = draft.eventType === 'other' ? draft.customTypeName || '기타' : eventTypeMeta(draft.eventType).label;


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

  const canProceed = hostsComplete(draft.eventType, draft.hosts);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <WizardHeader onBack={() => navigation.goBack()} step={2} stepLabel={`기본 정보 · ${typeLabel}`} />
      <KeyboardAwareForm
        scrollRef={scrollRef}
        contentContainerStyle={styles.content}
        footer={
          <View style={styles.footer}>
            <PrimaryButton label="다음" onPress={() => navigation.navigate('NewProjectThanks')} disabled={!canProceed} />
          </View>
        }
      >
        <View onLayout={fieldLayout('hosts')}>
          <HostFields eventType={draft.eventType} hosts={draft.hosts} onChange={(hosts) => update({ hosts })} onFocus={() => onFieldFocus('hosts')} />
        </View>
        <View style={styles.section}>
          <FieldLabel>행사 일시</FieldLabel>
          <View style={styles.dateTimeRow}>
            <Pressable
              style={[styles.dateTimeField, picker === 'date' && styles.dateTimeFieldOn]}
              onPress={() => setPicker(picker === 'date' ? null : 'date')}
            >
              <Text style={styles.dateTimeText}>{formatEventDateTime(draft.eventAt).split(' ').slice(0, 4).join(' ')}</Text>
            </Pressable>
            <Pressable
              style={[styles.dateTimeField, picker === 'time' && styles.dateTimeFieldOn]}
              onPress={() => setPicker(picker === 'time' ? null : 'time')}
            >
              <Text style={styles.dateTimeText}>{formatEventDateTime(draft.eventAt).split(' ').slice(4).join(' ')}</Text>
            </Pressable>
          </View>
          {picker ? (
            <View style={styles.pickerWrap}>
              <DateTimePicker
                locale="ko-KR"
                value={eventDate}
                mode={picker}
                display={Platform.OS === 'ios' ? (picker === 'date' ? 'inline' : 'spinner') : 'default'}
                accentColor={color.select.fill}
                onChange={(e, selected) => {
                  if (Platform.OS !== 'ios') setPicker(null);
                  if (e.type !== 'set' || !selected) return;
                  const next = new Date(eventDate);
                  if (picker === 'date') next.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
                  else next.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
                  update({ eventAt: next.toISOString() });
                }}
              />
            </View>
          ) : null}
        </View>

        <View style={styles.section} onLayout={fieldLayout('venue')}>
          <FieldLabel>행사 장소</FieldLabel>
          <TextField
            value={venueText}
            onChangeText={setVenueField}
            onFocus={() => onFieldFocus('venue')}
            placeholder="장소명 또는 주소 검색"
          />
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
      </KeyboardAwareForm>
    </SafeAreaView>
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
  dateTimeFieldOn: {
    borderColor: color.select.fill,
  },
  pickerWrap: {
    alignItems: 'center',
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
