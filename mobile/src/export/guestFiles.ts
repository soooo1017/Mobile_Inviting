import { strToU8, zipSync } from 'fflate';
import type { GuestbookPost, RsvpResponse } from '../state/guestData';

/**
 * 참석 응답 · 방명록을 엑셀(.xlsx) / CSV(.csv) 파일 내용으로 만들어요 — 폰에서 바로 만들고(서버 필요 없음), 순수한 함수라 시험하기 쉬워요.
 * 파일로 저장하고 공유창으로 보내는 건 save.ts.
 */

export type Cell = string | number;
export type Table = { sheetName: string; header: string[]; rows: Cell[][]; widths: number[] };

const pad = (n: number) => String(n).padStart(2, '0');

/** "2026-11-10 21:12" (이 폰의 시간) */
export function formatStamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** 표에 넣는 칸 — 어느 칸을 넣을지는 "설정에서 켠 항목이거나, 실제로 값이 있는 칸"이에요(설정을 나중에 꺼도 이미 받은 값은 안 사라져요). */
export function rsvpTable(responses: RsvpResponse[], sides: string[], enabled?: { side?: boolean; companions?: boolean; meal?: boolean; phone?: boolean; message?: boolean }): Table {
  const has = {
    side: sides.length > 0 && (enabled?.side || responses.some((r) => r.side !== undefined)),
    companions: enabled?.companions || responses.some((r) => (r.companions ?? 0) > 0),
    meal: enabled?.meal || responses.some((r) => r.meal !== undefined),
    phone: enabled?.phone || responses.some((r) => r.phone),
    message: enabled?.message || responses.some((r) => r.message),
  };
  const header = ['이름', '참석 여부'];
  const widths = [14, 10];
  if (has.side) {
    header.push('어느 쪽');
    widths.push(10);
  }
  if (has.companions) {
    header.push('동반 인원', '총 인원');
    widths.push(10, 9);
  }
  if (has.meal) {
    header.push('식사');
    widths.push(8);
  }
  if (has.phone) {
    header.push('연락처');
    widths.push(16);
  }
  if (has.message) {
    header.push('전하는 말');
    widths.push(40);
  }
  header.push('응답 일시');
  widths.push(18);

  const ordered = [...responses].sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
  const rows = ordered.map((r) => {
    const row: Cell[] = [r.name, r.attending ? '참석' : '불참'];
    if (has.side) row.push(r.side !== undefined ? (sides[r.side] ?? '') : '');
    if (has.companions) {
      const comp = r.attending ? (r.companions ?? 0) : 0;
      row.push(r.attending ? comp : '', r.attending ? 1 + comp : '');
    }
    if (has.meal) row.push(r.attending ? (r.meal === undefined ? '' : r.meal ? 'O' : 'X') : '');
    if (has.phone) row.push(r.phone ?? '');
    if (has.message) row.push(r.message ?? '');
    row.push(formatStamp(r.at));
    return row;
  });
  return { sheetName: '참석 응답', header, rows, widths };
}

export function guestbookTable(posts: GuestbookPost[], sides: string[]): Table {
  const hasSide = sides.length > 0 && posts.some((p) => p.side !== undefined);
  const header = ['이름'];
  const widths = [14];
  if (hasSide) {
    header.push('어느 쪽');
    widths.push(10);
  }
  header.push('내용', '작성일');
  widths.push(60, 18);
  const ordered = [...posts].sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
  const rows = ordered.map((p) => {
    const row: Cell[] = [p.name];
    if (hasSide) row.push(p.side !== undefined ? (sides[p.side] ?? '') : '');
    row.push(p.text, formatStamp(p.at));
    return row;
  });
  return { sheetName: '방명록', header, rows, widths };
}

// ── CSV ──────────────────────────────────────────────────────────────────────

/**
 * 엑셀에서 열면 `=` `+` `-` `@`로 시작하는 글자를 "수식"으로 실행해요 — 하객이 쓴 글이 수식이 되지 않게 앞에 '를 붙여요.
 * (전화번호의 +82 같은 것도 글자로 보이게 돼요.)
 */
function csvCell(v: Cell): string {
  let s = typeof v === 'number' ? String(v) : v;
  if (typeof v === 'string' && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** UTF-8 + BOM이라 엑셀에서 한글이 깨지지 않아요. */
export function toCsv(table: Table): Uint8Array {
  const lines = [table.header, ...table.rows].map((row) => row.map(csvCell).join(','));
  return strToU8(`﻿${lines.join('\r\n')}\r\n`);
}

// ── XLSX ─────────────────────────────────────────────────────────────────────

const xmlEscape = (s: string) =>
  s
    // XML에서 쓸 수 없는 제어 문자는 빼요(엑셀이 파일을 못 열어요).
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

function colName(i: number): string {
  let n = i + 1;
  let s = '';
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

function sheetXml(table: Table): string {
  const cell = (v: Cell, c: number, r: number, style?: number) => {
    const ref = `${colName(c)}${r + 1}`;
    const s = style ? ` s="${style}"` : '';
    if (typeof v === 'number') return `<c r="${ref}"${s}><v>${v}</v></c>`;
    // 글자는 inlineStr로 — 수식으로 해석되지 않아서 하객이 쓴 글이 그대로 글자로 보여요.
    return v === '' ? `<c r="${ref}"${s}/>` : `<c r="${ref}"${s} t="inlineStr"><is><t xml:space="preserve">${xmlEscape(v)}</t></is></c>`;
  };
  const rows = [table.header, ...table.rows].map((row, r) => `<row r="${r + 1}">${row.map((v, c) => cell(v, c, r, r === 0 ? 1 : 2)).join('')}</row>`).join('');
  const cols = table.widths.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('');
  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>' +
    `<cols>${cols}</cols><sheetData>${rows}</sheetData></worksheet>`
  );
}

/** 표 하나짜리 엑셀 파일. 첫 줄은 굵게 · 고정, 긴 글은 칸 안에서 줄바꿈돼요. */
export function toXlsx(table: Table): Uint8Array {
  const name = xmlEscape(table.sheetName.replace(/[:\\/?*[\]]/g, ' ').slice(0, 31));
  const files: Record<string, Uint8Array> = {
    '[Content_Types].xml': strToU8(
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
        '<Default Extension="xml" ContentType="application/xml"/>' +
        '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
        '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
        '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
        '</Types>',
    ),
    '_rels/.rels': strToU8(
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
        '</Relationships>',
    ),
    'xl/workbook.xml': strToU8(
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
        `<sheets><sheet name="${name}" sheetId="1" r:id="rId1"/></sheets></workbook>`,
    ),
    'xl/_rels/workbook.xml.rels': strToU8(
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>' +
        '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
        '</Relationships>',
    ),
    'xl/styles.xml': strToU8(
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
        '<fonts count="2"><font><sz val="11"/><name val="Malgun Gothic"/></font><font><b/><sz val="11"/><name val="Malgun Gothic"/></font></fonts>' +
        '<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>' +
        '<fill><patternFill patternType="solid"><fgColor rgb="FFEDEAFB"/><bgColor indexed="64"/></patternFill></fill></fills>' +
        '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
        '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
        '<cellXfs count="3">' +
        '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
        '<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>' +
        '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>' +
        '</cellXfs>' +
        '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>',
    ),
    'xl/worksheets/sheet1.xml': strToU8(sheetXml(table)),
  };
  return zipSync(files);
}

// ── 묶음(zip) · 파일 이름 ────────────────────────────────────────────────────

export type OutFile = { name: string; data: Uint8Array };

export function zipFiles(files: OutFile[]): Uint8Array {
  const entries: Record<string, Uint8Array> = {};
  for (const f of files) entries[f.name] = f.data;
  return zipSync(entries);
}

/** 파일 이름에 쓸 수 없는 글자(\ / : * ? " < > |)와 줄바꿈을 빼요. */
export function safeFileName(name: string): string {
  const s = name
    .replace(/\s*·\s*/g, '·')
    .replace(/[\\/:*?"<>|\r\n\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60);
  return s || '초대장';
}
