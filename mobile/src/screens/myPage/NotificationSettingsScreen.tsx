import { useEffect, useState } from 'react';
import { ActivityIndicator, Switch, Text, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { useAuth } from '../../state/AuthContext';
import { supabase } from '../../lib/supabase';
import { BackButton } from '../../components/BackButton';
import { ScreenTitle } from '../../components/ScreenTitle';
import { color, radius, space } from '../../theme/tokens';
import { textStyle } from '../../theme/typography';

type Props = NativeStackScreenProps<RootStackParamList, 'NotificationSettings'>;

type Prefs = {
  rsvp_alerts: boolean;
  guestbook_alerts: boolean;
  thanks_transition_alerts: boolean;
  event_schedule_alerts: boolean;
  marketing_alerts: boolean;
};

const DEFAULT_PREFS: Prefs = {
  rsvp_alerts: true,
  guestbook_alerts: true,
  thanks_transition_alerts: true,
  event_schedule_alerts: false,
  marketing_alerts: false,
};

const TOGGLES: { key: keyof Prefs; label: string; desc: string }[] = [
  { key: 'rsvp_alerts', label: 'RSVP 응답 알림', desc: '하객이 참석 여부를 응답하면 알려드려요.' },
  { key: 'guestbook_alerts', label: '방명록 알림', desc: '방명록에 새 글이 달리면 알려드려요.' },
  { key: 'thanks_transition_alerts', label: '감사 페이지 자동 전환 알림', desc: '청첩장이 감사 페이지로 바뀌면 알려드려요.' },
  { key: 'event_schedule_alerts', label: '행사 일정 알림', desc: '행사 날짜가 가까워지면 알려드려요.' },
  { key: 'marketing_alerts', label: '마케팅·이벤트 알림', desc: '혜택, 이벤트 소식을 보내드려요.' },
];

export function NotificationSettingsScreen({ navigation }: Props) {
  const { auth } = useAuth();
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<keyof Prefs | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!auth.user) return;
      const { data } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', auth.user.id)
        .maybeSingle();
      if (!active) return;
      if (data) {
        setPrefs({
          rsvp_alerts: data.rsvp_alerts,
          guestbook_alerts: data.guestbook_alerts,
          thanks_transition_alerts: data.thanks_transition_alerts,
          event_schedule_alerts: data.event_schedule_alerts,
          marketing_alerts: data.marketing_alerts,
        });
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [auth.user]);

  const handleToggle = async (key: keyof Prefs, value: boolean) => {
    if (!auth.user) return;
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    setSaving(key);
    await supabase.from('notification_preferences').upsert({ user_id: auth.user.id, ...next });
    setSaving(null);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <BackButton onPress={() => navigation.goBack()} />
      <View style={styles.content}>
        <ScreenTitle>알림 설정</ScreenTitle>

        {loading ? (
          <ActivityIndicator style={styles.loading} color={color.accent.base} />
        ) : (
          <View style={styles.list}>
            {TOGGLES.map((t, i) => (
              <View key={t.key} style={[styles.row, i === TOGGLES.length - 1 && styles.rowLast]}>
                <View style={styles.rowText}>
                  <Text style={styles.label}>{t.label}</Text>
                  <Text style={styles.desc}>{t.desc}</Text>
                </View>
                {saving === t.key ? (
                  <ActivityIndicator color={color.accent.base} />
                ) : (
                  <Switch
                    value={prefs[t.key]}
                    onValueChange={(v) => handleToggle(t.key, v)}
                    trackColor={{ false: color.line.strong, true: color.accent.base }}
                    thumbColor="#ffffff"
                  />
                )}
              </View>
            ))}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.bg.canvas,
  },
  content: {
    flex: 1,
    paddingHorizontal: space.screenX,
  },
  loading: {
    marginTop: space[10],
  },
  list: {
    marginTop: space[8],
    backgroundColor: color.bg.surface,
    borderRadius: radius.card,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space[6],
    paddingHorizontal: space[7],
    paddingVertical: space[7],
    borderBottomWidth: 1,
    borderBottomColor: color.line.soft,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowText: {
    flex: 1,
    gap: space[2],
  },
  label: {
    ...textStyle({ size: 'control', weight: 'medium', color: color.ink.primary }),
  },
  desc: {
    ...textStyle({ size: 'small', weight: 'regular', color: color.ink.muted }),
    lineHeight: 13 * 1.4,
  },
});
