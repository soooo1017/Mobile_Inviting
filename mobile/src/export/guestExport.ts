import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { guestSides } from '../editor/format';
import type { RsvpFields } from '../editor/types';
import { fetchPosts, fetchRsvps } from '../sync/guestApi';
import type { Project } from '../types/project';
import { guestbookTable, rsvpTable, safeFileName, toCsv, toXlsx, zipFiles, type OutFile } from './guestFiles';

export type DataFormat = 'xlsx' | 'csv';
export type ExportResult = 'ok' | 'offline' | 'error' | 'unavailable';

const MIME: Record<string, { mimeType: string; UTI: string }> = {
  xlsx: { mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', UTI: 'org.openxmlformats.spreadsheetml.sheet' },
  csv: { mimeType: 'text/csv', UTI: 'public.comma-separated-values-text' },
  zip: { mimeType: 'application/zip', UTI: 'public.zip-archive' },
};

const pad = (n: number) => String(n).padStart(2, '0');
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

type Options = {
  project: Pick<Project, 'title' | 'eventType' | 'id'>;
  rsvp: boolean;
  guestbook: boolean;
  format: DataFormat;
  /** 여러 개를 한 묶음(.zip)으로 — 한 가지만 골랐어도 묶고 싶으면 true. 둘 다 고르면 항상 묶어요. */
  zip?: boolean;
  /** 참석 응답에서 켜 둔 칸(없으면 실제로 값이 있는 칸만 넣어요). */
  rsvpFields?: RsvpFields;
};

/**
 * 서버에서 최신 응답 · 방명록을 받아 파일로 만들고, 폰의 공유창으로 보내요(파일 앱에 저장 · 메일 · 메신저 · 드라이브 …).
 * 돌려주는 값은 결과예요 — 'ok'는 공유창을 띄웠다는 뜻이에요(공유창에서 저장하지 않고 닫아도 앱은 알 수 없어요).
 */
export async function exportGuestData(o: Options): Promise<ExportResult> {
  const sides = guestSides(o.project);
  const files: OutFile[] = [];
  const ext = o.format;
  const encode = o.format === 'xlsx' ? toXlsx : toCsv;

  if (o.rsvp) {
    const res = await fetchRsvps(o.project.id);
    if (!res.ok) return res.kind === 'offline' ? 'offline' : 'error';
    files.push({ name: `RSVP 응답.${ext}`, data: encode(rsvpTable(res.data, sides, o.rsvpFields)) });
  }
  if (o.guestbook) {
    const res = await fetchPosts(o.project.id);
    if (!res.ok) return res.kind === 'offline' ? 'offline' : 'error';
    files.push({ name: `방명록.${ext}`, data: encode(guestbookTable(res.data, sides)) });
  }
  if (!files.length) return 'error';

  const base = safeFileName(o.project.title);
  const asZip = files.length > 1 || o.zip;
  const name = asZip ? `${base}_${today()}.zip` : `${base}_${files[0].name.replace(/\.(xlsx|csv)$/, '')}_${today()}.${ext}`;
  const data = asZip ? zipFiles(files) : files[0].data;
  const kind = MIME[asZip ? 'zip' : ext];

  try {
    if (!(await Sharing.isAvailableAsync())) return 'unavailable';
    const file = new File(Paths.cache, name);
    file.create({ overwrite: true });
    file.write(data);
    await Sharing.shareAsync(file.uri, { mimeType: kind.mimeType, UTI: kind.UTI, dialogTitle: name });
    return 'ok';
  } catch {
    return 'error';
  }
}

/** 결과를 사용자에게 보여줄 한 줄. 'ok'는 안내 없이 넘어가요(공유창이 이미 떴어요). */
export function exportMessage(r: ExportResult): string | null {
  if (r === 'ok') return null;
  if (r === 'offline') return '인터넷이 연결되지 않아 내려받지 못했어요';
  if (r === 'unavailable') return '이 기기에서는 파일을 보낼 수 없어요';
  return '내려받지 못했어요. 잠시 뒤에 다시 시도해 주세요';
}
