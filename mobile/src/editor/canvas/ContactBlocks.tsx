import { useState, type ReactNode } from 'react';
import { Linking, Modal, Pressable, View, StyleSheet } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCanvas } from './CanvasContext';
import { InvText, InvUiText } from './InvText';
import { CircleAction, RowList, type Row } from './RowList';
import { InvButton } from './BasicBlocks';
import { CallIcon, CopyIcon, MailIcon, SmsIcon } from '../icons';
import { shortBank } from '../format';
import { GAP_HEIGHT, type BlockOfType } from '../types';

function EmptyHint({ text }: { text: string }) {
  const { theme } = useCanvas();
  return (
    <View style={[styles.emptyHint, { borderColor: theme.rule }]}>
      <InvUiText size={13} soft>
        {text}
      </InvUiText>
    </View>
  );
}

/** The list a guest sees after tapping 연락하기 / 메일 보내기 (button view). */
function GuestListSheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const { theme } = useCanvas();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: theme.paper, paddingBottom: Math.max(insets.bottom, 24) }]}>
        <View style={[styles.grabber, { backgroundColor: theme.rule }]} />
        <View style={styles.sheetHead}>
          <InvText size={18} bold leading={1.3}>
            {title}
          </InvText>
          <Pressable onPress={onClose} hitSlop={10}>
            <InvUiText size={18} soft>
              ✕
            </InvUiText>
          </Pressable>
        </View>
        {children}
      </View>
    </Modal>
  );
}

export function PhoneBlockView({ block }: { block: BlockOfType<'phone'> }) {
  const { mode, theme } = useCanvas();
  const p = block.props;
  const [open, setOpen] = useState(false);
  const live = mode === 'preview';

  const rows: Row[] = p.contacts.map((c) => ({
    key: c.id,
    role: c.role,
    name: c.name,
    detail: p.showNumber ? c.phone : undefined,
    actions: (
      <>
        {p.showCall ? (
          <CircleAction label="전화" onPress={live ? () => Linking.openURL(`tel:${c.phone.replace(/\D/g, '')}`) : undefined}>
            <CallIcon color={theme.ink} />
          </CircleAction>
        ) : null}
        {p.showSms ? (
          <CircleAction label="문자" onPress={live ? () => Linking.openURL(`sms:${c.phone.replace(/\D/g, '')}`) : undefined}>
            <SmsIcon color={theme.ink} />
          </CircleAction>
        ) : null}
      </>
    ),
  }));

  let body;
  if (!rows.length) body = mode === 'edit' ? <EmptyHint text="연락처를 추가해주세요" /> : null;
  else if (p.view === 'button')
    body = <InvButton label={p.buttonLabel || '연락하기'} tone="outline" onPress={live ? () => setOpen(true) : undefined} />;
  else body = <RowList rows={rows} lines={p.lines} font={block.style?.font} />;

  return (
    <View style={{ marginBottom: GAP_HEIGHT[p.gapBelow] }}>
      {body}
      {open ? (
        <GuestListSheet title={p.buttonLabel || '연락하기'} onClose={() => setOpen(false)}>
          <RowList rows={rows} lines={p.lines} font={block.style?.font} />
        </GuestListSheet>
      ) : null}
    </View>
  );
}

export function EmailBlockView({ block }: { block: BlockOfType<'email'> }) {
  const { mode, theme, showToast } = useCanvas();
  const p = block.props;
  const [open, setOpen] = useState(false);
  const live = mode === 'preview';

  const copy = async (email: string) => {
    await Clipboard.setStringAsync(email);
    showToast('메일 주소를 복사했어요');
  };

  const rows: Row[] = p.entries.map((e) => ({
    key: e.id,
    role: e.role,
    name: e.name,
    detail: e.email,
    actions: (
      <>
        {p.showCopy ? (
          <CircleAction label="메일 주소 복사" onPress={live ? () => copy(e.email) : undefined}>
            <CopyIcon color={theme.ink} />
          </CircleAction>
        ) : null}
        {p.showMail ? (
          <CircleAction label="메일 보내기" onPress={live ? () => Linking.openURL(`mailto:${e.email}`) : undefined}>
            <MailIcon color={theme.ink} />
          </CircleAction>
        ) : null}
      </>
    ),
  }));

  const onButton = () => {
    // One address: open the mail app straight away; several: let the guest pick.
    if (p.entries.length === 1) Linking.openURL(`mailto:${p.entries[0].email}`);
    else setOpen(true);
  };

  let body;
  if (!rows.length) body = mode === 'edit' ? <EmptyHint text="이메일을 추가해주세요" /> : null;
  else if (p.view === 'button') body = <InvButton label={p.buttonLabel || '메일 보내기'} tone="outline" onPress={live ? onButton : undefined} />;
  else body = <RowList rows={rows} lines={p.lines} font={block.style?.font} />;

  return (
    <View style={{ marginBottom: GAP_HEIGHT[p.gapBelow] }}>
      {body}
      {open ? (
        <GuestListSheet title={p.buttonLabel || '메일 보내기'} onClose={() => setOpen(false)}>
          <RowList rows={rows} lines={p.lines} font={block.style?.font} />
        </GuestListSheet>
      ) : null}
    </View>
  );
}

export function AccountBlockView({ block }: { block: BlockOfType<'account'> }) {
  const { mode, theme, showToast } = useCanvas();
  const p = block.props;
  const live = mode === 'preview';
  // Guests start from the block's 보기 방식 and can toggle it; the editor always shows the chosen state.
  const [guestOpen, setGuestOpen] = useState(p.view === 'open');
  const open = live ? guestOpen : p.view === 'open';

  const copy = async (number: string) => {
    await Clipboard.setStringAsync(number.replace(/\D/g, ''));
    showToast('계좌번호를 복사했어요');
  };

  const rows: Row[] = p.accounts.map((a) => ({
    key: a.id,
    role: a.role,
    name: a.holder,
    detail: `${shortBank(a.bank)} ${a.number}`,
    actions: (
      <>
        {p.showCopy ? (
          <CircleAction label="계좌번호 복사" onPress={live ? () => copy(a.number) : undefined}>
            <CopyIcon color={theme.ink} />
          </CircleAction>
        ) : null}
        {p.showKakaoPay ? (
          a.kakaoPay ? (
            <Pressable
              onPress={live ? () => Linking.openURL(a.kakaoPay as string) : undefined}
              disabled={!live}
              style={styles.pay}
              accessibilityLabel="카카오페이로 송금"
            >
              <InvUiText size={10} bold style={styles.payText}>
                pay
              </InvUiText>
            </Pressable>
          ) : (
            <View style={styles.payBlank} />
          )
        ) : null}
      </>
    ),
  }));

  return (
    <View style={{ marginBottom: GAP_HEIGHT[p.gapBelow] }}>
      <View style={[styles.acc, { borderColor: theme.rule }]}>
        <Pressable
          style={[styles.accHead, open && rows.length ? { borderBottomWidth: 1, borderBottomColor: theme.rule } : null]}
          onPress={live ? () => setGuestOpen((v) => !v) : undefined}
          disabled={!live}
        >
          <InvText font={block.style?.font} size={15} bold leading={1.4} style={styles.flex}>
            {p.title || '계좌번호'}
          </InvText>
          <InvUiText size={14} soft>
            {open ? '⌃' : '⌄'}
          </InvUiText>
        </Pressable>
        {open ? (
          rows.length ? (
            <RowList rows={rows} lines={p.lines} closingLine={false} font={block.style?.font} />
          ) : mode === 'edit' ? (
            <View style={styles.accEmpty}>
              <InvUiText size={13} soft>
                계좌를 추가해주세요
              </InvUiText>
            </View>
          ) : null
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  emptyHint: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 6,
    paddingVertical: 18,
    alignItems: 'center',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(20,18,24,0.45)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 22,
  },
  grabber: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    marginTop: 8,
    marginBottom: 12,
  },
  sheetHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  acc: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  accHead: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  accEmpty: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  pay: {
    width: 34,
    height: 22,
    borderRadius: 6,
    backgroundColor: '#fee500',
    alignItems: 'center',
    justifyContent: 'center',
  },
  payText: {
    color: '#191600',
  },
  payBlank: {
    width: 34,
  },
});
