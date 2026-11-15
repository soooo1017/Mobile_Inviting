import { useState } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { LabeledInput } from './sheets/common';
import { Help, Section, SelectRow } from './ui';
import { AddressSearch } from './AddressSearch';
import type { AddressPick } from './address';
import { venueAddressLine } from './maps';
import { space } from '../theme/tokens';
import type { Project, Venue } from '../types/project';

export function currentVenue(project: Project): Venue {
  return project.venue ?? { name: '', address: '', sido: '', mapLinks: { naver: true, kakao: true } };
}

/** 주소를 고른 값을 장소에 넣어요. 장소 이름이 비어 있으면 건물 이름으로 채워 줘요(이미 적은 이름은 그대로). */
export function applyAddressPick(venue: Venue, pick: AddressPick): Venue {
  return { ...venue, name: venue.name.trim() ? venue.name : pick.building, address: pick.address, sido: pick.sido || venue.sido, zip: pick.zip };
}

/**
 * 장소 — 이름(직접 적어요), 주소([주소 검색]으로 골라요), 상세 주소(층 · 홀, 직접 적어요).
 * 지도 앱(네이버 지도 · 카카오맵)은 기본 주소로만 검색하고, 상세 주소는 초대장에 글로만 보여요 — 홀 이름이 섞여서 지도에서 못 찾는 일을 막아요.
 * 장소 블록 · ⚙ 초대장 설정이 같이 써요.
 */
export function VenueFields({ project, onVenue }: { project: Project; onVenue: (venue: Venue) => void }) {
  const venue = currentVenue(project);
  const [searching, setSearching] = useState(false);
  // 이름과 같은 글이면 "주소를 따로 적지 않은" 예전 방식(한 칸)이라 주소 없음으로 봐요.
  const address = venueAddressLine(venue);
  // 검색으로 고르지 않고 직접 적었던 예전 주소 — 층 · 홀이 섞여 있을 수 있어요.
  const legacy = Boolean(address) && !venue.zip;
  return (
    <>
      <LabeledInput
        label="장소 이름"
        sub="초대장에 크게 보여요"
        value={venue.name}
        onChangeText={(name) =>
          // 예전 방식(이름과 주소가 같은 한 칸)은 둘을 같이 유지해요.
          onVenue(venue.address === venue.name ? { ...venue, name, address: name } : { ...venue, name })
        }
        placeholder="예: 더채플앳청담"
        maxLength={40}
      />
      <Section label="주소" sub="지도 앱 검색에 써요">
        <SelectRow label={address || '주소를 검색해 주세요'} value={address ? '다시 검색' : '주소 검색'} muted={!address} onPress={() => setSearching(true)} />
        {venue.zip ? <Text style={styles.zip}>{`우편번호 ${venue.zip}${venue.sido ? ` · ${venue.sido}` : ''}`}</Text> : null}
        {legacy ? <Help>검색으로 다시 고르면 기본 주소와 상세 주소로 나뉘어요.</Help> : null}
      </Section>
      <View style={!address ? styles.off : undefined}>
        <LabeledInput
          label="상세 주소"
          sub="선택 · 층 · 홀"
          // 적은 그대로(띄어쓰기 · 끝의 공백 포함)를 보여줘요.
          value={venue.detail ?? ''}
          onChangeText={(detail) => onVenue({ ...venue, detail })}
          editable={Boolean(address)}
          placeholder="예: 3층 그랜드홀"
          maxLength={40}
        />
        {!address ? <Help>주소를 먼저 검색하면 적을 수 있어요.</Help> : null}
      </View>
      <AddressSearch
        visible={searching}
        onClose={() => setSearching(false)}
        onPick={(pick) => {
          setSearching(false);
          onVenue(applyAddressPick(venue, pick));
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  zip: { fontSize: 12, color: '#8b8793', marginTop: space[1] },
  off: { opacity: 0.55 },
});
