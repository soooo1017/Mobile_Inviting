import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, Text, View, StyleSheet } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { ModalSafeArea } from '../components/ModalSafeArea';
import { color, space } from '../theme/tokens';
import { textStyle } from '../theme/typography';
import { parsePostcode, type AddressPick } from './address';

/**
 * 주소 검색 — 카카오(다음) 우편번호 서비스를 앱 안의 웹 화면으로 열어요(배달앱의 주소 검색창과 같은 거예요).
 * 키 · 가입 없이 무료이고, 도로명 · 지번 · 건물 이름으로 찾아요(가게 이름만으로는 안 찾아져요).
 * 골라서 돌아오는 값은 address.ts의 parsePostcode가 다듬어요.
 */

// 카카오가 옛 주소(t1.daumcdn.net)를 2026-12-01부터 막는다고 알려서 새 주소(t1.kakaocdn.net)를 써요. 경로 · 사용법은 같아요.
const POSTCODE_SCRIPT = 'https://t1.kakaocdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
const HTML = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<style>html,body,#w{margin:0;padding:0;width:100%;height:100%;background:#fff}</style></head><body><div id="w"></div>
<script src="${POSTCODE_SCRIPT}"></script>
<script>
  var post = function (o) { window.ReactNativeWebView.postMessage(JSON.stringify(o)); };
  setTimeout(function () { if (!window.__ready) post({ __error: 'load' }); }, 8000);
  try {
    var NS = window.kakao && window.kakao.Postcode ? window.kakao : window.daum;
    new NS.Postcode({ oncomplete: function (d) { post(d); }, width: '100%', height: '100%' }).embed(document.getElementById('w'));
    window.__ready = true;
  } catch (e) { post({ __error: 'load' }); }
</script></body></html>`;

type Props = { visible: boolean; onClose: () => void; onPick: (pick: AddressPick) => void };

export function AddressSearch({ visible, onClose, onPick }: Props) {
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setFailed(false);
      setLoading(true);
      setAttempt((n) => n + 1);
    }
  }

  const onMessage = (e: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(e.nativeEvent.data) as Record<string, unknown>;
      if (data.__error) {
        setFailed(true);
        return;
      }
      const pick = parsePostcode(data);
      if (pick) onPick(pick);
    } catch {
      setFailed(true);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <ModalSafeArea style={styles.screen}>
        <View style={styles.head}>
          <Text style={styles.title}>주소 검색</Text>
          <Pressable onPress={onClose} hitSlop={12} accessibilityLabel="닫기">
            <Text style={styles.close}>✕</Text>
          </Pressable>
        </View>
        {failed ? (
          <View style={styles.center}>
            <Text style={styles.failTitle}>주소 검색을 열지 못했어요</Text>
            <Text style={styles.failBody}>{'인터넷 연결을 확인하고\n다시 시도해 주세요.'}</Text>
            <Pressable
              style={styles.retry}
              onPress={() => {
                setFailed(false);
                setLoading(true);
                setAttempt((n) => n + 1);
              }}
            >
              <Text style={styles.retryLabel}>다시 시도</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.flex}>
            <WebView
              key={attempt}
              style={styles.flex}
              originWhitelist={['*']}
              source={{ html: HTML, baseUrl: 'https://postcode.map.kakao.com' }}
              javaScriptEnabled
              onMessage={onMessage}
              onLoadEnd={() => setLoading(false)}
              onError={() => setFailed(true)}
              onHttpError={() => setFailed(true)}
            />
            {loading ? (
              <View style={styles.loading} pointerEvents="none">
                <ActivityIndicator color={color.accent.base} />
              </View>
            ) : null}
          </View>
        )}
        <Text style={styles.foot}>카카오(다음) 우편번호 서비스예요. 도로명 · 지번 · 건물 이름으로 찾을 수 있어요.</Text>
      </ModalSafeArea>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg.surface },
  flex: { flex: 1 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.screenX, paddingVertical: space[5], borderBottomWidth: 1, borderBottomColor: color.line.soft },
  title: { ...textStyle({ size: 'title3', weight: 'semibold', color: color.ink.primary }) },
  close: { ...textStyle({ size: 'title2', weight: 'regular', color: color.ink.secondary }) },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space[4], paddingHorizontal: space[10] },
  failTitle: { ...textStyle({ size: 'control', weight: 'semibold', color: color.ink.primary }) },
  failBody: { ...textStyle({ size: 'label', weight: 'regular', color: color.ink.muted }), textAlign: 'center', lineHeight: 21 },
  retry: { marginTop: space[4], backgroundColor: color.ink.primary, borderRadius: 10, paddingHorizontal: space[9], paddingVertical: space[5] },
  retryLabel: { ...textStyle({ size: 'control', weight: 'semibold', color: color.ink.onPrimary }) },
  loading: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  foot: { ...textStyle({ size: 'caption', weight: 'regular', color: color.ink.muted }), textAlign: 'center', paddingHorizontal: space.screenX, paddingVertical: space[4] },
});
