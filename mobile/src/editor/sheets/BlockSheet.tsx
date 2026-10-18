import type { Project, Venue } from '../../types/project';
import { MapSheet } from './MapSheet';
import type { Block, BlockOfType, BlockType, FontId } from '../types';
import { ButtonSheet, DividerSheet, ImageSheet, SpacerSheet, TextSheet } from './BasicSheets';
import { AccountSheet, EmailSheet, PhoneSheet } from './ContactSheets';
import { DateTimeSheet, GuestbookSheet, RsvpEditor } from './FeatureSheets';
import { GalleryEditor } from './GalleryEditor';

type Props = {
  block: Block;
  project: Project;
  defaultFont: FontId;
  onChange: (b: Block) => void;
  onDone: () => void;
  onOpenSettings: () => void;
  /** 장소 edits the project's 행사 장소. */
  onProject: (patch: { venue: Venue }) => void;
};

/** Opens the right editor for a block: a sheet, or full screen for 갤러리 / 참석 응답. */
export function BlockSheet({ block, project, defaultFont, onChange, onDone, onOpenSettings, onProject }: Props) {
  const base = { project, defaultFont, onDone };
  const props = <T extends BlockType>(b: BlockOfType<T>) => ({ ...base, block: b, onChange: (next: BlockOfType<T>) => onChange(next) });
  switch (block.type) {
    case 'text':
      return <TextSheet {...props(block)} />;
    case 'image':
      return <ImageSheet {...props(block)} />;
    case 'gallery':
      return <GalleryEditor {...props(block)} />;
    case 'divider':
      return <DividerSheet {...props(block)} />;
    case 'spacer':
      return <SpacerSheet {...props(block)} />;
    case 'button':
      return <ButtonSheet {...props(block)} />;
    case 'phone':
      return <PhoneSheet {...props(block)} />;
    case 'email':
      return <EmailSheet {...props(block)} />;
    case 'map':
      return <MapSheet {...props(block)} onProject={onProject} />;
    case 'datetime':
      return <DateTimeSheet {...props(block)} onOpenSettings={onOpenSettings} />;
    case 'rsvp':
      return <RsvpEditor {...props(block)} />;
    case 'guestbook':
      return <GuestbookSheet {...props(block)} />;
    case 'account':
      return <AccountSheet {...props(block)} />;
  }
}

/** Blocks whose editor covers the whole screen instead of sliding up under the block. */
export function isFullScreenEditor(type: BlockType) {
  return type === 'gallery' || type === 'rsvp';
}
