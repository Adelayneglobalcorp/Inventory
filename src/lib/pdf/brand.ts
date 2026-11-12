// Kit de diseño para los PDF de Global 360 (jsPDF vectorial, A4 en mm).
// Misma línea visual que los correos: azul marino, dorado y tarjetas suaves.
import type { jsPDF } from 'jspdf';

export type PdfLang = 'es' | 'en';
export type RGB = [number, number, number];

export const BRAND = {
  navy: [11, 23, 48] as RGB,
  navy2: [21, 38, 72] as RGB,
  gold: [217, 173, 79] as RGB,
  goldLight: [243, 212, 136] as RGB,
  goldDark: [184, 134, 45] as RGB,
  text: [74, 84, 104] as RGB,
  muted: [138, 147, 166] as RGB,
  soft: [246, 247, 250] as RGB,
  line: [230, 233, 240] as RGB,
  white: [255, 255, 255] as RGB,
  green: [22, 163, 74] as RGB,
  amber: [217, 119, 6] as RGB,
  blue: [37, 99, 235] as RGB,
  slate: [100, 116, 139] as RGB,
};

export const PAGE = { w: 210, h: 297, margin: 14 };
export const CONTENT_W = PAGE.w - PAGE.margin * 2;
export const FOOTER_Y = 284;

export const fill = (doc: jsPDF, c: RGB) => doc.setFillColor(c[0], c[1], c[2]);
export const stroke = (doc: jsPDF, c: RGB) => doc.setDrawColor(c[0], c[1], c[2]);
export const ink = (doc: jsPDF, c: RGB) => doc.setTextColor(c[0], c[1], c[2]);

export function font(doc: jsPDF, size: number, bold = false, color: RGB = BRAND.text) {
  doc.setFont('helvetica', bold ? 'bold' : 'normal');
  doc.setFontSize(size);
  ink(doc, color);
}

export function money(value: unknown, lang: PdfLang): string {
  const n = Number(value);
  if (value === null || value === undefined || value === '' || !Number.isFinite(n)) return '—';
  return new Intl.NumberFormat(lang === 'en' ? 'en-US' : 'es-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

export function num(value: unknown, lang: PdfLang): string {
  const n = Number(value);
  if (value === null || value === undefined || value === '' || !Number.isFinite(n) || n === 0) return '—';
  return new Intl.NumberFormat(lang === 'en' ? 'en-US' : 'es-US', { maximumFractionDigits: 2 }).format(n);
}

export function today(lang: PdfLang): string {
  return new Date().toLocaleDateString(lang === 'en' ? 'en-US' : 'es-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

/** Carga una imagen y la devuelve como JPEG recortada al aspecto pedido (tipo «object-fit: cover»). */
export async function loadImage(url: string, aspect?: number, maxW = 1400): Promise<{ data: string; ratio: number } | null> {
  if (!url) return null;
  try {
    const ctrl = new AbortController();
    const timer = window.setTimeout(() => ctrl.abort(), 12000);
    const res = await fetch(url, { mode: 'cors', signal: ctrl.signal });
    window.clearTimeout(timer);
    if (!res.ok) return null;
    const blob = await res.blob();
    const bitmapUrl = URL.createObjectURL(blob);
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = bitmapUrl;
    });
    const srcRatio = img.naturalWidth / img.naturalHeight;
    const ratio = aspect ?? srcRatio;
    let sw = img.naturalWidth, sh = img.naturalHeight, sx = 0, sy = 0;
    if (aspect) {
      if (srcRatio > aspect) { sw = sh * aspect; sx = (img.naturalWidth - sw) / 2; }
      else { sh = sw / aspect; sy = (img.naturalHeight - sh) / 2; }
    }
    const w = Math.min(maxW, Math.round(sw));
    const h = Math.round(w / ratio);
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
    URL.revokeObjectURL(bitmapUrl);
    return { data: canvas.toDataURL('image/jpeg', 0.86), ratio };
  } catch {
    return null;
  }
}

/** Logo Global 360 (versión para fondos oscuros) como PNG con transparencia. */
let logoCache: string | null | undefined;
export async function loadLogo(): Promise<string | null> {
  if (logoCache !== undefined) return logoCache;
  try {
    const res = await fetch('/global360-dark.png');
    const blob = await res.blob();
    logoCache = await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
  } catch {
    logoCache = null;
  }
  return logoCache;
}

/** Cabecera azul marino con logo, título, subtítulo y franja dorada. Devuelve la Y donde empieza el contenido. */
export function header(doc: jsPDF, o: { logo: string | null; title: string; subtitle: string; right?: string; compact?: boolean }): number {
  const h = o.compact ? 20 : 34;
  fill(doc, BRAND.navy);
  doc.rect(0, 0, PAGE.w, h, 'F');
  fill(doc, BRAND.navy2);
  doc.triangle(PAGE.w - 70, 0, PAGE.w, 0, PAGE.w, h, 'F');
  const logoSize = o.compact ? 14 : 24;
  if (o.logo) doc.addImage(o.logo, 'PNG', PAGE.margin, (h - logoSize) / 2, logoSize, logoSize);
  const x = PAGE.margin + logoSize + 6;
  font(doc, o.compact ? 11 : 16, true, BRAND.white);
  doc.text(o.title, x, o.compact ? 10 : 16);
  font(doc, o.compact ? 7.5 : 9, false, BRAND.goldLight);
  doc.text(o.subtitle, x, o.compact ? 15 : 23);
  if (o.right) {
    font(doc, 8, false, [200, 208, 222]);
    doc.text(o.right, PAGE.w - PAGE.margin, o.compact ? 12 : 16, { align: 'right' });
  }
  fill(doc, BRAND.gold);
  doc.rect(0, h, PAGE.w, 1.2, 'F');
  return h + 9;
}

/** Pie de página en todas las páginas (se llama al final). */
export function footers(doc: jsPDF, lang: PdfLang, note: string) {
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    stroke(doc, BRAND.line);
    doc.setLineWidth(0.3);
    doc.line(PAGE.margin, FOOTER_Y - 4, PAGE.w - PAGE.margin, FOOTER_Y - 4);
    font(doc, 7.5, true, BRAND.navy);
    doc.text('Global 360', PAGE.margin, FOOTER_Y);
    const brandW = doc.getTextWidth('Global 360 ');
    font(doc, 7.5, false, BRAND.muted);
    doc.text('by Adelayne Global Corp  ·  info@buycash2day.com', PAGE.margin + brandW, FOOTER_Y);
    doc.text(`${lang === 'en' ? 'Page' : 'Página'} ${i} ${lang === 'en' ? 'of' : 'de'} ${pages}`, PAGE.w - PAGE.margin, FOOTER_Y, { align: 'right' });
    font(doc, 6.5, false, BRAND.muted);
    doc.text(doc.splitTextToSize(note, CONTENT_W) as string[], PAGE.margin, FOOTER_Y + 4.5);
  }
}

/** Título de sección con barra dorada a la izquierda. */
export function section(doc: jsPDF, title: string, x: number, y: number): number {
  fill(doc, BRAND.gold);
  doc.rect(x, y - 3.6, 1.4, 5, 'F');
  font(doc, 10.5, true, BRAND.navy);
  doc.text(title.toUpperCase(), x + 4, y);
  return y + 6;
}

/** Fila de tarjetas de indicadores (etiqueta pequeña + valor grande). */
export function tiles(doc: jsPDF, items: { label: string; value: string; accent?: boolean }[], x: number, y: number, w: number, h = 20): number {
  const gap = 3;
  const tw = (w - gap * (items.length - 1)) / items.length;
  items.forEach((it, i) => {
    const tx = x + i * (tw + gap);
    if (it.accent) { fill(doc, BRAND.navy); } else { fill(doc, BRAND.soft); }
    stroke(doc, it.accent ? BRAND.navy : BRAND.line);
    doc.setLineWidth(0.3);
    doc.roundedRect(tx, y, tw, h, 2.5, 2.5, 'FD');
    font(doc, 6.8, true, it.accent ? BRAND.goldLight : BRAND.muted);
    doc.text(it.label.toUpperCase(), tx + 4, y + 6.5);
    font(doc, 13, true, it.accent ? BRAND.white : BRAND.navy);
    const v = doc.splitTextToSize(it.value, tw - 8) as string[];
    doc.text(v[0], tx + 4, y + 14.5);
  });
  return y + h + 6;
}

/** Tabla de pares etiqueta/valor con filas alternas. */
export function kvTable(doc: jsPDF, rows: [string, string][], x: number, y: number, w: number, rowH = 7.2): number {
  stroke(doc, BRAND.line);
  doc.setLineWidth(0.3);
  rows.forEach(([k, v], i) => {
    const ry = y + i * rowH;
    if (i % 2 === 0) { fill(doc, BRAND.soft); doc.rect(x, ry, w, rowH, 'F'); }
    font(doc, 8.3, false, BRAND.muted);
    doc.text(k, x + 3, ry + 4.8);
    font(doc, 8.8, true, BRAND.navy);
    doc.text(v, x + w - 3, ry + 4.8, { align: 'right' });
  });
  doc.roundedRect(x, y, w, rows.length * rowH, 1.5, 1.5, 'S');
  return y + rows.length * rowH + 6;
}

/** Pastilla de estado (texto en mayúsculas sobre color). */
export function pill(doc: jsPDF, text: string, x: number, y: number, bg: RGB, fg: RGB = BRAND.white, align: 'left' | 'right' = 'left'): number {
  font(doc, 7, true, fg);
  const w = doc.getTextWidth(text.toUpperCase()) + 6;
  const px = align === 'right' ? x - w : x;
  fill(doc, bg);
  doc.roundedRect(px, y, w, 5.6, 2.8, 2.8, 'F');
  ink(doc, fg);
  doc.text(text.toUpperCase(), px + 3, y + 3.9);
  return w;
}

/** Descarga o comparte el PDF (Web Share en móvil, descarga en escritorio). */
export async function deliver(doc: jsPDF, fileName: string, shareText: string): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const blob = doc.output('blob');
  const safe = fileName.replace(/[\\/:*?"<>|]+/g, '-').trim() || 'global360';
  const file = new File([blob], `${safe}.pdf`, { type: 'application/pdf' });
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  const isTouch = window.matchMedia?.('(pointer: coarse)').matches;
  if (isTouch && nav.share && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: safe, text: shareText });
      return 'shared';
    } catch (e) {
      if ((e as Error)?.name === 'AbortError') return 'cancelled';
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${safe}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
  return 'downloaded';
}
