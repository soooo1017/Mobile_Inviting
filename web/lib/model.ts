/**
 * 서버에서 받은 초대장 내용의 모양 — 앱의 mobile/src/editor/types.ts 에서 하객 화면에 필요한 것만 옮겨 왔어요.
 * 앱에서 항목이 늘거나 바뀌면 여기도 같이 고쳐요(docs/WEB_VERCEL.md).
 */

export type FontId = 'pretendard' | 'notoSansKr' | 'gowunDodum' | 'nanumMyeongjo' | 'notoSerifKr' | 'nanumPen' | 'hiMelody' | 'gaegu' | 'cormorant';
export type TextFormat = 'h1' | 'h2' | 'h3' | 'b1' | 'b2';
export type Align = 'left' | 'center' | 'right';
export type GapSize = 's' | 'm' | 'l';

export type Photo = { id: string; uri: string; width: number; height: number };
export type Crop = { x: number; y: number; scale: number };
export type ImageRatio = 'original' | '1:1' | '4:5' | '3:4' | '16:9';

export type Contact = { id: string; role: string; name: string; phone: string };
export type EmailEntry = { id: string; role: string; name: string; email: string };
export type Account = { id: string; role: string; holder: string; bank: string; number: string; kakaoPay?: string };

type BlockOf<T extends string, P> = { id: string; type: T; props: P; style?: { font?: FontId; align?: Align } };

export type Block =
  | BlockOf<'text', { format: TextFormat; content: string }>
  | BlockOf<'image', { photo?: Photo; ratio: ImageRatio; crop: Crop }>
  | BlockOf<'gallery', { photos: Photo[]; layout: 'single' | 'grid' | 'slide'; zoomOnTap: boolean }>
  | BlockOf<'divider', { shape: 'line' | 'dashed' | 'dots' | 'heart'; length: 'short' | 'long' }>
  | BlockOf<'spacer', { height: GapSize }>
  | BlockOf<'button', { label: string; url: string; shape: 'fill' | 'outline'; width: 'full' | 'hug' }>
  | BlockOf<
      'phone',
      { view: 'list' | 'button'; title?: string; buttonLabel: string; contacts: Contact[]; showCall: boolean; showSms: boolean; showNumber: boolean; lines: boolean; gapBelow: GapSize }
    >
  | BlockOf<
      'email',
      { view: 'list' | 'button'; title?: string; buttonLabel: string; entries: EmailEntry[]; showMail: boolean; showCopy: boolean; lines: boolean; gapBelow: GapSize }
    >
  | BlockOf<'map', { showCopy: boolean; showNaver: boolean; showKakao: boolean; naverUrl: string; kakaoUrl: string; shape: 'fill' | 'outline' }>
  | BlockOf<
      'datetime',
      { showWhen: boolean; showDday: boolean; showCalendar: boolean; showCalendarButton: boolean; buttonTone: 'default' | 'inverse'; circleColor: 'red' | 'theme' }
    >
  | BlockOf<
      'rsvp',
      {
        intro: string;
        buttonLabel: string;
        fields: { side: boolean; companions: boolean; meal: boolean; phone: boolean; message: boolean };
        deadline?: string;
        autoOpen: boolean;
      }
    >
  | BlockOf<'guestbook', { intro: string; visibility: 'public' | 'private'; recentCount: 3 | 5 | 10; buttonLabel: string; askSide?: boolean }>
  | BlockOf<'account', { title: string; view: 'folded' | 'open'; accounts: Account[]; showCopy: boolean; showKakaoPay: boolean; lines: boolean; gapBelow: GapSize }>;

export type BlockOfType<T extends Block['type']> = Extract<Block, { type: T }>;

export type Bgm = {
  mode: 'off' | 'list' | 'file';
  trackId?: string;
  file?: { uri: string; name: string; size: number; duration?: number };
  start?: number;
  end?: number;
  speed?: number;
};

export type ThanksSimple = { title?: string; message?: string; showSender: boolean; sender?: string };

/** 서버의 invitations.content — 앱의 Invitation에서 projectId를 뺀 것. */
export type InvitationContent = {
  font: FontId;
  pages: { invite: Block[]; popup: Block[]; thanks: Block[] };
  coverPhotoId?: string;
  bgm?: Bgm;
  thanks?: { mode: 'simple' | 'free'; simple: ThanksSimple };
  popup?: { enabled: boolean; startDays?: number | null };
};

/** 서버의 invitations.thanks — 감사페이지를 쓸지, 행사 다음 날부터 며칠 보여줄지. */
export type ThanksSettings = { enabled: boolean; days?: number; hasContent: boolean };

export type TextColorChoice = 'black' | 'gray' | 'accent' | `#${string}`;
export type ThemeColors = { bg: string; accent: string; text: TextColorChoice };

export type PublicMeta = {
  colors?: ThemeColors | null;
  themeId?: string | null;
  venue?: { name: string; address: string; sido?: string; mapLinks?: { naver: boolean; kakao: boolean } } | null;
  hosts?: { label: string; name: string }[] | null;
};

export const FORMAT_SIZE: Record<TextFormat, number> = { h1: 30, h2: 22, h3: 18, b1: 16, b2: 13.5 };
export const GAP_HEIGHT: Record<GapSize, number> = { s: 12, m: 28, l: 48 };
export const SPACER_HEIGHT: Record<GapSize, number> = { s: 24, m: 48, l: 80 };
export const DEFAULT_POPUP_START_DAYS = 7;
export const GUESTBOOK_LENGTH = 200;
export const RSVP_MESSAGE_LENGTH = 500;
