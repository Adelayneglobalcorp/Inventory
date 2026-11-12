// Alcance de trabajo (Project Manager) en PDF con diseño Global 360.
// withValues=false → versión para contratistas (sin costos); true → con presupuesto.
import { jsPDF } from 'jspdf';
import {
  BRAND, CONTENT_W, FOOTER_Y, PAGE, type PdfLang, type RGB,
  deliver, fill, font, footers, header, loadLogo, money, pill, section, stroke, tiles, today,
} from '@/lib/pdf/brand';
import { pmDisplayArea, pmDisplayWork } from './pmDefaults';
import type { PMItem, ProjectManagerData } from './types';

const STATUS: Record<PMItem['status'], { es: string; en: string; color: RGB }> = {
  PLANNING: { es: 'Pendiente', en: 'Planned', color: BRAND.slate },
  IN_PROGRESS: { es: 'En progreso', en: 'In progress', color: BRAND.blue },
  COMPLETED: { es: 'Completado', en: 'Completed', color: BRAND.green },
  ON_HOLD: { es: 'En espera', en: 'On hold', color: BRAND.amber },
};

export async function exportScopePdfBranded(data: ProjectManagerData, address: string, withValues: boolean, es: boolean) {
  const lang: PdfLang = es ? 'es' : 'en';
  const L = (a: string, b: string) => (es ? a : b);
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const logo = await loadLogo();
  const title = withValues ? L('ALCANCE Y PRESUPUESTO', 'SCOPE & BUDGET') : L('ALCANCE DE TRABAJO', 'SCOPE OF WORK');
  const subtitle = 'Global 360 · Project Management';
  const x = PAGE.margin;
  let y = header(doc, { logo, title, subtitle, right: today(lang) });
  const newPage = () => { doc.addPage(); return header(doc, { logo, title, subtitle: address || subtitle, compact: true }); };
  const ensure = (h: number) => { if (y + h > FOOTER_Y - 10) y = newPage(); };

  // Proyecto
  font(doc, 16, true, BRAND.navy);
  const addr = doc.splitTextToSize(address || '—', CONTENT_W) as string[];
  doc.text(addr.slice(0, 2), x, y);
  y += addr.slice(0, 2).length * 6.5;
  font(doc, 9, false, BRAND.muted);
  doc.text(`${L('Proyecto', 'Project')} ${data.projectId}`, x, y);
  y += 7;

  const items = [...(data.items ?? [])].sort((a, b) => (a.category + a.area).localeCompare(b.category + b.area));
  const done = items.filter((i) => i.status === 'COMPLETED').length;
  const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString(es ? 'es-US' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
  y = tiles(doc, [
    { label: L('Tareas', 'Tasks'), value: String(items.length), accent: true },
    { label: L('Completadas', 'Completed'), value: `${done}/${items.length}` },
    { label: L('Inicio', 'Start'), value: fmtDate(data.timeline?.startDate) },
    { label: L('Fin estimado', 'Est. finish'), value: fmtDate(data.timeline?.estimatedCompletion) },
  ], x, y, CONTENT_W);

  if (withValues) {
    y = tiles(doc, [
      { label: L('Presupuesto original', 'Original budget'), value: money(data.dealRepairBudget, lang) },
      { label: L('Presupuesto detallado', 'Detailed budget'), value: money(data.budget.total, lang) },
      { label: L('Costo real', 'Actual spent'), value: money(data.budget.used, lang), accent: true },
    ], x, y, CONTENT_W);
  }

  if (!items.length) {
    font(doc, 10, false, BRAND.text);
    doc.text(L('Todavía no hay tareas asignadas.', 'No tasks assigned yet.'), x, y + 4);
  }

  for (const category of ['INTERIOR', 'EXTERIOR'] as const) {
    const group = items.filter((t) => t.category === category);
    if (!group.length) continue;
    ensure(16);
    y = section(doc, `${category} · ${group.length} ${L('tareas', 'tasks')}`, x, y + 2);
    for (const task of group) {
      const phase = data.phaseMeta?.[task.category + '::' + task.area];
      const meta: string[] = [];
      meta.push(`${L('Cantidad', 'Quantity')}: ${task.quantity ?? 1} ${task.unit ?? ''}`.trim());
      if (phase?.coordinator) meta.push(`${L('Responsable', 'Coordinator')}: ${phase.coordinator}`);
      if (phase?.estimatedDays) meta.push(`${L('Días previstos', 'Est. days')}: ${phase.estimatedDays}`);
      font(doc, 8.5, false, BRAND.text);
      const notes = task.notes ? (doc.splitTextToSize(`${L('Notas', 'Notes')}: ${task.notes}`, CONTENT_W - 12) as string[]) : [];
      const cardH = 15 + (notes.length ? notes.length * 4 + 1 : 0) + (withValues ? 5 : 0);
      ensure(cardH + 3);
      fill(doc, BRAND.soft);
      stroke(doc, BRAND.line);
      doc.setLineWidth(0.3);
      doc.roundedRect(x, y, CONTENT_W, cardH, 2, 2, 'FD');
      fill(doc, STATUS[task.status].color);
      doc.rect(x, y, 1.6, cardH, 'F');
      font(doc, 10, true, BRAND.navy);
      const head = `${pmDisplayArea(task.area, !es)}  ·  ${pmDisplayWork(task.description || task.workType || '-', !es)}`;
      doc.text((doc.splitTextToSize(head, CONTENT_W - 45) as string[])[0], x + 5, y + 6);
      pill(doc, STATUS[task.status][lang], x + CONTENT_W - 4, y + 2.6, STATUS[task.status].color, BRAND.white, 'right');
      font(doc, 8.3, false, BRAND.muted);
      doc.text(meta.join('   ·   '), x + 5, y + 11.5);
      let ty = y + 11.5;
      if (notes.length) {
        font(doc, 8.5, false, BRAND.text);
        doc.text(notes, x + 5, ty + 4.5);
        ty += notes.length * 4 + 1;
      }
      if (withValues) {
        font(doc, 8.5, true, BRAND.navy);
        doc.text(`${L('Estimado', 'Estimated')}: ${money(task.totalEstimated, lang)}     ${L('Real', 'Actual')}: ${money(task.totalActual ?? 0, lang)}`, x + 5, ty + 5);
      }
      y += cardH + 3;
    }
    y += 3;
  }

  footers(doc, lang, L(
    'Documento de planificación preparado con Global 360; sujeto a inspección, permisos y presupuesto final.',
    'Planning document prepared with Global 360; subject to inspection, permits and final budget.',
  ));
  await deliver(doc, `Global360 - ${withValues ? L('presupuesto', 'budget') : L('alcance', 'scope')} - ${data.projectId}`, title);
}
