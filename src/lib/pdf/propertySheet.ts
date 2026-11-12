// Ficha de propiedad en PDF con diseño Global 360 (vectorial, A4).
import { jsPDF } from 'jspdf';
import type { Property } from '@/types/property';
import {
  BRAND, CONTENT_W, FOOTER_Y, PAGE, type PdfLang,
  deliver, fill, font, footers, header, kvTable, loadImage, loadLogo, money, num, pill, section, stroke, tiles, today,
} from './brand';

const T = {
  es: {
    title: 'FICHA DE PROPIEDAD', subtitle: 'Global 360 · Oportunidad Fix & Flip',
    status: { available: 'Disponible', on_sale: 'En venta', sold: 'Vendida' } as Record<string, string>,
    price: 'Precio', arv: 'ARV', roi: 'ROI', rehab: 'Reparación', rent: 'Renta mensual',
    details: 'Detalles de la propiedad', finance: 'Resumen financiero', description: 'Descripción', gallery: 'Galería',
    type: 'Tipo', beds: 'Habitaciones', baths: 'Baños', area: 'Área', year: 'Año de construcción', statusLabel: 'Estado',
    purchase: 'Precio de compra', other: 'Otros costos', total: 'Inversión total', profit: 'Ganancia neta',
    annual: 'Ingreso anual', noi: 'NOI anual', cap: 'Cap rate', opex: 'Gastos operativos',
    ctaTitle: '¿Te interesa esta propiedad?',
    ctaText: 'Ingresa a Global 360 y marca tu interés, o escríbenos a info@buycash2day.com. Nuestro equipo te acompaña en el análisis y el financiamiento.',
    note: 'Información referencial preparada por Global 360. Las cifras son estimaciones y están sujetas a verificación, inspección y due diligence del inversionista.',
    share: 'Ficha de propiedad Global 360',
  },
  en: {
    title: 'PROPERTY SHEET', subtitle: 'Global 360 · Fix & Flip Opportunity',
    status: { available: 'Available', on_sale: 'On sale', sold: 'Sold' } as Record<string, string>,
    price: 'Price', arv: 'ARV', roi: 'ROI', rehab: 'Rehab', rent: 'Monthly rent',
    details: 'Property details', finance: 'Financial summary', description: 'Description', gallery: 'Gallery',
    type: 'Type', beds: 'Bedrooms', baths: 'Bathrooms', area: 'Living area', year: 'Year built', statusLabel: 'Status',
    purchase: 'Purchase price', other: 'Other costs', total: 'Total investment', profit: 'Net profit',
    annual: 'Annual income', noi: 'Annual NOI', cap: 'Cap rate', opex: 'Operating expenses',
    ctaTitle: 'Interested in this property?',
    ctaText: 'Sign in to Global 360 and mark your interest, or email us at info@buycash2day.com. Our team supports you with the analysis and financing.',
    note: 'Reference information prepared by Global 360. Figures are estimates and subject to verification, inspection and investor due diligence.',
    share: 'Global 360 property sheet',
  },
};

function statusColor(s: string) {
  if (s === 'sold') return BRAND.slate;
  if (s === 'on_sale') return BRAND.amber;
  return BRAND.green;
}

function imageUrls(p: Property): string[] {
  const fromTable = [...(p.property_images ?? [])]
    .sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order)
    .map((i) => i.url);
  return [...new Set([...fromTable, p.image_url, ...(p.gallery ?? [])].filter(Boolean) as string[])];
}

export async function buildPropertySheet(p: Property, lang: PdfLang): Promise<jsPDF> {
  const t = T[lang];
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const logo = await loadLogo();
  const urls = imageUrls(p);
  const [hero, ...rest] = await Promise.all(urls.slice(0, 7).map((u, i) => loadImage(u, i === 0 ? 182 / 88 : 16 / 10)));

  let y = header(doc, { logo, title: t.title, subtitle: t.subtitle, right: today(lang) });
  const x = PAGE.margin;

  // Foto principal
  const heroH = 88;
  if (hero) {
    doc.addImage(hero.data, 'JPEG', x, y, CONTENT_W, heroH);
  } else {
    fill(doc, BRAND.soft);
    doc.rect(x, y, CONTENT_W, heroH, 'F');
    font(doc, 10, true, BRAND.muted);
    doc.text('Global 360', x + CONTENT_W / 2, y + heroH / 2, { align: 'center' });
  }
  stroke(doc, BRAND.line);
  doc.setLineWidth(0.3);
  doc.rect(x, y, CONTENT_W, heroH, 'S');
  pill(doc, t.status[p.status] ?? p.status, x + 4, y + 4, statusColor(p.status));
  y += heroH + 9;

  // Título y dirección
  font(doc, 18, true, BRAND.navy);
  const titleLines = doc.splitTextToSize(p.title || '—', CONTENT_W) as string[];
  doc.text(titleLines.slice(0, 2), x, y);
  y += titleLines.slice(0, 2).length * 7;
  font(doc, 10, false, BRAND.text);
  doc.text([p.address, p.city, p.state, p.zip_code].filter(Boolean).join(', '), x, y);
  y += 7;

  // Indicadores clave
  y = tiles(doc, [
    { label: t.price, value: money(p.price, lang), accent: true },
    { label: t.arv, value: money(p.arv, lang) },
    { label: t.roi, value: p.roi ? `${num(p.roi, lang)}%` : '—' },
    { label: p.monthly_rent && !p.rehab_cost ? t.rent : t.rehab, value: money(p.monthly_rent && !p.rehab_cost ? p.monthly_rent : p.rehab_cost, lang) },
  ], x, y, CONTENT_W);

  // Detalles y resumen financiero en dos columnas
  const colW = (CONTENT_W - 6) / 2;
  const startY = y;
  let yl = section(doc, t.details, x, y + 1);
  yl = kvTable(doc, [
    [t.type, p.property_type || '—'],
    [t.beds, num(p.bedrooms, lang)],
    [t.baths, num(p.bathrooms, lang)],
    [t.area, p.sqft ? `${num(p.sqft, lang)} ft²` : '—'],
    [t.year, p.year_built ? String(p.year_built) : '—'],
    [t.statusLabel, t.status[p.status] ?? p.status],
  ], x, yl, colW);
  const fin: [string, string][] = [
    [t.purchase, money(p.price, lang)],
    [t.rehab, money(p.rehab_cost, lang)],
  ];
  if (p.other_costs) fin.push([t.other, money(p.other_costs, lang)]);
  if (p.total_investment) fin.push([t.total, money(p.total_investment, lang)]);
  if (p.net_profit) fin.push([t.profit, money(p.net_profit, lang)]);
  if (p.monthly_rent) fin.push([t.rent, money(p.monthly_rent, lang)]);
  if (p.annual_noi) fin.push([t.noi, money(p.annual_noi, lang)]);
  if (p.cap_rate) fin.push([t.cap, `${num(p.cap_rate, lang)}%`]);
  let yr = section(doc, t.finance, x + colW + 6, startY + 1);
  yr = kvTable(doc, fin.slice(0, 7), x + colW + 6, yr, colW);
  y = Math.max(yl, yr);

  // Descripción (sigue en página 2 si no cabe)
  const desc = (p.description || '').trim();
  const newPage = () => { doc.addPage(); return header(doc, { logo, title: t.title, subtitle: p.title || t.subtitle, compact: true }); };
  if (desc) {
    font(doc, 9.5, false, BRAND.text);
    const lines = doc.splitTextToSize(desc, CONTENT_W) as string[];
    if (y + 14 > FOOTER_Y - 10) y = newPage();
    y = section(doc, t.description, x, y + 1);
    for (const ln of lines) {
      if (y > FOOTER_Y - 10) { y = newPage(); font(doc, 9.5, false, BRAND.text); }
      font(doc, 9.5, false, BRAND.text);
      doc.text(ln, x, y);
      y += 4.6;
    }
    y += 4;
  }

  // Galería
  const gallery = rest.filter(Boolean) as { data: string }[];
  if (gallery.length) {
    const gw = (CONTENT_W - 4) / 2, gh = gw / (16 / 10);
    if (y + 10 + gh > FOOTER_Y - 10) y = newPage();
    y = section(doc, t.gallery, x, y + 1);
    gallery.slice(0, 6).forEach((g, i) => {
      const col = i % 2;
      if (col === 0 && i > 0) y += gh + 4;
      if (y + gh > FOOTER_Y - 10) { y = newPage(); }
      doc.addImage(g.data, 'JPEG', x + col * (gw + 4), y, gw, gh);
      stroke(doc, BRAND.line);
      doc.rect(x + col * (gw + 4), y, gw, gh, 'S');
    });
    y += gh + 8;
  }

  // Llamado a la acción
  const ctaH = 24;
  if (y + ctaH > FOOTER_Y - 8) y = newPage();
  fill(doc, BRAND.navy);
  doc.roundedRect(x, y, CONTENT_W, ctaH, 3, 3, 'F');
  fill(doc, BRAND.gold);
  doc.rect(x, y, 2, ctaH, 'F');
  font(doc, 11.5, true, BRAND.goldLight);
  doc.text(t.ctaTitle, x + 7, y + 8);
  font(doc, 8.6, false, [214, 220, 232]);
  doc.text(doc.splitTextToSize(t.ctaText, CONTENT_W - 14) as string[], x + 7, y + 13.5);

  footers(doc, lang, t.note);
  return doc;
}

/** Genera la ficha y la descarga (o la comparte en el móvil). */
export async function downloadPropertySheet(p: Property, lang: PdfLang) {
  const doc = await buildPropertySheet(p, lang);
  const name = `Global360 - ${p.title || 'propiedad'}`;
  return deliver(doc, name, T[lang].share);
}
