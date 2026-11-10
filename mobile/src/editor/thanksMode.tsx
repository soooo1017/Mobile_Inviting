import { useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { color } from '../theme/tokens';
import { textStyle } from '../theme/typography';
import { DEFAULT_THANKS_PAGE, useInvitation } from '../state/InvitationsContext';
import type { Project } from '../types/project';

/**
 * 감사페이지 간단하게 ↔ 자유롭게 — shared by the editor's thanks tab and 프로젝트 설정.
 * 간단하게 → 자유롭게 starts from an empty page (like a brand-new invitation) — nothing is carried over;
 * 자유롭게 → 간단하게 starts over, after a confirm when there is something to lose.
 */
export function useThanksMode(project: Project) {
  const { invitation, updateThanks, setPage } = useInvitation(project.id);
  const [confirming, setConfirming] = useState(false);
  const thanks = invitation?.thanks ?? DEFAULT_THANKS_PAGE;

  const switchTo = (next: 'simple' | 'free') => {
    if (!invitation || next === thanks.mode) return;
    if (next === 'free') {
      setPage('thanks', []);
      updateThanks((t) => ({ ...t, mode: 'free' }));
    } else if (invitation.pages.thanks.length) {
      setConfirming(true);
    } else {
      updateThanks((t) => ({ ...t, mode: 'simple' }));
    }
  };

  const dialog = (
    <ConfirmDialog
      visible={confirming}
      title="간단하게로 바꿀까요?"
      confirmLabel="바꾸기"
      onCancel={() => setConfirming(false)}
      onConfirm={() => {
        setConfirming(false);
        setPage('thanks', []);
        updateThanks((t) => ({ ...t, mode: 'simple' }));
      }}
    >
      <Text style={styles.body}>{'자유롭게 만든 감사페이지 내용이 지워지고,\n기본 틀로 다시 시작해요.'}</Text>
    </ConfirmDialog>
  );

  return { mode: thanks.mode, switchTo, dialog };
}

const styles = StyleSheet.create({
  body: {
    ...textStyle({ size: 'label', weight: 'regular', color: color.ink.secondary }),
    lineHeight: 21,
  },
});
