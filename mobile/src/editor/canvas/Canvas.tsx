import { Pressable, View, StyleSheet } from 'react-native';
import { color } from '../../theme/tokens';
import { useCanvas } from './CanvasContext';
import { ButtonBlockView, DividerBlockView, GalleryBlockView, ImageBlockView, SpacerBlockView, TextBlockView } from './BasicBlocks';
import { AccountBlockView, EmailBlockView, PhoneBlockView } from './ContactBlocks';
import { MapBlockView } from './MapBlock';
import { DateTimeBlockView, GuestbookBlockView, RsvpBlockView } from './FeatureBlocks';
import type { Block } from '../types';

export function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case 'text':
      return <TextBlockView block={block} />;
    case 'image':
      return <ImageBlockView block={block} />;
    case 'gallery':
      return <GalleryBlockView block={block} />;
    case 'divider':
      return <DividerBlockView block={block} />;
    case 'spacer':
      return <SpacerBlockView block={block} />;
    case 'button':
      return <ButtonBlockView block={block} />;
    case 'phone':
      return <PhoneBlockView block={block} />;
    case 'email':
      return <EmailBlockView block={block} />;
    case 'map':
      return <MapBlockView block={block} />;
    case 'datetime':
      return <DateTimeBlockView block={block} />;
    case 'rsvp':
      return <RsvpBlockView block={block} />;
    case 'guestbook':
      return <GuestbookBlockView block={block} />;
    case 'account':
      return <AccountBlockView block={block} />;
  }
}

type Props = {
  blocks: Block[];
  selectedId?: string | null;
  onPressBlock?: (block: Block) => void;
  onLongPressBlock?: (block: Block) => void;
  onBlockLayout?: (id: string, y: number, height: number) => void;
  /** 'popup': tighter margins so the content is 260 wide inside the 300 wide 안내 팝업. */
  variant?: 'page' | 'popup';
};

/** The invitation exactly as it looks (편집은 실제 모습 하나로만). */
export function Canvas({ blocks, selectedId, onPressBlock, onLongPressBlock, onBlockLayout, variant = 'page' }: Props) {
  const { theme, mode } = useCanvas();
  return (
    <View style={[styles.paper, variant === 'popup' && styles.popupPaper, { backgroundColor: theme.paper }]}>
      {blocks.map((block) => {
        const selected = block.id === selectedId;
        const content = <BlockView block={block} />;
        return (
          <View
            key={block.id}
            onLayout={(e) => onBlockLayout?.(block.id, e.nativeEvent.layout.y, e.nativeEvent.layout.height)}
            style={styles.slot}
          >
            {mode === 'edit' ? (
              <Pressable
                onPress={() => onPressBlock?.(block)}
                onLongPress={() => onLongPressBlock?.(block)}
                delayLongPress={350}
                style={[styles.editable, selected && styles.selected]}
              >
                {/* Taps go to the block itself, not to the buttons drawn inside it. */}
                <View pointerEvents="none">{content}</View>
              </Pressable>
            ) : (
              <View style={styles.editable}>{content}</View>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  paper: {
    paddingHorizontal: 18,
    paddingTop: 22,
    paddingBottom: 28,
    flexGrow: 1,
  },
  popupPaper: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 14,
    flexGrow: 0,
  },
  slot: {
    paddingVertical: 3,
  },
  editable: {
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  selected: {
    borderColor: color.accent.base,
    backgroundColor: 'rgba(95,84,134,0.06)',
  },
});
