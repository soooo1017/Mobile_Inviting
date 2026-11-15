/**
 * 사진(JPEG) 한 장을 PDF 한 쪽으로 감싸요 — 초대장 · 감사 페이지를 스크롤하는 그대로 긴 한 장으로 만들어서 쪽이 중간에 잘리지 않게요.
 * 따로 라이브러리 없이 PDF 파일 구조를 직접 써요(JPEG는 그대로 넣어서 화질 손실 · 용량 증가가 없어요).
 */

/** PDF 쪽 크기는 포인트(1/72 인치) 단위예요. 가로는 A4(595pt), 세로는 사진 비율대로. PDF 뷰어가 다루는 최대치(14400pt)를 넘으면 줄여요. */
const PAGE_W = 595;
const PAGE_MAX = 14400;

const enc = (s: string) => {
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i += 1) out[i] = s.charCodeAt(i) & 0xff;
  return out;
};

export function pageSize(widthPx: number, heightPx: number): { w: number; h: number } {
  let w = PAGE_W;
  let h = (PAGE_W * heightPx) / widthPx;
  if (h > PAGE_MAX) {
    w = (PAGE_MAX * widthPx) / heightPx;
    h = PAGE_MAX;
  }
  return { w: Math.round(w * 100) / 100, h: Math.round(h * 100) / 100 };
}

export function jpegToPdf(jpeg: Uint8Array, widthPx: number, heightPx: number): Uint8Array {
  const { w, h } = pageSize(widthPx, heightPx);
  const content = `q ${w} 0 0 ${h} 0 0 cm /Im0 Do Q`;
  const parts: Uint8Array[] = [];
  const offsets: number[] = [];
  let length = 0;
  const push = (chunk: Uint8Array | string) => {
    const bytes = typeof chunk === 'string' ? enc(chunk) : chunk;
    parts.push(bytes);
    length += bytes.length;
  };
  const object = (n: number, body: (Uint8Array | string)[]) => {
    offsets[n] = length;
    push(`${n} 0 obj\n`);
    body.forEach(push);
    push('\nendobj\n');
  };

  push('%PDF-1.4\n');
  object(1, ['<< /Type /Catalog /Pages 2 0 R >>']);
  object(2, ['<< /Type /Pages /Kids [3 0 R] /Count 1 >>']);
  object(3, [`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${w} ${h}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`]);
  object(4, [`<< /Type /XObject /Subtype /Image /Width ${widthPx} /Height ${heightPx} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`, jpeg, '\nendstream']);
  object(5, [`<< /Length ${content.length} >>\nstream\n${content}\nendstream`]);

  const xrefAt = length;
  push('xref\n0 6\n0000000000 65535 f \n');
  for (let n = 1; n <= 5; n += 1) push(`${String(offsets[n]).padStart(10, '0')} 00000 n \n`);
  push(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefAt}\n%%EOF\n`);

  const out = new Uint8Array(length);
  let at = 0;
  for (const p of parts) {
    out.set(p, at);
    at += p.length;
  }
  return out;
}
