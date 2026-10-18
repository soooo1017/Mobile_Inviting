import { useState } from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { color, radius, space } from '../../theme/tokens';
import { textStyle } from '../../theme/typography';
import { EmailDomainChips } from '../../components/EmailDomainChips';
import { EditorSheet } from '../EditorSheet';
import { Chips, GapTiles, Help, Section, SelectRow, ToggleList } from '../ui';
import { ItemRows, LabeledInput, RoleField } from './common';
import type { BlockSheetProps } from './BasicSheets';
import { BANKS, formatPhone, roleSuggestions } from '../format';
import { LIMITS, newId, type Account, type Contact, type ContactView, type EmailEntry } from '../types';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function move<T>(list: T[], from: number, to: number): T[] {
  const next = [...list];
  const [m] = next.splice(from, 1);
  next.splice(to, 0, m);
  return next;
}

function upsert<T extends { id: string }>(list: T[], item: T): T[] {
  return list.some((x) => x.id === item.id) ? list.map((x) => (x.id === item.id ? item : x)) : [...list, item];
}

function ViewChips({ value, onChange, buttonLabel }: { value: ContactView; onChange: (v: ContactView) => void; buttonLabel: string }) {
  return (
    <Chips<ContactView>
      options={[
        { value: 'list', label: '목록' },
        { value: 'button', label: buttonLabel },
      ]}
      value={value}
      onChange={onChange}
    />
  );
}

// ───────────────────────── 전화번호 ─────────────────────────

export function PhoneSheet({ block, onChange, onDone, project }: BlockSheetProps<'phone'>) {
  const p = block.props;
  const set = (patch: Partial<typeof p>) => onChange({ ...block, props: { ...p, ...patch } });
  const [editing, setEditing] = useState<Contact | null>(null);
  const suggestions = roleSuggestions(project.eventType, project.hosts.map((h) => h.label));

  if (editing) {
    const isNew = !p.contacts.some((c) => c.id === editing.id);
    const valid = editing.role.trim() && editing.name.trim() && editing.phone.replace(/\D/g, '').length >= 9;
    return (
      <EditorSheet
        title={isNew ? '연락처 추가' : '연락처 수정'}
        onBack={() => setEditing(null)}
        doneLabel="저장"
        maxHeight={0.8}
        onDone={() => {
          if (!valid) return;
          set({ contacts: upsert(p.contacts, { ...editing, role: editing.role.trim(), name: editing.name.trim() }) });
          setEditing(null);
        }}
      >
        <Section label="호칭">
          <RoleField key={editing.id} value={editing.role} onChange={(role) => setEditing({ ...editing, role })} suggestions={suggestions} />
        </Section>
        <LabeledInput label="이름" value={editing.name} onChangeText={(name) => setEditing({ ...editing, name })} placeholder="예: 김영수" maxLength={12} />
        <View style={styles.gapSm}>
          <LabeledInput
            label="전화번호"
            value={editing.phone}
            onChangeText={(v) => setEditing({ ...editing, phone: formatPhone(v) })}
            placeholder="010-0000-0000"
            keyboardType="number-pad"
          />
          <Help>{valid ? '숫자만 입력하면 - 이 자동으로 들어가요' : '호칭 · 이름 · 전화번호를 모두 넣으면 저장할 수 있어요'}</Help>
        </View>
      </EditorSheet>
    );
  }

  return (
    <EditorSheet title="전화번호" onDone={onDone} maxHeight={0.72}>
      <Section label="보기 방식">
        <ViewChips value={p.view} onChange={(view) => set({ view })} buttonLabel="연락하기 버튼" />
      </Section>
      {p.view === 'button' ? (
        <LabeledInput label="버튼 문구" value={p.buttonLabel} onChangeText={(buttonLabel) => set({ buttonLabel })} maxLength={16} />
      ) : null}
      <Section label={`연락처 ${p.contacts.length}/${LIMITS.contacts}`} sub="꾹 눌러 순서 바꾸기">
        <ItemRows
          items={p.contacts}
          title={(c) => `${c.role} · ${c.name}`}
          sub={(c) => c.phone}
          onPress={setEditing}
          onRemove={(c) => set({ contacts: p.contacts.filter((x) => x.id !== c.id) })}
          onReorder={(from, to) => set({ contacts: move(p.contacts, from, to) })}
          onAdd={() => setEditing({ id: newId('c'), role: '', name: '', phone: '' })}
          addLabel="연락처 추가"
          max={LIMITS.contacts}
        />
      </Section>
      <ToggleList
        items={[
          { key: 'call', label: '전화 버튼', value: p.showCall, onChange: (showCall) => set({ showCall }) },
          { key: 'sms', label: '문자 버튼', value: p.showSms, onChange: (showSms) => set({ showSms }) },
          { key: 'num', label: '번호 글자로 보이기', value: p.showNumber, onChange: (showNumber) => set({ showNumber }) },
          { key: 'lines', label: '연락처 사이 선', value: p.lines, onChange: (lines) => set({ lines }) },
        ]}
      />
      <Section label="아래 여백" sub="다음 블록과의 간격">
        <GapTiles value={p.gapBelow} onChange={(gapBelow) => set({ gapBelow })} />
      </Section>
    </EditorSheet>
  );
}

// ───────────────────────── 이메일 ─────────────────────────

export function EmailSheet({ block, onChange, onDone, project }: BlockSheetProps<'email'>) {
  const p = block.props;
  const set = (patch: Partial<typeof p>) => onChange({ ...block, props: { ...p, ...patch } });
  const [editing, setEditing] = useState<EmailEntry | null>(null);
  const suggestions = roleSuggestions(project.eventType, project.hosts.map((h) => h.label));

  if (editing) {
    const isNew = !p.entries.some((e) => e.id === editing.id);
    const emailOk = EMAIL_RE.test(editing.email.trim());
    const valid = editing.role.trim() && editing.name.trim() && emailOk;
    return (
      <EditorSheet
        title={isNew ? '이메일 추가' : '이메일 수정'}
        onBack={() => setEditing(null)}
        doneLabel="저장"
        maxHeight={0.8}
        onDone={() => {
          if (!valid) return;
          set({ entries: upsert(p.entries, { ...editing, role: editing.role.trim(), name: editing.name.trim(), email: editing.email.trim() }) });
          setEditing(null);
        }}
      >
        <Section label="호칭">
          <RoleField key={editing.id} value={editing.role} onChange={(role) => setEditing({ ...editing, role })} suggestions={suggestions} />
        </Section>
        <LabeledInput label="이름" value={editing.name} onChangeText={(name) => setEditing({ ...editing, name })} placeholder="예: 이지원" maxLength={12} />
        <View style={styles.gapSm}>
          <LabeledInput
            label="이메일 주소"
            value={editing.email}
            onChangeText={(email) => setEditing({ ...editing, email })}
            placeholder="name@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            error={editing.email.length > 0 && !emailOk}
          />
          <EmailDomainChips email={editing.email} onSelect={(email) => setEditing({ ...editing, email })} />
          {!valid ? <Help>호칭 · 이름 · 이메일 주소를 모두 넣으면 저장할 수 있어요</Help> : null}
        </View>
      </EditorSheet>
    );
  }

  return (
    <EditorSheet title="이메일" onDone={onDone} maxHeight={0.72}>
      <Section label="보기 방식">
        <ViewChips value={p.view} onChange={(view) => set({ view })} buttonLabel="버튼" />
      </Section>
      {p.view === 'button' ? (
        <View style={styles.gapSm}>
          <LabeledInput label="버튼 문구" value={p.buttonLabel} onChangeText={(buttonLabel) => set({ buttonLabel })} maxLength={16} />
          <Help>주소가 1개면 바로 메일 앱이 열리고, 여러 개면 목록이 올라와요.</Help>
        </View>
      ) : null}
      <Section label={`이메일 ${p.entries.length}/${LIMITS.emails}`} sub="꾹 눌러 순서 바꾸기">
        <ItemRows
          items={p.entries}
          title={(e) => `${e.role} · ${e.name}`}
          sub={(e) => e.email}
          onPress={setEditing}
          onRemove={(e) => set({ entries: p.entries.filter((x) => x.id !== e.id) })}
          onReorder={(from, to) => set({ entries: move(p.entries, from, to) })}
          onAdd={() => setEditing({ id: newId('e'), role: '', name: '', email: '' })}
          addLabel="이메일 추가"
          max={LIMITS.emails}
        />
      </Section>
      <ToggleList
        items={[
          { key: 'mail', label: '메일 버튼', value: p.showMail, onChange: (showMail) => set({ showMail }) },
          { key: 'copy', label: '복사 버튼', value: p.showCopy, onChange: (showCopy) => set({ showCopy }) },
          { key: 'lines', label: '이메일 사이 선', value: p.lines, onChange: (lines) => set({ lines }) },
        ]}
      />
      <Section label="아래 여백" sub="다음 블록과의 간격">
        <GapTiles value={p.gapBelow} onChange={(gapBelow) => set({ gapBelow })} />
      </Section>
    </EditorSheet>
  );
}

// ───────────────────────── 계좌번호 ─────────────────────────

export function AccountSheet({ block, onChange, onDone, project }: BlockSheetProps<'account'>) {
  const p = block.props;
  const set = (patch: Partial<typeof p>) => onChange({ ...block, props: { ...p, ...patch } });
  const [editing, setEditing] = useState<Account | null>(null);
  const [pickingBank, setPickingBank] = useState(false);
  const suggestions = roleSuggestions(project.eventType, project.hosts.map((h) => h.label));

  if (editing && pickingBank) {
    return (
      <EditorSheet title="은행" onBack={() => setPickingBank(false)} onDone={() => setPickingBank(false)} maxHeight={0.8}>
        <View style={styles.bankList}>
          {BANKS.map((b, i) => (
            <Pressable
              key={b}
              onPress={() => {
                setEditing({ ...editing, bank: b });
                setPickingBank(false);
              }}
              style={[styles.bankRow, i > 0 && styles.divider, editing.bank === b && styles.bankOn]}
            >
              <Text style={styles.bankLabel}>{b}</Text>
              {editing.bank === b ? <Text style={styles.check}>✓</Text> : null}
            </Pressable>
          ))}
        </View>
      </EditorSheet>
    );
  }

  if (editing) {
    const isNew = !p.accounts.some((a) => a.id === editing.id);
    const valid = editing.role.trim() && editing.holder.trim() && editing.bank && editing.number.replace(/\D/g, '').length >= 6;
    return (
      <EditorSheet
        title={isNew ? '계좌 추가' : '계좌 수정'}
        onBack={() => setEditing(null)}
        doneLabel="저장"
        maxHeight={0.85}
        onDone={() => {
          if (!valid) return;
          const kakaoPay = editing.kakaoPay?.trim() || undefined;
          set({ accounts: upsert(p.accounts, { ...editing, role: editing.role.trim(), holder: editing.holder.trim(), kakaoPay }) });
          setEditing(null);
        }}
      >
        <Section label="호칭">
          <RoleField key={editing.id} value={editing.role} onChange={(role) => setEditing({ ...editing, role })} suggestions={suggestions} />
        </Section>
        <LabeledInput label="예금주" value={editing.holder} onChangeText={(holder) => setEditing({ ...editing, holder })} placeholder="예: 김민준" maxLength={12} />
        <Section label="은행">
          <SelectRow label={editing.bank || '은행을 골라주세요'} muted={!editing.bank} onPress={() => setPickingBank(true)} />
        </Section>
        <View style={styles.gapSm}>
          <LabeledInput
            label="계좌번호"
            value={editing.number}
            onChangeText={(v) => setEditing({ ...editing, number: v.replace(/[^\d-]/g, '') })}
            placeholder="숫자만 넣으면 돼요"
            keyboardType="number-pad"
          />
          <Help>게스트가 복사하면 숫자만 복사돼요.</Help>
        </View>
        <View style={styles.gapSm}>
          <LabeledInput
            label="카카오페이 송금 링크"
            sub="선택"
            value={editing.kakaoPay ?? ''}
            onChangeText={(kakaoPay) => setEditing({ ...editing, kakaoPay })}
            placeholder="https://qr.kakaopay.com/…"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
          <Help>카카오페이 앱 → 송금 → 송금코드에서 링크를 복사해요</Help>
        </View>
      </EditorSheet>
    );
  }

  return (
    <EditorSheet title="계좌번호" onDone={onDone} maxHeight={0.72}>
      <LabeledInput label="묶음 제목" value={p.title} onChangeText={(title) => set({ title })} placeholder="예: 신랑측 계좌번호" maxLength={20} />
      <Section label="보기 방식">
        <Chips
          options={[
            { value: 'folded', label: '접어두기' },
            { value: 'open', label: '펼쳐두기' },
          ]}
          value={p.view}
          onChange={(view) => set({ view })}
        />
        <Help>접어두면 게스트가 제목을 눌렀을 때만 계좌가 보여요.</Help>
      </Section>
      <Section label={`계좌 ${p.accounts.length}/${LIMITS.accounts}`} sub="꾹 눌러 순서 바꾸기">
        <ItemRows
          items={p.accounts}
          title={(a) => `${a.role} · ${a.holder}`}
          sub={(a) => `${a.bank} ${a.number}${a.kakaoPay ? ' · pay' : ''}`}
          onPress={setEditing}
          onRemove={(a) => set({ accounts: p.accounts.filter((x) => x.id !== a.id) })}
          onReorder={(from, to) => set({ accounts: move(p.accounts, from, to) })}
          onAdd={() => setEditing({ id: newId('a'), role: '', holder: '', bank: '', number: '' })}
          addLabel="계좌 추가"
          max={LIMITS.accounts}
        />
      </Section>
      <ToggleList
        items={[
          { key: 'copy', label: '복사 버튼', value: p.showCopy, onChange: (showCopy) => set({ showCopy }) },
          { key: 'pay', label: '카카오페이 버튼', value: p.showKakaoPay, onChange: (showKakaoPay) => set({ showKakaoPay }) },
          { key: 'lines', label: '계좌 사이 선', value: p.lines, onChange: (lines) => set({ lines }) },
        ]}
      />
      <Section label="아래 여백" sub="다음 블록과의 간격">
        <GapTiles value={p.gapBelow} onChange={(gapBelow) => set({ gapBelow })} />
      </Section>
    </EditorSheet>
  );
}

const styles = StyleSheet.create({
  gapSm: {
    gap: space[3],
  },
  bankList: {
    backgroundColor: color.bg.surface,
    borderWidth: 1,
    borderColor: color.line.default,
    borderRadius: radius.card,
    overflow: 'hidden',
  },
  bankRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: space[6],
    paddingVertical: space[5],
  },
  bankOn: {
    backgroundColor: color.accent.tint,
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: color.line.soft,
  },
  bankLabel: {
    ...textStyle({ size: 'control', weight: 'regular', color: color.ink.primary }),
  },
  check: {
    ...textStyle({ size: 'control', weight: 'semibold', color: color.accent.base }),
  },
});
