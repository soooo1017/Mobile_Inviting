import { useState } from 'react';
import { Modal, Pressable, Text, View, StyleSheet } from 'react-native';
import { Checkbox } from '../../components/Checkbox';
import { PrimaryButton } from '../../components/PrimaryButton';
import { color, radius, space } from '../../theme/tokens';
import { textStyle } from '../../theme/typography';
import type { Project } from '../../types/project';

type ImageFormat = 'image' | 'pdf';
type DataFormat = 'xlsx' | 'csv';

type Items = {
  invitation: boolean;
  thanks: boolean;
  rsvp: boolean;
  guestbook: boolean;
};

const DEFAULT_ITEMS: Items = { invitation: true, thanks: false, rsvp: true, guestbook: true };

type Props = {
  visible: boolean;
  project: Project | null;
  onClose: () => void;
  onDownloaded: () => void;
};

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

function formatISODate(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function DownloadSheet({ visible, project, onClose, onDownloaded }: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [items, setItems] = useState<Items>(DEFAULT_ITEMS);
  const [imageFormat, setImageFormat] = useState<ImageFormat>('image');
  const [dataFormat, setDataFormat] = useState<DataFormat>('xlsx');
  const [wasVisible, setWasVisible] = useState(visible);

  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setStep(1);
      setItems(DEFAULT_ITEMS);
      setImageFormat('image');
      setDataFormat('xlsx');
    }
  }

  if (!project) return null;

  const thanksAvailable = project.thanks.enabled;
  const anyChecked = items.invitation || (thanksAvailable && items.thanks) || items.rsvp || items.guestbook;

  const showGroupA = items.invitation || (thanksAvailable && items.thanks);
  const showGroupB = items.rsvp || items.guestbook;
  const groupALabels = [items.invitation && '초대장', thanksAvailable && items.thanks && '감사 페이지'].filter(Boolean) as string[];
  const groupBLabels = [items.rsvp && 'RSVP 응답', items.guestbook && '방명록'].filter(Boolean) as string[];

  const imageExt = imageFormat === 'image' ? 'png' : 'pdf';
  const dataExt = dataFormat === 'xlsx' ? 'xlsx' : 'csv';
  const fileParts: string[] = [];
  if (items.invitation) fileParts.push(`초대장.${imageExt}`);
  if (thanksAvailable && items.thanks) fileParts.push(`감사 페이지.${imageExt}`);
  if (items.rsvp) fileParts.push(`RSVP 응답.${dataExt}`);
  if (items.guestbook) fileParts.push(`방명록.${dataExt}`);

  const zipName = `${project.title.replace(/\s*·\s*/g, '·')}_${formatISODate(new Date())}.zip`;

  const toggle = (key: keyof Items) => setItems((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleDownload = () => {
    onDownloaded();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.grabber} />
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {step === 2 ? (
              <Pressable onPress={() => setStep(1)} hitSlop={10} style={styles.back}>
                <Text style={styles.backMark}>←</Text>
              </Pressable>
            ) : null}
            <Text style={styles.title}>{step === 1 ? '데이터 내려받기' : '파일 형식'}</Text>
            <Text style={styles.stepLabel}>{step} / 2</Text>
          </View>
          <Pressable onPress={onClose} hitSlop={10}>
            <Text style={styles.close}>✕</Text>
          </Pressable>
        </View>

        {step === 1 ? (
          <View style={styles.body}>
            <Text style={styles.sectionTitle}>내려받을 항목</Text>
            <View style={styles.itemList}>
              <ItemRow
                label="초대장"
                desc="공유한 초대장 화면 전체"
                checked={items.invitation}
                onPress={() => toggle('invitation')}
                first
              />
              {thanksAvailable ? (
                <ItemRow
                  label="감사 페이지"
                  desc="설정한 감사 페이지 화면"
                  checked={items.thanks}
                  onPress={() => toggle('thanks')}
                />
              ) : null}
              <ItemRow
                label="RSVP 응답"
                desc={`${project.counts.rsvp}건 · 이름, 참석 여부, 인원, 식사, 메시지`}
                checked={items.rsvp}
                onPress={() => toggle('rsvp')}
              />
              <ItemRow
                label="방명록"
                desc={`${project.counts.guestbook}건 · 이름, 내용, 작성일`}
                checked={items.guestbook}
                onPress={() => toggle('guestbook')}
              />
            </View>
            <PrimaryButton label="다음" disabled={!anyChecked} onPress={() => setStep(2)} />
          </View>
        ) : (
          <View style={styles.body}>
            {showGroupA ? (
              <FormatGroup
                title="초대장 · 감사 페이지"
                selectedLabel={groupALabels.join(', ')}
                options={[
                  { key: 'image', label: '이미지 (.png)' },
                  { key: 'pdf', label: 'PDF (.pdf)' },
                ]}
                value={imageFormat}
                onChange={(v) => setImageFormat(v as ImageFormat)}
              />
            ) : null}
            {showGroupB ? (
              <FormatGroup
                title="RSVP 응답 · 방명록"
                selectedLabel={groupBLabels.join(', ')}
                options={[
                  { key: 'xlsx', label: '엑셀 (.xlsx)' },
                  { key: 'csv', label: 'CSV (.csv)' },
                ]}
                value={dataFormat}
                onChange={(v) => setDataFormat(v as DataFormat)}
              />
            ) : null}

            <View style={styles.preview}>
              <Text style={styles.previewName}>{zipName}</Text>
              <Text style={styles.previewFiles}>{fileParts.join(' · ')}</Text>
            </View>

            <PrimaryButton label="다운로드" onPress={handleDownload} />
          </View>
        )}
      </View>
    </Modal>
  );
}

function ItemRow({
  label,
  desc,
  checked,
  onPress,
  first,
}: {
  label: string;
  desc: string;
  checked: boolean;
  onPress: () => void;
  first?: boolean;
}) {
  return (
    <Pressable style={[styles.itemRow, !first && styles.itemRowDivider]} onPress={onPress}>
      <View style={styles.itemText}>
        <Text style={styles.itemLabel}>{label}</Text>
        <Text style={styles.itemDesc}>{desc}</Text>
      </View>
      <Checkbox checked={checked} onPress={onPress} />
    </Pressable>
  );
}

function FormatGroup({
  title,
  selectedLabel,
  options,
  value,
  onChange,
}: {
  title: string;
  selectedLabel: string;
  options: { key: string; label: string }[];
  value: string;
  onChange: (key: string) => void;
}) {
  return (
    <View style={styles.group}>
      <View style={styles.groupHeader}>
        <Text style={styles.groupTitle}>{title}</Text>
        <Text style={styles.groupSelected}>{selectedLabel}</Text>
      </View>
      <View style={styles.formatRow}>
        {options.map((opt) => {
          const selected = opt.key === value;
          return (
            <Pressable
              key={opt.key}
              style={[styles.formatCell, selected && styles.formatCellSelected]}
              onPress={() => onChange(opt.key)}
            >
              <Text style={[styles.formatLabel, selected && styles.formatLabelSelected]}>{opt.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: color.overlay.sheet,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: color.bg.sheet,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingBottom: space[9],
  },
  grabber: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: color.line.chip,
    marginTop: space[3],
    marginBottom: space[5],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.screenX,
    marginBottom: space[7],
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[4],
  },
  back: {
    marginRight: space[1],
  },
  backMark: {
    ...textStyle({ size: 'title2', weight: 'regular', color: color.ink.primary }),
  },
  title: {
    ...textStyle({ size: 'sheetTitle', weight: 'semibold', color: color.ink.primary }),
  },
  stepLabel: {
    ...textStyle({ size: 'small', weight: 'medium', color: color.ink.muted }),
  },
  close: {
    ...textStyle({ size: 'title2', weight: 'regular', color: color.ink.secondary }),
  },
  body: {
    paddingHorizontal: space.screenX,
    gap: space[7],
  },
  sectionTitle: {
    ...textStyle({ size: 'control', weight: 'semibold', color: color.ink.primary }),
  },
  itemList: {
    marginTop: -space[3],
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    gap: space[6],
  },
  itemRowDivider: {
    borderTopWidth: 1,
    borderTopColor: color.line.soft,
  },
  itemText: {
    flex: 1,
    gap: space[1],
  },
  itemLabel: {
    ...textStyle({ size: 'control', weight: 'semibold', color: color.ink.primary }),
  },
  itemDesc: {
    ...textStyle({ size: 'label', weight: 'regular', color: color.ink.muted }),
  },
  group: {
    gap: space[3],
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  groupTitle: {
    ...textStyle({ size: 'control', weight: 'semibold', color: color.ink.primary }),
  },
  groupSelected: {
    ...textStyle({ size: 'label', weight: 'medium', color: color.ink.muted }),
  },
  formatRow: {
    flexDirection: 'row',
    gap: space[3],
  },
  formatCell: {
    flex: 1,
    borderWidth: 1,
    borderColor: color.line.chip,
    backgroundColor: color.bg.surface,
    borderRadius: radius.button,
    paddingVertical: space[6],
    alignItems: 'center',
    justifyContent: 'center',
  },
  formatCellSelected: {
    backgroundColor: color.select.fill,
    borderColor: color.select.fill,
  },
  formatLabel: {
    ...textStyle({ size: 'control', weight: 'semibold', color: color.ink.primary }),
  },
  formatLabelSelected: {
    color: color.select.on,
  },
  preview: {
    backgroundColor: color.bg.surface,
    borderWidth: 1,
    borderColor: color.line.default,
    borderRadius: radius.input,
    padding: space[6],
    gap: space[2],
  },
  previewName: {
    ...textStyle({ size: 'control', weight: 'semibold', color: color.ink.primary }),
  },
  previewFiles: {
    ...textStyle({ size: 'label', weight: 'regular', color: color.ink.muted }),
  },
});
