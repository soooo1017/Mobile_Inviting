import { useState, type ReactNode } from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import { useCanvas } from './CanvasContext';
import { InvText, InvUiText } from './InvText';
import type { FontId } from '../types';

export type Row = {
  key: string;
  role: string;
  name: string;
  /** Shown under the name, starting at the same line as the name (번호 · 메일 주소 · 계좌번호). */
  detail?: string;
  actions?: ReactNode;
};

type Props = {
  rows: Row[];
  font?: FontId;
  /** Lines between rows (never above the first row). */
  lines: boolean;
  /** Also draw a line under the last row. */
  closingLine?: boolean;
};

/**
 * Rows of 호칭 · 이름 where every name starts on the same vertical line: the
 * 호칭 column is as wide as the longest 호칭 in this block (max 7 characters).
 */
export function RowList({ rows, font, lines, closingLine = true }: Props) {
  const { theme } = useCanvas();
  const roleKey = rows.map((r) => r.role).join('|');
  // Widest 호칭 measured for the current set of 호칭 — a changed set starts measuring from zero again.
  const [measured, setMeasured] = useState({ key: roleKey, width: 0 });
  const roleWidth = measured.key === roleKey ? measured.width : 0;

  return (
    <View>
      {rows.map((row, i) => {
        const isLast = i === rows.length - 1;
        const showLine = lines && (!isLast || closingLine);
        return (
          <View
            key={row.key}
            style={[styles.row, showLine && { borderBottomWidth: StyleSheet.hairlineWidth * 2, borderBottomColor: theme.rule }]}
          >
            <View style={[styles.roleCell, roleWidth ? { width: roleWidth } : null]}>
              <InvUiText
                size={11.5}
                soft
                numberOfLines={1}
                onLayout={(e) => {
                  const w = Math.ceil(e.nativeEvent.layout.width);
                  setMeasured((prev) =>
                    prev.key !== roleKey ? { key: roleKey, width: w } : w > prev.width ? { key: roleKey, width: w } : prev,
                  );
                }}
                style={styles.roleText}
              >
                {row.role}
              </InvUiText>
            </View>
            <View style={styles.main}>
              <InvText font={font} size={15} bold leading={1.4} numberOfLines={1}>
                {row.name}
              </InvText>
              {row.detail ? (
                <InvUiText size={12.5} soft numberOfLines={1} style={styles.detail}>
                  {row.detail}
                </InvUiText>
              ) : null}
            </View>
            {row.actions ? <View style={styles.actions}>{row.actions}</View> : null}
          </View>
        );
      })}
    </View>
  );
}

export function CircleAction({ onPress, children, label }: { onPress?: () => void; children: ReactNode; label: string }) {
  const { theme } = useCanvas();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityLabel={label}
      hitSlop={6}
      style={[styles.circle, { borderColor: theme.ink }]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  roleCell: {
    alignSelf: 'flex-start',
    paddingTop: 3,
  },
  roleText: {
    alignSelf: 'flex-start',
  },
  main: {
    flex: 1,
    minWidth: 0,
  },
  detail: {
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  circle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
