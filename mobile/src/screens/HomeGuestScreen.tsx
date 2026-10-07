import { useState } from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { Placeholder } from '../components/Placeholder';
import { PrimaryButton } from '../components/PrimaryButton';
import { TextLink } from '../components/TextLink';
import { color, radius, space } from '../theme/tokens';
import { textStyle } from '../theme/typography';

type Props = NativeStackScreenProps<RootStackParamList, 'HomeGuest'>;

const CHIPS = ['인사말', '갤러리', '오시는 길', 'RSVP', '방명록'] as const;

export function HomeGuestScreen({ navigation }: Props) {
  const [activeChip, setActiveChip] = useState<(typeof CHIPS)[number]>('인사말');

  return (
    <View style={styles.screen}>
      <View style={styles.top}>
        <Placeholder width={84} height={16} label="앱 이름" />

        <Text style={styles.headline}>
          블록을 고르고 쌓아서{'\n'}나만의 초대장을
        </Text>
        <Text style={styles.description}>
          인사말, 갤러리, 지도, RSVP, 방명록.{'\n'}필요한 것만 골라 순서대로 놓으면 됩니다.
        </Text>

        <View style={styles.previewCard}>
          <LinearGradient
            colors={['#e7e1d9', '#dcd6ea', '#d8cfe0']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.previewImage}
          >
            <View style={styles.previewLabelWrap}>
              <Text style={styles.previewLabel}>갤러리 블록 · 2열 그리드</Text>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.chipRow}>
          {CHIPS.map((chip) => {
            const active = chip === activeChip;
            return (
              <Pressable key={chip} onPress={() => setActiveChip(chip)} style={[styles.chip, active && styles.chipActive]}>
                <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{chip}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.bottom}>
        <PrimaryButton label="시작하기" onPress={() => navigation.navigate('Login')} />
        <View style={styles.signupRow}>
          <Text style={styles.signupPrompt}>계정이 없으신가요? </Text>
          <TextLink weight="semibold" color={color.accent.base} underline onPress={() => navigation.navigate('Signup')}>
            회원가입
          </TextLink>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.bg.canvas,
    justifyContent: 'space-between',
  },
  top: {
    paddingTop: 28,
    paddingHorizontal: space.screenX,
  },
  headline: {
    ...textStyle({ size: 'hero', weight: 'semibold', letterSpacing: 'heading', color: color.ink.primary }),
    lineHeight: 23 * 1.42,
    marginTop: space[7],
  },
  description: {
    ...textStyle({ size: 'body', weight: 'regular', color: color.ink.muted }),
    lineHeight: 12.5 * 1.7,
    marginTop: space[5],
  },
  previewCard: {
    marginTop: space[9],
    backgroundColor: color.bg.surface,
    borderWidth: 1,
    borderColor: color.line.default,
    borderRadius: radius.card,
    padding: 5,
  },
  previewImage: {
    height: 176,
    borderRadius: 9,
    justifyContent: 'flex-end',
    padding: space[3],
  },
  previewLabelWrap: {
    alignSelf: 'flex-start',
    backgroundColor: color.bg.surface,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  previewLabel: {
    ...textStyle({ size: 'micro', weight: 'medium', color: color.ink.primary }),
  },
  chipRow: {
    marginTop: space[5],
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[3],
  },
  chip: {
    backgroundColor: color.bg.surface,
    borderWidth: 1,
    borderColor: color.line.default,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipActive: {
    backgroundColor: color.accent.tint,
    borderColor: color.accent.tint,
  },
  chipLabel: {
    ...textStyle({ size: 'micro', weight: 'medium', color: color.ink.muted }),
  },
  chipLabelActive: {
    color: color.accent.base,
  },
  bottom: {
    paddingHorizontal: space.screenX,
    paddingTop: space[10],
    paddingBottom: 22,
    gap: space[5],
  },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: space[2],
  },
  signupPrompt: {
    ...textStyle({ size: 'label', weight: 'regular', color: color.ink.muted }),
  },
});
