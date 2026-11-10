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
  /** 목록 방식에서 연락처 위에 보이는 제목 (예: 연락주세요~). 비우면 안 보여요. */
  title?: string;
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
  /** 목록 방식에서 이메일 위에 보이는 제목 (예: 문의하기). 비우면 안 보여요. */
  title?: string;
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
export type PopupSettings = {
  enabled: boolean;
  /** 행사 며칠 전부터 뜰지 (0 = 행사 당일부터). null이면 공유하면 바로 뜨고, 아직 안 정했으면(없음) 기본값을 써요. */
  startDays?: number | null;
};
/** 새 안내 팝업의 기본 시작: 행사 7일 전부터. */
export const DEFAULT_POPUP_START_DAYS = 7;
/** 저장된 값에서 실제 시작 일수 (없으면 기본 7일 전). */
export function popupStartDays(popup: PopupSettings | undefined): number | null {
  if (!popup || popup.startDays === undefined) return DEFAULT_POPUP_START_DAYS;
  return popup.startDays;
}
/** 안내 팝업 시작 선택지 — null은 공유하면 바로. */
export const POPUP_START_OPTIONS: { value: number | null; label: string }[] = [
  { value: null, label: '공유하면 바로' },
  { value: 14, label: '14일 전부터' },
  { value: 7, label: '7일 전부터' },
  { value: 3, label: '3일 전부터' },
  { value: 1, label: '1일 전부터' },
  { value: 0, label: '당일부터' },
];

/** 배경음악 — one per invitation. Both choices are kept so switching tabs doesn't lose the file. */
export type BgmFile = { uri: string; name: string; size: number; /** 초 — 노래 편집에서 불러온 뒤 알게 돼요. */ duration?: number };
/**
 * 배경음악. start · end(초) = 노래 편집에서 정한 재생 구간(없으면 처음부터 끝까지), speed = 재생 속도(없으면 1×).
 * uploadAgreed = 내 음악의 저작권 책임 안내에 확인했어요.
 */
export type Bgm = { mode: 'off' | 'list' | 'file'; trackId?: string; file?: BgmFile; start?: number; end?: number; speed?: number; uploadAgreed?: boolean };

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
 * 내용 영역(330 × 444)은 넘치면 팝업 안에서 스크롤돼요.
 */
export const POPUP_SIZE = { width: 330, height: 500, bar: 56 } as const;
/** 안내 팝업에 넣을 수 있는 것 — 짧게 읽히는 것만. */
export const POPUP_BLOCK_TYPES: BlockType[] = ['text', 'image', 'divider', 'spacer', 'button'];

export const LIMITS = {
  /** 갤러리 하나에 넣을 수 있는 사진. */
  galleryPhotos: 15,
  /** 초대장에 넣을 수 있는 갤러리 개수 (안내 팝업 · 감사페이지에는 갤러리를 못 넣어요). */
  galleryBlocks: 3,
  /** 초대장에 넣을 수 있는 이미지(사진 1장짜리) 개수. */
  imageBlocks: 5,
  /** 안내 팝업 · 감사페이지(자유)에 넣을 수 있는 이미지 개수 — 초대장 대표 사진을 쓰거나 다른 사진 1장. */
  pageImages: 1,
  contacts: 4,
  emails: 4,
  accounts: 4,
  roleLength: 7,
  guestbookLength: 200,
} as const;

/**
 * 초대장 하나에 올라가는 사진은 최대 52장이에요: 갤러리 3개 × 15장(45) + 이미지 5개 + 안내 팝업 1 + 감사페이지 1.
 * (대표 사진은 초대장 사진 중 하나를 고르는 거라 따로 늘지 않아요. 서버 용량을 아끼려는 제한 — docs/SERVER_STORAGE.md §13.)
 */
export const MAX_PHOTOS_PER_INVITATION = LIMITS.galleryBlocks * LIMITS.galleryPhotos + LIMITS.imageBlocks + LIMITS.pageImages * 2;

/** 이 페이지에 이 종류를 더 넣을 수 없으면 이유(안내 문구), 넣을 수 있으면 null. */
export function blockAddLimit(type: BlockType, page: PageKey, blocks: Block[]): string | null {
  const count = blocks.filter((b) => b.type === type).length;
  if (type === 'gallery') {
    if (page !== 'invite') return '갤러리는 초대장에만 넣을 수 있어요';
    if (count >= LIMITS.galleryBlocks) return `갤러리는 최대 ${LIMITS.galleryBlocks}개까지 넣을 수 있어요`;
  }
  if (type === 'image') {
    if (page === 'invite' && count >= LIMITS.imageBlocks) return `이미지는 최대 ${LIMITS.imageBlocks}개까지 넣을 수 있어요`;
    if (page === 'popup' && count >= LIMITS.pageImages) return '안내 팝업에는 이미지를 1개만 넣을 수 있어요';
    if (page === 'thanks' && count >= LIMITS.pageImages) return '감사페이지에는 이미지를 1개만 넣을 수 있어요';
  }
  return null;
}

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

/** 감사페이지(자유)에 넣을 수 있는 종류 — 갤러리만 빼요. */
export const THANKS_BLOCK_TYPES: BlockType[] = (Object.keys(BLOCK_LABEL) as BlockType[]).filter((t) => t !== 'gallery');

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
