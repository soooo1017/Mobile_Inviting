// Block editor data model (docs/EDITOR_PLAN.md §3, §8).
// Every block is one entry in a page's vertical list; props differ per type.

export type FontId =
  | 'pretendard'
  | 'notoSansKr'
  | 'gowunDodum'
  | 'nanumMyeongjo'
  | 'notoSerifKr'
  | 'nanumPen'
  | 'hiMelody'
  | 'gaegu'
  | 'cormorant';

export type TextFormat = 'h1' | 'h2' | 'h3' | 'b1' | 'b2';
export type Align = 'left' | 'center' | 'right';
export type GapSize = 's' | 'm' | 'l';
export type ContactView = 'list' | 'button';

export type TextProps = { format: TextFormat; content: string };

export type ImageRatio = 'original' | '1:1' | '4:5' | '3:4' | '16:9';
export type Photo = { id: string; uri: string; width: number; height: number };
/** Where the photo sits inside its ratio frame: offsets are fractions of the frame, scale >= 1 zooms in. */
export type Crop = { x: number; y: number; scale: number };
export type ImageProps = { photo?: Photo; ratio: ImageRatio; crop: Crop };

export type GalleryLayout = 'single' | 'grid' | 'slide';
export type GalleryProps = { photos: Photo[]; layout: GalleryLayout; zoomOnTap: boolean };

export type DividerShape = 'line' | 'dashed' | 'dots' | 'heart';
export type DividerProps = { shape: DividerShape; length: 'short' | 'long' };

export type SpacerProps = { height: GapSize };

export type ButtonProps = { label: string; url: string; shape: 'fill' | 'outline'; width: 'full' | 'hug' };

export type Contact = { id: string; role: string; name: string; phone: string };
export type PhoneProps = {
  view: ContactView;
  buttonLabel: string;
  contacts: Contact[];
  showCall: boolean;
  showSms: boolean;
  showNumber: boolean;
  lines: boolean;
  gapBelow: GapSize;
};

export type EmailEntry = { id: string; role: string; name: string; email: string };
export type EmailProps = {
  view: ContactView;
  buttonLabel: string;
  entries: EmailEntry[];
  showMail: boolean;
  showCopy: boolean;
  lines: boolean;
  gapBelow: GapSize;
};

export type DateTimeProps = {
  showWhen: boolean;
  showDday: boolean;
  showCalendar: boolean;
  showCalendarButton: boolean;
  buttonTone: 'default' | 'inverse';
  circleColor: 'red' | 'theme';
};

export type RsvpFields = { side: boolean; companions: boolean; meal: boolean; phone: boolean; message: boolean };
export type RsvpProps = {
  intro: string;
  buttonLabel: string;
  fields: RsvpFields;
  /** 'YYYY-MM-DD' — responses close at the end of that day. Empty = no deadline. */
  deadline?: string;
  autoOpen: boolean;
};

export type GuestbookProps = {
  intro: string;
  visibility: 'public' | 'private';
  recentCount: 3 | 5 | 10;
  buttonLabel: string;
  /** 어느 쪽 손님(신랑측 / 신부측)도 고르게 할지 — on by default for weddings. */
  askSide?: boolean;
};

export type Account = { id: string; role: string; holder: string; bank: string; number: string; kakaoPay?: string };
export type AccountProps = {
  title: string;
  view: 'folded' | 'open';
  accounts: Account[];
  showCopy: boolean;
  showKakaoPay: boolean;
  lines: boolean;
  gapBelow: GapSize;
};

/** 장소 — name/address live on the project (행사 정보); the block only holds what to show. */
export type MapProps = {
  showCopy: boolean;
  showNaver: boolean;
  showKakao: boolean;
  /** Place link pasted from the map app; empty = search by address. */
  naverUrl: string;
  kakaoUrl: string;
  shape: 'fill' | 'outline';
};

type BlockOf<T extends string, P> = { id: string; type: T; props: P; style?: { font?: FontId; align?: Align } };

export type Block =
  | BlockOf<'text', TextProps>
  | BlockOf<'image', ImageProps>
  | BlockOf<'gallery', GalleryProps>
  | BlockOf<'divider', DividerProps>
  | BlockOf<'spacer', SpacerProps>
  | BlockOf<'button', ButtonProps>
  | BlockOf<'phone', PhoneProps>
  | BlockOf<'email', EmailProps>
  | BlockOf<'map', MapProps>
  | BlockOf<'datetime', DateTimeProps>
  | BlockOf<'rsvp', RsvpProps>
  | BlockOf<'guestbook', GuestbookProps>
  | BlockOf<'account', AccountProps>;

export type BlockType = Block['type'];
export type BlockOfType<T extends BlockType> = Extract<Block, { type: T }>;

/** 초대장 · 안내 팝업 · 감사페이지 — 안내 팝업은 초대장을 열면 먼저 뜨는 작은 페이지예요. */
export type PageKey = 'invite' | 'popup' | 'thanks';

/** 안내 팝업 사용 여부 — 끄더라도 만들어 둔 내용(pages.popup)은 그대로 보관돼요. */
export type PopupSettings = { enabled: boolean };

/** 배경음악 — one per invitation. Both choices are kept so switching tabs doesn't lose the file. */
export type BgmFile = { uri: string; name: string; size: number };
export type Bgm = { mode: 'off' | 'list' | 'file'; trackId?: string; file?: BgmFile };

/** 감사페이지 간단 모드: empty title/message fall back to the event type's default wording. */
export type ThanksSimple = { title?: string; message?: string; showSender: boolean; sender?: string };
export type ThanksPage = { mode: 'simple' | 'free'; simple: ThanksSimple };

export type Invitation = {
  projectId: string;
  /** 기본 글꼴 — one Korean font for every format; blocks can override it. */
  font: FontId;
  pages: Record<PageKey, Block[]>;
  /** 대표 사진 — a photo id from the invite page; missing = the first photo. */
  coverPhotoId?: string;
  bgm?: Bgm;
  thanks?: ThanksPage;
  popup?: PopupSettings;
};

/**
 * 안내 팝업 크기 — 폰 크기와 상관없이 고정이에요 (가장 작은 폰 360pt에서도 양옆이 남는 크기).
 * 내용 영역(300 × 364)은 넘치면 팝업 안에서 스크롤돼요.
 */
export const POPUP_SIZE = { width: 300, height: 420, bar: 56 } as const;
/** 안내 팝업에 넣을 수 있는 것 — 짧게 읽히는 것만. */
export const POPUP_BLOCK_TYPES: BlockType[] = ['text', 'image', 'divider', 'spacer', 'button'];

export const LIMITS = {
  galleryPhotos: 30,
  contacts: 4,
  emails: 4,
  accounts: 4,
  roleLength: 7,
  guestbookLength: 200,
} as const;

export const FORMAT_LABEL: Record<TextFormat, string> = {
  h1: '제목1',
  h2: '제목2',
  h3: '제목3',
  b1: '본문1',
  b2: '본문2',
};

/** Fixed per format (EDITOR_PLAN §4) — users never pick a size. */
export const FORMAT_SIZE: Record<TextFormat, number> = { h1: 30, h2: 22, h3: 18, b1: 16, b2: 13.5 };

export const GAP_HEIGHT: Record<GapSize, number> = { s: 12, m: 28, l: 48 };
export const SPACER_HEIGHT: Record<GapSize, number> = { s: 24, m: 48, l: 80 };
export const GAP_LABEL: Record<GapSize, string> = { s: '작게', m: '보통', l: '크게' };

export const BLOCK_LABEL: Record<BlockType, string> = {
  text: '텍스트',
  image: '이미지',
  gallery: '갤러리',
  divider: '구분선',
  spacer: '여백',
  button: '버튼',
  phone: '전화번호',
  email: '이메일',
  map: '장소',
  datetime: '일시',
  rsvp: '참석 응답',
  guestbook: '방명록',
  account: '계좌번호',
};

let idCounter = 0;
export function newId(prefix = 'b'): string {
  idCounter += 1;
  return `${prefix}${Date.now().toString(36)}${idCounter.toString(36)}`;
}

export function defaultBlock(type: BlockType): Block {
  const id = newId();
  switch (type) {
    case 'text':
      return { id, type, props: { format: 'b1', content: '' } };
    case 'image':
      return { id, type, props: { ratio: '4:5', crop: { x: 0, y: 0, scale: 1 } } };
    case 'gallery':
      return { id, type, props: { photos: [], layout: 'grid', zoomOnTap: true } };
    case 'divider':
      return { id, type, props: { shape: 'line', length: 'short' } };
    case 'spacer':
      return { id, type, props: { height: 'm' } };
    case 'button':
      return { id, type, props: { label: '', url: '', shape: 'fill', width: 'full' } };
    case 'phone':
      return {
        id,
        type,
        props: {
          view: 'list',
          buttonLabel: '연락하기',
          contacts: [],
          showCall: true,
          showSms: true,
          showNumber: false,
          lines: true,
          gapBelow: 'm',
        },
      };
    case 'email':
      return {
        id,
        type,
        props: { view: 'list', buttonLabel: '메일 보내기', entries: [], showMail: true, showCopy: true, lines: true, gapBelow: 'm' },
      };
    case 'map':
      return {
        id,
        type,
        props: { showCopy: true, showNaver: true, showKakao: true, naverUrl: '', kakaoUrl: '', shape: 'outline' },
      };
    case 'datetime':
      return {
        id,
        type,
        props: {
          showWhen: true,
          showDday: true,
          showCalendar: true,
          showCalendarButton: true,
          buttonTone: 'default',
          circleColor: 'red',
        },
      };
    case 'rsvp':
      return {
        id,
        type,
        props: {
          intro: '축하해 주시는 마음으로 참석해 주시는\n모든 분을 정성껏 모시고자 합니다.\n참석 여부를 미리 알려주세요.',
          buttonLabel: '참석 의사 전달하기',
          fields: { side: true, companions: true, meal: true, phone: false, message: false },
          autoOpen: false,
        },
      };
    case 'guestbook':
      return {
        id,
        type,
        props: { intro: '따뜻한 축하의 말씀을 남겨주세요', visibility: 'public', recentCount: 3, buttonLabel: '방명록 남기기' },
      };
    case 'account':
      return {
        id,
        type,
        props: { title: '계좌번호', view: 'folded', accounts: [], showCopy: true, showKakaoPay: true, lines: true, gapBelow: 'm' },
      };
  }
}

/** Deep copy with fresh ids (blocks and their list items), used by 복제. */
export function cloneBlock(block: Block): Block {
  const copy = JSON.parse(JSON.stringify(block)) as Block;
  copy.id = newId();
  if (copy.type === 'phone') copy.props.contacts = copy.props.contacts.map((c) => ({ ...c, id: newId('c') }));
  if (copy.type === 'email') copy.props.entries = copy.props.entries.map((e) => ({ ...e, id: newId('e') }));
  if (copy.type === 'account') copy.props.accounts = copy.props.accounts.map((a) => ({ ...a, id: newId('a') }));
  if (copy.type === 'gallery') copy.props.photos = copy.props.photos.map((p) => ({ ...p, id: newId('p') }));
  return copy;
}
