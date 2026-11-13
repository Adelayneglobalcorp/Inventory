import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  differenceInCalendarDays,
  format,
  isValid,
  parseISO,
} from "date-fns";
import { enUS as localeEn, es as localeEs } from "date-fns/locale";
import { CheckCircle2, MessageSquare, Pencil, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { formatCurrency } from "./calculations";
import { pmDisplayArea, pmDisplayWork } from "./pmDefaults";
import type {
  PMItem,
  PMPhaseMeta,
  PMPhaseNote,
  PMPhaseProvider,
  ProjectManagerData,
} from "./types";

function safeParse(iso: string): Date | null {
  try {
    const d = parseISO(iso);
    return isValid(d) ? d : null;
  } catch {
    return null;
  }
}

function groupItemsByArea(items: PMItem[]): Map<string, PMItem[]> {
  const m = new Map<string, PMItem[]>();
  for (const item of items) {
    const key = item.area?.trim() || "—";
    if (!m.has(key)) m.set(key, []);
    m.get(key)!.push(item);
  }
  return m;
}

function sumEstimated(items: PMItem[]) {
  return items.reduce((s, i) => s + (Number(i.totalEstimated) || 0), 0);
}

function sumActual(items: PMItem[]) {
  return items.reduce((s, i) => s + (Number(i.totalActual) || 0), 0);
}

function completedRatio(items: PMItem[]) {
  if (items.length === 0) return 0;
  const done = items.filter((i) => i.status === "COMPLETED").length;
  return Math.round((done / items.length) * 100);
}

function supplierCount(items: PMItem[]) {
  return items.reduce((s, i) => s + (i.subcategories?.length ?? 0), 0);
}

function firstNotesSnippet(items: PMItem[], maxLen: number): string | null {
  for (const i of items) {
    const n = i.notes?.trim();
    if (n) return n.length > maxLen ? `${n.slice(0, maxLen)}…` : n;
  }
  return null;
}

function phaseKey(category: "INTERIOR" | "EXTERIOR", area: string): string {
  return `${category}::${area.trim() || "—"}`;
}

function makeDefaultPhaseMeta(itemCount: number): PMPhaseMeta {
  return {
    estimatedDays: Math.max(7, itemCount * 7),
    coordinator: "",
    providers: [],
    notes: [],
  };
}

/** Barra estilo legacy: verde al 100 %, azul en progreso, solo carril si 0 %. */
function PhaseProgressBar({ value }: { value: number }) {
  const v = Math.min(100, Math.max(0, value));
  return (
    <div className="relative h-2 w-full overflow-hidden rounded-full border border-white/[0.08] bg-zinc-950/90 shadow-inner">
      <div
        className={cn(
          "h-full rounded-full transition-all duration-500 ease-out",
          v >= 100 &&
            "bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.25)]",
          v > 0 && v < 100 && "bg-gradient-to-r from-sky-600 to-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.2)]",
        )}
        style={{ width: `${v}%` }}
      />
    </div>
  );
}

function MiniStatusBar({
  count,
  total,
  variant,
}: {
  count: number;
  total: number;
  variant: "success" | "muted";
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="relative mt-2 h-1.5 w-full overflow-hidden rounded-full border border-white/[0.06] bg-zinc-950/80">
      <div
        className={cn(
          "h-full rounded-full transition-all",
          variant === "success" &&
            count > 0 &&
            "bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.2)]",
          variant === "muted" && count > 0 && "bg-zinc-500/45",
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

type PhaseLabels = {
  items: string;
  days: string;
  suppliers: string;
  budget: string;
  totalCost: string;
  overBudget: string;
  withinBudget: string;
  estimatedTime: string;
  notes: string;
};

function PhaseAreaCard({
  areaName,
  items,
  start,
  end,
  dayCount,
  locale,
  english,
  labels,
  phaseCategory,
  onReopenPhase,
  onRequestCompleteItem,
  onEditItem,
  reopenLabel,
  completeItemLabel,
  pickCompleteLabel,
  editLabel,
  pickItemLabel,
  phaseMeta,
  onOpenProviders,
  onOpenNotes,
}: {
  areaName: string;
  items: PMItem[];
  start: Date;
  end: Date;
  dayCount: number;
  locale: typeof localeEs;
  english: boolean;
  labels: PhaseLabels;
  phaseCategory: "INTERIOR" | "EXTERIOR";
  onReopenPhase: (category: "INTERIOR" | "EXTERIOR", area: string) => void;
  onRequestCompleteItem: (item: PMItem) => void;
  onEditItem: (item: PMItem) => void;
  reopenLabel: string;
  completeItemLabel: string;
  pickCompleteLabel: string;
  editLabel: string;
  pickItemLabel: string;
  phaseMeta: PMPhaseMeta;
  onOpenProviders: () => void;
  onOpenNotes: () => void;
}) {
  const estimated = sumEstimated(items);
  const actual = sumActual(items);
  const pct = completedRatio(items);
  const withinBudget = actual <= estimated;

  const incomplete = useMemo(
    () => items.filter((i) => i.status !== "COMPLETED"),
    [items],
  );
  const allDone = incomplete.length === 0;

  const startStr = format(start, "P", { locale });
  const endStr = format(end, "P", { locale });
  const notesLine =
    phaseMeta.notes.length > 0
      ? `${phaseMeta.notes.length} ${english ? "note(s)" : "nota(s)"}: ${phaseMeta.notes[0].text}`
      : firstNotesSnippet(items, 80);
  const phaseEstimatedDays = Math.max(
    1,
    Number(phaseMeta.estimatedDays) || Math.max(7, items.length * 7),
  );
  const providersTotal =
    phaseMeta.providers.length > 0 ? phaseMeta.providers.length : supplierCount(items);

  return (
    <Card className="overflow-hidden rounded-xl border border-white/[0.08] bg-zinc-900/70 shadow-lg shadow-black/20 ring-1 ring-white/[0.04] backdrop-blur-sm">
      <CardHeader className="space-y-3 pb-3 pt-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <CardTitle className="text-lg font-semibold tracking-tight text-zinc-50">
            {pmDisplayArea(areaName, english)}
          </CardTitle>
          <div className="text-right text-xs leading-snug text-zinc-400">
            <div className="tabular-nums">
              {startStr} – {endStr}
            </div>
            <div className="mt-0.5 text-zinc-500">
              ({dayCount} {labels.days})
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <PhaseProgressBar value={pct} />
          {allDone ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-10 w-10 shrink-0 rounded-full border border-emerald-500/45 bg-emerald-500/10 text-emerald-300 shadow-[0_0_14px_rgba(16,185,129,0.25)] hover:bg-emerald-500/20 hover:text-emerald-200"
              aria-label={reopenLabel}
              onClick={() => onReopenPhase(phaseCategory, areaName)}
            >
              <CheckCircle2
                className="h-5 w-5 text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.45)]"
                aria-hidden
              />
            </Button>
          ) : incomplete.length === 1 ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-10 w-10 shrink-0 rounded-full border border-emerald-500/45 bg-emerald-500/10 text-emerald-300 shadow-[0_0_14px_rgba(16,185,129,0.25)] hover:bg-emerald-500/20 hover:text-emerald-200"
              aria-label={completeItemLabel}
              onClick={() => onRequestCompleteItem(incomplete[0])}
            >
              <CheckCircle2
                className={cn(
                  "h-5 w-5",
                  pct === 100
                    ? "text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.45)]"
                    : "text-zinc-600",
                )}
                aria-hidden
              />
            </Button>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 shrink-0 rounded-full border border-emerald-500/45 bg-emerald-500/10 text-emerald-300 shadow-[0_0_14px_rgba(16,185,129,0.25)] hover:bg-emerald-500/20 hover:text-emerald-200"
                  aria-label={pickCompleteLabel}
                >
                  <CheckCircle2
                    className={cn(
                      "h-5 w-5",
                      pct === 100
                        ? "text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.45)]"
                        : "text-zinc-600",
                    )}
                    aria-hidden
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="max-w-[300px]">
                <div className="px-2 py-1.5 text-xs font-medium text-zinc-500">
                  {pickCompleteLabel}
                </div>
                {incomplete.map((i) => (
                  <DropdownMenuItem key={i.id} onSelect={() => onRequestCompleteItem(i)}>
                    <span className="truncate">{pmDisplayWork(i.description || i.workType || "—", english)}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {items.length === 1 ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-10 w-10 shrink-0 rounded-full border border-amber-400/60 bg-amber-500/10 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.22)] hover:bg-amber-500/20 hover:text-amber-200"
              aria-label={editLabel}
              onClick={() => onEditItem(items[0])}
            >
              <Pencil className="h-4 w-4" aria-hidden />
            </Button>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 shrink-0 rounded-full border border-amber-400/60 bg-amber-500/10 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.22)] hover:bg-amber-500/20 hover:text-amber-200"
                  aria-label={pickItemLabel}
                >
                  <Pencil className="h-4 w-4" aria-hidden />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="max-w-[280px]">
                {items.map((i) => (
                  <DropdownMenuItem key={i.id} onSelect={() => onEditItem(i)}>
                    <span className="truncate">{pmDisplayWork(i.description || i.workType || "—", english)}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pb-5 text-sm">
        <div>
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            {items.length} {labels.items}
          </span>
          <div className="mt-2 flex flex-wrap gap-2">
            {items.map((i) => {
              const done = i.status === "COMPLETED";
              return (
                <Badge
                  key={i.id}
                  variant="outline"
                  className={cn(
                    "max-w-full border font-normal",
                    done
                      ? "border-emerald-500/35 bg-emerald-950/50 text-emerald-100"
                      : "border-zinc-600/50 bg-zinc-800/60 text-zinc-300",
                  )}
                >
                  <span className="truncate">{pmDisplayWork(i.description || i.workType || "—", english)}</span>
                </Badge>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-white/[0.06] pt-3 text-[11px]">
          <button
            type="button"
            onClick={onOpenProviders}
            className="flex items-center justify-center gap-1.5 font-semibold uppercase tracking-wide text-amber-400/95 transition hover:text-amber-300"
          >
            <Users className="h-3.5 w-3.5" aria-hidden />
            <span>{labels.suppliers}</span>
          </button>
          <button
            type="button"
            onClick={onOpenNotes}
            className="flex items-center justify-center gap-1.5 font-semibold uppercase tracking-wide text-amber-400/95 transition hover:text-amber-300"
          >
            <MessageSquare className="h-3.5 w-3.5" aria-hidden />
            <span>{labels.notes}</span>
          </button>
          <div className="col-span-2 min-h-[16px] text-center text-xs text-zinc-500">
            {notesLine ? notesLine : "\u00a0"}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 border-t border-white/[0.06] pt-4 text-xs sm:grid-cols-4">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              {labels.estimatedTime}
            </div>
            <div className="mt-1 font-semibold tabular-nums text-amber-400">
              {phaseEstimatedDays} {labels.days}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              {labels.suppliers}
            </div>
            <div className="mt-1 font-semibold tabular-nums text-sky-400">{providersTotal}</div>
          </div>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              {labels.budget}
            </div>
            <div className="mt-1 font-semibold tabular-nums text-amber-400">{formatCurrency(estimated)}</div>
          </div>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              {labels.totalCost}
            </div>
            <div
              className={cn(
                "mt-1 font-semibold tabular-nums",
                withinBudget ? "text-emerald-400" : "text-red-400",
              )}
            >
              {formatCurrency(actual)}
            </div>
            <span
              className={cn(
                "mt-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-medium",
                withinBudget
                  ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/25"
                  : "bg-red-500/15 text-red-300 ring-1 ring-red-500/25",
              )}
            >
              {withinBudget ? labels.withinBudget : labels.overBudget}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const STATUS_KEYS = ["PLANNING", "IN_PROGRESS", "COMPLETED", "ON_HOLD"] as const;

function PhaseProvidersDialog({
  open,
  onOpenChange,
  phaseLabel,
  meta,
  onSave,
  t,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  phaseLabel: string;
  meta: PMPhaseMeta;
  onSave: (meta: PMPhaseMeta) => void;
  t: (es: string, en: string) => string;
}) {
  const [draft, setDraft] = useState<PMPhaseMeta>(meta);
  useEffect(() => setDraft(meta), [meta]);

  const updateProvider = (id: string, field: keyof PMPhaseProvider, value: string) => {
    setDraft((prev) => ({
      ...prev,
      providers: prev.providers.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl border-amber-500/30 bg-zinc-950">
        <DialogHeader>
          <DialogTitle className="text-2xl text-amber-300">
            {t("Proveedores - ", "Suppliers - ")}
            {phaseLabel}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-1.5">
              <Label>{t("Tiempo estimado para la fase", "Estimated phase time")}</Label>
              <Input
                type="number"
                min={1}
                value={draft.estimatedDays}
                onChange={(e) =>
                  setDraft((p) => ({ ...p, estimatedDays: Math.max(1, Number(e.target.value) || 1) }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("Unidad de tiempo", "Time unit")}</Label>
              <Input value={t("Días", "Days")} readOnly />
            </div>
            <div className="space-y-1.5">
              <Label>{t("Coordinador de fase", "Phase coordinator")}</Label>
              <Input
                value={draft.coordinator}
                onChange={(e) => setDraft((p) => ({ ...p, coordinator: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t("Proveedores asignados", "Assigned providers")}</Label>
            <div className="space-y-2 rounded-lg border border-white/10 p-3">
              {draft.providers.map((p) => (
                <div key={p.id} className="grid gap-2 md:grid-cols-[1fr_1fr_1fr_auto]">
                  <Input value={p.name} onChange={(e) => updateProvider(p.id, "name", e.target.value)} placeholder={t("Nombre", "Name")} />
                  <Input value={p.role} onChange={(e) => updateProvider(p.id, "role", e.target.value)} placeholder={t("Rol", "Role")} />
                  <Input value={p.phone} onChange={(e) => updateProvider(p.id, "phone", e.target.value)} placeholder={t("Teléfono", "Phone")} />
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() =>
                      setDraft((prev) => ({
                        ...prev,
                        providers: prev.providers.filter((x) => x.id !== p.id),
                      }))
                    }
                  >
                    {t("Eliminar", "Remove")}
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setDraft((prev) => ({
                    ...prev,
                    providers: [
                      ...prev.providers,
                      { id: crypto.randomUUID(), name: "", role: "", phone: "" },
                    ],
                  }))
                }
              >
                {t("+ Agregar proveedor manual", "+ Add manual provider")}
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            {t("Cancelar", "Cancel")}
          </Button>
          <Button
            className="bg-amber-500 text-zinc-900 hover:bg-amber-400"
            onClick={() => {
              onSave(draft);
              onOpenChange(false);
            }}
          >
            {t("Guardar proveedores", "Save providers")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PhaseNotesDialog({
  open,
  onOpenChange,
  phaseLabel,
  meta,
  onSave,
  t,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  phaseLabel: string;
  meta: PMPhaseMeta;
  onSave: (meta: PMPhaseMeta) => void;
  t: (es: string, en: string) => string;
}) {
  const [draft, setDraft] = useState<PMPhaseMeta>(meta);
  const [newNote, setNewNote] = useState("");
  const [priority, setPriority] = useState(t("Alta", "High"))
  const { i18n } = useTranslation();
  const noteLocale = i18n.resolvedLanguage === "es" ? localeEs : localeEn;
  const displayPriority = (value: string) => {
    switch (value.toLowerCase()) {
      case "alta": case "high": return t("Alta", "High");
      case "media": case "medium": return t("Media", "Medium");
      case "baja": case "low": return t("Baja", "Low");
      default: return value;
    }
  };
  useEffect(() => setDraft(meta), [meta]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl border-amber-500/30 bg-zinc-950">
        <DialogHeader>
          <DialogTitle className="text-2xl text-amber-300">
            {t("Notas Importantes - ", "Important Notes - ")}
            {phaseLabel}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[1fr_290px]">
            <Textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder={t("Escribe una nota importante para esta fase...", "Write an important note for this phase...")}
              rows={4}
            />
            <div className="space-y-2">
              <Input value={priority} onChange={(e) => setPriority(e.target.value)} />
              <Button
                type="button"
                className="w-full bg-amber-500 text-zinc-900 hover:bg-amber-400"
                onClick={() => {
                  const txt = newNote.trim();
                  if (!txt) return;
                  const note: PMPhaseNote = {
                    id: crypto.randomUUID(),
                    text: txt,
                    priority: priority.trim() || t("Alta", "High"),
                    createdAt: new Date().toISOString(),
                  };
                  setDraft((prev) => ({ ...prev, notes: [note, ...prev.notes] }));
                  setNewNote("");
                }}
              >
                {t("+ Agregar nota", "+ Add note")}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            {draft.notes.length === 0 ? (
              <p className="text-sm text-zinc-400">{t("No hay notas agregadas aún", "No notes added yet")}</p>
            ) : (
              draft.notes.map((n) => (
                <div key={n.id} className="flex items-start justify-between gap-3 rounded-md border border-white/10 p-2">
                  <div>
                    <p className="text-sm text-zinc-100">{n.text}</p>
                    <p className="text-xs text-zinc-500">
                      {displayPriority(n.priority)} · {format(parseISO(n.createdAt), "Pp", { locale: noteLocale })}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() =>
                      setDraft((prev) => ({
                        ...prev,
                        notes: prev.notes.filter((x) => x.id !== n.id),
                      }))
                    }
                  >
                    {t("Eliminar", "Remove")}
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            {t("Cancelar", "Cancel")}
          </Button>
          <Button
            className="bg-amber-500 text-zinc-900 hover:bg-amber-400"
            onClick={() => {
              onSave(draft);
              onOpenChange(false);
            }}
          >
            {t("Guardar notas", "Save notes")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function PmTimelinePanel({
  data,
  onPersist,
  onReopenPhase,
  onRequestCompleteItem,
  onEditItem,
}: {
  data: ProjectManagerData;
  onPersist: (next: ProjectManagerData) => void;
  onReopenPhase: (category: "INTERIOR" | "EXTERIOR", area: string) => void;
  onRequestCompleteItem: (item: PMItem) => void;
  onEditItem: (item: PMItem) => void;
}) {
  const { i18n } = useTranslation();
  const es = i18n.language.startsWith("es");
  const locale = es ? localeEs : localeEn;
  const pm = (s: string, e: string) => (es ? s : e);

  const start = safeParse(data.timeline.startDate) ?? new Date();
  const end = safeParse(data.timeline.estimatedCompletion) ?? new Date();
  const span = differenceInCalendarDays(end, start);
  const dayCount = span >= 1 ? span : 1;

  const interior = useMemo(
    () => data.items.filter((i) => i.category === "INTERIOR"),
    [data.items],
  );
  const exterior = useMemo(
    () => data.items.filter((i) => i.category === "EXTERIOR"),
    [data.items],
  );

  const interiorGroups = useMemo(() => {
    const m = groupItemsByArea(interior);
    return Array.from(m.entries()).sort(([a], [b]) =>
      a.localeCompare(b, undefined, { sensitivity: "base" }),
    );
  }, [interior]);

  const exteriorGroups = useMemo(() => {
    const m = groupItemsByArea(exterior);
    return Array.from(m.entries()).sort(([a], [b]) =>
      a.localeCompare(b, undefined, { sensitivity: "base" }),
    );
  }, [exterior]);

  const statusCounts = useMemo(() => {
    const map: Record<string, number> = {
      PLANNING: 0,
      IN_PROGRESS: 0,
      COMPLETED: 0,
      ON_HOLD: 0,
    };
    for (const i of data.items) {
      const k = i.status in map ? i.status : "PLANNING";
      map[k] += 1;
    }
    return map;
  }, [data.items]);

  const totalItems = data.items.length;
  const [providerPhase, setProviderPhase] = useState<{
    category: "INTERIOR" | "EXTERIOR";
    area: string;
  } | null>(null);
  const [notesPhase, setNotesPhase] = useState<{
    category: "INTERIOR" | "EXTERIOR";
    area: string;
  } | null>(null);

  const getMeta = useMemo(
    () => (category: "INTERIOR" | "EXTERIOR", area: string): PMPhaseMeta => {
      const key = phaseKey(category, area);
      return data.phaseMeta?.[key] ?? makeDefaultPhaseMeta(data.items.length);
    },
    [data.phaseMeta, data.items.length],
  );

  const saveMeta = (
    category: "INTERIOR" | "EXTERIOR",
    area: string,
    meta: PMPhaseMeta,
  ) => {
    const key = phaseKey(category, area);
    onPersist({
      ...data,
      phaseMeta: {
        ...(data.phaseMeta ?? {}),
        [key]: {
          ...meta,
          estimatedDays: Math.max(1, Number(meta.estimatedDays) || 1),
          providers: meta.providers.filter(
            (p) => p.name.trim() || p.role.trim() || p.phone.trim(),
          ),
          notes: meta.notes.filter((n) => n.text.trim()),
        },
      },
    });
  };

  const labels: PhaseLabels = {
    items: pm("ítems", "items"),
    days: pm("días", "days"),
    suppliers: pm("Proveedores", "Suppliers"),
    budget: pm("Presupuesto", "Budget"),
    totalCost: pm("Costo total", "Total cost"),
    overBudget: pm("Sobre presupuesto", "Over budget"),
    withinBudget: pm("Dentro de presupuesto", "Within budget"),
    estimatedTime: pm("Tiempo estimado", "Estimated time"),
    notes: pm("Notas", "Notes"),
  };

  const statusLabels: Record<(typeof STATUS_KEYS)[number], string> = {
    PLANNING: pm("Planificación", "Planning"),
    IN_PROGRESS: pm("En progreso", "In progress"),
    COMPLETED: pm("Completado", "Completed"),
    ON_HOLD: pm("En espera", "On hold"),
  };

  const reopenLabel = pm("Reactivar fase", "Reopen phase");
  const completeItemLabel = pm("Marcar como completado", "Mark as completed");
  const pickCompleteLabel = pm("Elegir ítem a completar", "Choose item to complete");
  const editItemLabel = pm("Editar ítem", "Edit item");
  const pickItemToEditLabel = pm("Elegir ítem a editar", "Choose item to edit");

  const setStartDate = (yyyyMmDd: string) => {
    const d = new Date(`${yyyyMmDd}T12:00:00`);
    if (Number.isNaN(d.getTime())) return;
    onPersist({
      ...data,
      timeline: { ...data.timeline, startDate: d.toISOString() },
    });
  };

  const setEndDate = (yyyyMmDd: string) => {
    const d = new Date(`${yyyyMmDd}T12:00:00`);
    if (Number.isNaN(d.getTime())) return;
    onPersist({
      ...data,
      timeline: { ...data.timeline, estimatedCompletion: d.toISOString() },
    });
  };

  const startInput = format(start, "yyyy-MM-dd");
  const endInput = format(end, "yyyy-MM-dd");

  if (!data.items.length) {
    return (
      <div className="rounded-xl border border-dashed border-white/10 bg-zinc-900/40 p-8 text-center text-sm text-zinc-400">
        {pm(
          "Agrega ítems en Interior o Exterior: el cronograma se arma solo agrupando por área (como en la app anterior).",
          "Add items under Interior or Exterior—the timeline builds automatically by area, like the legacy app.",
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 rounded-xl border border-white/[0.06] bg-gradient-to-b from-zinc-950/80 to-zinc-950/40 p-4 shadow-inner ring-1 ring-white/[0.03] sm:p-5">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-white/[0.08] bg-zinc-900/60 shadow-md ring-1 ring-white/[0.04]">
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              {pm("Resumen del proyecto", "Project summary")}
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="grid grid-cols-3 divide-x divide-white/[0.08] text-center">
              <div className="px-2">
                <div className="text-2xl font-bold tabular-nums text-emerald-400">{totalItems}</div>
                <div className="mt-1 text-[11px] font-medium text-zinc-500">
                  {pm("Total ítems", "Total items")}
                </div>
              </div>
              <div className="px-2">
                <div className="text-2xl font-bold tabular-nums text-amber-400">{interior.length}</div>
                <div className="mt-1 text-[11px] font-medium text-zinc-500">{pm("Interior", "Interior")}</div>
              </div>
              <div className="px-2">
                <div className="text-2xl font-bold tabular-nums text-sky-400">{exterior.length}</div>
                <div className="mt-1 text-[11px] font-medium text-zinc-500">{pm("Exterior", "Exterior")}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/[0.08] bg-zinc-900/60 shadow-md ring-1 ring-white/[0.04]">
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              {pm("Fechas estimadas", "Estimated dates")}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 pb-4 sm:grid-cols-2">
            <div className="space-y-2 rounded-lg border border-sky-500/20 bg-sky-950/20 p-3">
              <Label className="flex items-center gap-1.5 text-[11px] font-medium text-sky-300/90">
                <Pencil className="h-3.5 w-3.5" aria-hidden />
                {pm("Inicio", "Start date")}
              </Label>
              <Input
                type="date"
                value={startInput}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-9 border-sky-500/25 bg-zinc-950/80 text-sm"
              />
              <p className="text-xs font-medium tabular-nums text-sky-400">{format(start, "P", { locale })}</p>
            </div>
            <div className="space-y-2 rounded-lg border border-emerald-500/20 bg-emerald-950/20 p-3">
              <Label className="text-[11px] font-medium text-emerald-300/90">
                {pm("Fin estimado", "Estimated end")}
              </Label>
              <Input
                type="date"
                value={endInput}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-9 border-emerald-500/25 bg-zinc-950/80 text-sm"
              />
              <p className="text-xs font-medium tabular-nums text-emerald-400">{format(end, "P", { locale })}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        {interiorGroups.length > 0 && (
          <section className="space-y-3">
            <h3 className="border-b border-amber-500/25 pb-2 text-sm font-semibold tracking-wide text-amber-400/95">
              {pm("Fases interiores", "Interior phases")}
            </h3>
            <div className="space-y-4">
              {interiorGroups.map(([area, phaseItems]) => (
                <PhaseAreaCard
                  key={`int-${area}`}
                  areaName={area}
                  items={phaseItems}
                  start={start}
                  end={end}
                  dayCount={dayCount}
                  locale={locale}
                  english={!es}
                  labels={labels}
                  phaseCategory="INTERIOR"
                  onReopenPhase={onReopenPhase}
                  onRequestCompleteItem={onRequestCompleteItem}
                  onEditItem={onEditItem}
                  reopenLabel={reopenLabel}
                  completeItemLabel={completeItemLabel}
                  pickCompleteLabel={pickCompleteLabel}
                  editLabel={editItemLabel}
                  pickItemLabel={pickItemToEditLabel}
                  phaseMeta={getMeta("INTERIOR", area)}
                  onOpenProviders={() =>
                    setProviderPhase({ category: "INTERIOR", area })
                  }
                  onOpenNotes={() => setNotesPhase({ category: "INTERIOR", area })}
                />
              ))}
            </div>
          </section>
        )}

        {exteriorGroups.length > 0 && (
          <section className="space-y-3">
            <h3 className="border-b border-sky-500/25 pb-2 text-sm font-semibold tracking-wide text-sky-400/95">
              {pm("Fases exteriores", "Exterior phases")}
            </h3>
            <div className="space-y-4">
              {exteriorGroups.map(([area, phaseItems]) => (
                <PhaseAreaCard
                  key={`ext-${area}`}
                  areaName={area}
                  items={phaseItems}
                  start={start}
                  end={end}
                  dayCount={dayCount}
                  locale={locale}
                  english={!es}
                  labels={labels}
                  phaseCategory="EXTERIOR"
                  onReopenPhase={onReopenPhase}
                  onRequestCompleteItem={onRequestCompleteItem}
                  onEditItem={onEditItem}
                  reopenLabel={reopenLabel}
                  completeItemLabel={completeItemLabel}
                  pickCompleteLabel={pickCompleteLabel}
                  editLabel={editItemLabel}
                  pickItemLabel={pickItemToEditLabel}
                  phaseMeta={getMeta("EXTERIOR", area)}
                  onOpenProviders={() =>
                    setProviderPhase({ category: "EXTERIOR", area })
                  }
                  onOpenNotes={() => setNotesPhase({ category: "EXTERIOR", area })}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      <section className="space-y-3 pt-1">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          {pm("Progreso por estado", "Progress by status")}
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {STATUS_KEYS.map((key) => (
            <Card
              key={key}
              className="border-white/[0.07] bg-zinc-900/50 shadow-sm ring-1 ring-white/[0.03]"
            >
              <CardContent className="p-3 pt-3">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                  {statusLabels[key]}
                </div>
                <div className="mt-1 text-xl font-bold tabular-nums text-zinc-100">{statusCounts[key]}</div>
                <MiniStatusBar
                  count={statusCounts[key]}
                  total={totalItems}
                  variant={key === "COMPLETED" ? "success" : "muted"}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {providerPhase ? (
        <PhaseProvidersDialog
          open={providerPhase != null}
          onOpenChange={(v) => !v && setProviderPhase(null)}
          phaseLabel={pmDisplayArea(providerPhase.area, !es)}
          meta={getMeta(providerPhase.category, providerPhase.area)}
          onSave={(meta) => saveMeta(providerPhase.category, providerPhase.area, meta)}
          t={pm}
        />
      ) : null}

      {notesPhase ? (
        <PhaseNotesDialog
          open={notesPhase != null}
          onOpenChange={(v) => !v && setNotesPhase(null)}
          phaseLabel={pmDisplayArea(notesPhase.area, !es)}
          meta={getMeta(notesPhase.category, notesPhase.area)}
          onSave={(meta) => saveMeta(notesPhase.category, notesPhase.area, meta)}
          t={pm}
        />
      ) : null}
    </div>
  );
}
