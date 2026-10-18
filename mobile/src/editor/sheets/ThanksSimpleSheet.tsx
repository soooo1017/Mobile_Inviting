import { useState } from 'react';
import { Image, Pressable, Text, View, StyleSheet } from 'react-native';
import { color, radius, space } from '../../theme/tokens';
import { textStyle } from '../../theme/typography';
import { TextField } from '../../components/TextField';
import { EditorSheet } from '../EditorSheet';
import { CoverPicker } from '../CoverPicker';
import { Help, Section, ToggleList } from '../ui';
import { LabeledInput } from './common';
import { coverPhoto } from '../photos';
import { defaultThanksMessage, defaultThanksSender, defaultThanksTitle } from '../thanks';
import type { Invitation, ThanksSimple } from '../types';
import type { Project } from '../../types/project';

type Props = {
  project: Project;
  invitation: Invitation;
  simple: ThanksSimple;
  onChange: (simple: ThanksSimple) => void;
  onCover: (photoId: string) => void;
  onDone: () => void;
};

/** 감사페이지(간단) 편집 — only the words and the photo change; the layout stays fixed. */
export function ThanksSimpleSheet({ project, invitation, simple, onChange, onCover, onDone }: Props) {
  const [picking, setPicking] = useState(false);
  const set = (patch: Partial<ThanksSimple>) => onChange({ ...simple, ...patch });
  const photo = coverPhoto(invitation);

  if (picking) {
    return (
      <EditorSheet title="대표 사진" onBack={() => setPicking(false)} onDone={() => setPicking(false)} maxHeight={0.8}>
        <CoverPicker invitation={invitation} onSelect={onCover} />
      </EditorSheet>
    );
  }

  const message = simple.message ?? defaultThanksMessage(project);
  return (
    <EditorSheet title="감사페이지" onDone={onDone} maxHeight={0.72}>
      <LabeledInput
        label="제목"
        value={simple.title ?? defaultThanksTitle(project)}
        onChangeText={(title) => set({ title })}
        maxLength={20}
      />
      <Section label="사진">
        <Pressable onPress={() => setPicking(true)} style={styles.photoRow}>
          {photo ? <Image source={{ uri: photo.uri }} style={styles.thumb} /> : <View style={[styles.thumb, styles.thumbEmpty]} />}
          <Text style={styles.photoLabel}>대표 사진</Text>
          <Text style={styles.photoAction}>바꾸기 ›</Text>
        </Pressable>
        <Help>대표 사진을 바꾸면 ⚙ 전체 설정의 대표 사진도 같이 바뀌어요.</Help>
      </Section>
      <View style={styles.field}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>감사 문구</Text>
          {simple.message !== undefined ? (
            <Pressable onPress={() => set({ message: undefined })} hitSlop={8}>
              <Text style={styles.reset}>기본 문구로</Text>
            </Pressable>
          ) : null}
        </View>
        <TextField value={message} onChangeText={(m) => set({ message: m })} multiline maxLength={300} style={styles.multiline} />
      </View>
      <ToggleList items={[{ key: 'sender', label: '보내는 사람', value: simple.showSender, onChange: (showSender) => set({ showSender }) }]} />
      {simple.showSender ? (
        <LabeledInput
          label="보내는 사람"
          value={simple.sender ?? defaultThanksSender(project)}
          onChangeText={(sender) => set({ sender })}
          placeholder="예: 신랑 민석 · 신부 지원 드림"
          maxLength={40}
        />
      ) : null}
    </EditorSheet>
  );
}

const styles = StyleSheet.create({
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[5],
    backgroundColor: color.bg.surface,
    borderWidth: 1,
    borderColor: color.line.default,
    borderRadius: radius.input,
    paddingHorizontal: space[5],
    paddingVertical: space[4],
  },
  thumb: {
    width: 40,
    height: 40,
    borderRadius: 6,
  },
  thumbEmpty: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: color.line.dashed,
  },
  photoLabel: {
    flex: 1,
    ...textStyle({ size: 'label', weight: 'regular', color: color.ink.primary }),
  },
  photoAction: {
    ...textStyle({ size: 'small', weight: 'medium', color: color.ink.muted }),
  },
  field: {
    gap: space[3],
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    ...textStyle({ size: 'label', weight: 'medium', color: color.ink.label }),
  },
  reset: {
    ...textStyle({ size: 'small', weight: 'semibold', color: color.accent.base }),
  },
  multiline: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
});
