import { ScrollView, StyleSheet } from 'react-native';
import { SelectChip } from './SelectChip';
import { space } from '../theme/tokens';

const DOMAINS = ['naver.com', 'gmail.com', 'daum.net', 'hanmail.net', 'kakao.com', 'nate.com', 'icloud.com'];

function splitEmail(email: string) {
  const at = email.indexOf('@');
  return at === -1 ? { local: email, domain: null } : { local: email.slice(0, at), domain: email.slice(at + 1) };
}

function suggestionsFor(email: string): string[] {
  const { local, domain } = splitEmail(email);
  if (!local || /\s/.test(local)) return [];
  if (domain === null) return DOMAINS;
  const typed = domain.toLowerCase();
  return DOMAINS.filter((d) => d.startsWith(typed) && d !== typed);
}

type Props = {
  email: string;
  onSelect: (email: string) => void;
};

export function EmailDomainChips({ email, onSelect }: Props) {
  const suggestions = suggestionsFor(email);
  if (suggestions.length === 0) return null;
  const { local } = splitEmail(email);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      style={styles.scroll}
      contentContainerStyle={styles.row}
    >
      {suggestions.map((d) => (
        <SelectChip key={d} label={`@${d}`} selected={false} onPress={() => onSelect(`${local}@${d}`)} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    marginTop: space[4],
  },
  row: {
    gap: space[3],
  },
});
