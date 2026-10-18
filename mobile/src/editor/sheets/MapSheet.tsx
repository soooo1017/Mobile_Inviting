import { View, StyleSheet } from 'react-native';
import { space } from '../../theme/tokens';
import { EditorSheet } from '../EditorSheet';
import { Chips, Help, Section, ToggleList } from '../ui';
import { LabeledInput } from './common';
import type { BlockSheetProps } from './BasicSheets';
import { venueAddressLine } from '../maps';
import type { Project, Venue } from '../../types/project';

type Props = BlockSheetProps<'map'> & { onProject: (patch: { venue: Venue }) => void };

/** 장소 편집 — name/address are the project's 행사 장소, so editing here changes it everywhere. */
export function MapSheet({ block, onChange, onDone, project, onProject }: Props) {
  const p = block.props;
  const set = (patch: Partial<typeof p>) => onChange({ ...block, props: { ...p, ...patch } });
  const venue = currentVenue(project);
  const setVenue = (patch: Partial<Venue>) => onProject({ venue: { ...venue, ...patch } });

  return (
    <EditorSheet title="장소" onDone={onDone} maxHeight={0.78}>
      <LabeledInput
        label="장소 이름"
        value={venue.name}
        onChangeText={(name) =>
          // The new-project step stores one text as both name and address — keep them together until the address is set apart.
          setVenue(venue.address === venue.name ? { name, address: name } : { name })
        }
        placeholder="예: 더채플앳청담"
        maxLength={40}
      />
      <LabeledInput
        label="주소"
        sub="층 · 홀까지 적어도 돼요"
        value={venueAddressLine(venue)}
        onChangeText={(address) => setVenue({ address })}
        placeholder="예: 서울 강남구 선릉로 757 · 3층 그랜드홀"
        maxLength={80}
      />
      <Help>행사 정보의 장소와 같이 바뀌어요.</Help>
      <ToggleList items={[{ key: 'copy', label: '주소 복사 버튼', value: p.showCopy, onChange: (showCopy) => set({ showCopy }) }]} />
      <Section label="지도 버튼">
        <View style={styles.mapGroup}>
          <ToggleList items={[{ key: 'naver', label: '네이버 지도 버튼', value: p.showNaver, onChange: (showNaver) => set({ showNaver }) }]} />
          {p.showNaver ? (
            <View style={styles.linkRow}>
              <View style={styles.flex}>
                <LabeledInput
                  label="네이버 지도 링크"
                  sub="선택"
                  value={p.naverUrl}
                  onChangeText={(naverUrl) => set({ naverUrl })}
                  placeholder="naver.me/…"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                />
              </View>
            </View>
          ) : null}
          <ToggleList items={[{ key: 'kakao', label: '카카오맵 버튼', value: p.showKakao, onChange: (showKakao) => set({ showKakao }) }]} />
          {p.showKakao ? (
            <View style={styles.linkRow}>
              <View style={styles.flex}>
                <LabeledInput
                  label="카카오맵 링크"
                  sub="선택"
                  value={p.kakaoUrl}
                  onChangeText={(kakaoUrl) => set({ kakaoUrl })}
                  placeholder="place.map.kakao.com/…"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                />
              </View>
            </View>
          ) : null}
        </View>
        <Help>링크를 비워두면 주소로 검색해서 열어요. 검색이 잘 안 되면 지도 앱에서 장소 공유 링크를 복사해 넣어주세요.</Help>
      </Section>
      <Section label="버튼 모양">
        <Chips
          options={[
            { value: 'outline', label: '테두리' },
            { value: 'fill', label: '채움' },
          ]}
          value={p.shape}
          onChange={(shape) => set({ shape })}
        />
      </Section>
    </EditorSheet>
  );
}

function currentVenue(project: Project): Venue {
  return project.venue ?? { name: '', address: '', sido: '', mapLinks: { naver: true, kakao: true } };
}

const styles = StyleSheet.create({
  mapGroup: {
    gap: space[4],
  },
  linkRow: {
    flexDirection: 'row',
    paddingLeft: space[6],
  },
  flex: {
    flex: 1,
  },
});
