import { Pressable, View, StyleSheet } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useCanvas } from './CanvasContext';
import { InvText, InvUiText } from './InvText';
import { InvButton } from './BasicBlocks';
import { CopyIcon, KakaoMapIcon, NaverMapIcon } from '../icons';
import { openMap, venueAddressLine, venueQuery, type MapApp } from '../maps';
import type { BlockOfType } from '../types';

/** 장소: name + address as text, then buttons that open 네이버 지도 / 카카오맵 (no map drawing). */
export function MapBlockView({ block }: { block: BlockOfType<'map'> }) {
  const { project, theme, mode, showToast } = useCanvas();
  const p = block.props;
  const venue = project.venue;
  const live = mode === 'preview';
  const name = venue?.name.trim() ?? '';
  const address = venueAddressLine(venue);
  const query = venueQuery(venue);

  if (!name) {
    return mode === 'edit' ? (
      <View style={[styles.emptyHint, { borderColor: theme.rule }]}>
        <InvUiText size={13} soft>
          장소를 입력해주세요
        </InvUiText>
      </View>
    ) : null;
  }

  const copy = async () => {
    await Clipboard.setStringAsync(address || name);
    showToast('주소를 복사했어요');
  };
  const open = (app: MapApp) => () =>
    openMap(app, query, app === 'naver' ? p.naverUrl : p.kakaoUrl).catch(() => showToast('지도를 열지 못했어요'));

  const tone = p.shape === 'fill' ? 'fill' : 'outline';
  return (
    <View style={styles.wrap}>
      <InvText font={block.style?.font} size={18} bold leading={1.4} style={styles.center}>
        {name}
      </InvText>
      {address || p.showCopy ? (
        <View style={styles.addressRow}>
          {address ? (
            <InvText font={block.style?.font} size={13.5} soft leading={1.6} style={[styles.center, styles.shrink]}>
              {address}
            </InvText>
          ) : null}
          {p.showCopy ? (
            <Pressable onPress={live ? copy : undefined} disabled={!live} hitSlop={10} accessibilityLabel="주소 복사">
              <CopyIcon size={13} color={theme.inkSoft} />
            </Pressable>
          ) : null}
        </View>
      ) : null}
      {p.showNaver || p.showKakao ? (
        <View style={styles.buttons}>
          {p.showNaver ? (
            <View style={styles.flex}>
              <InvButton label="네이버 지도" tone={tone} icon={<NaverMapIcon />} onPress={live ? open('naver') : undefined} />
            </View>
          ) : null}
          {p.showKakao ? (
            <View style={styles.flex}>
              <InvButton label="카카오맵" tone={tone} icon={<KakaoMapIcon />} onPress={live ? open('kakao') : undefined} />
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 6,
  },
  center: {
    textAlign: 'center',
  },
  shrink: {
    flexShrink: 1,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  buttons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  flex: {
    flex: 1,
  },
  emptyHint: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 18,
    alignItems: 'center',
  },
});
