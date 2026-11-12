import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Banknote,
  CalendarDays,
  Check,
  Home,
  Pencil,
  Plus,
  Trash2,
  HardHat,
  Trees,
  FileDown,
} from "lucide-react";
import { jsPDF } from "jspdf";
import { formatCurrency } from "./calculations";
import { useAuth } from "@/contexts/AuthContext";
import { usePortalContent } from "@/lib/portalContent";
import { PmBudgetPanel } from "./PmBudgetPanel";
import { PmTimelinePanel } from "./PmTimelinePanel";
import { defaultCategoryForArea, pmDisplayArea } from "./pmDefaults";
import { computePmItemTotals } from "./pmItemMath";
import type {
  PMItem,
  PMSubcategorySelection,
  PmSubcategoryDatabase,
  ProjectManagerData,
} from "./types";
import {
  createDefaultPmData,
  hydrateProjectManagerData,
  loadPmData,
  loadProjects,
  buildPropertySpaces,
  syncCloudProjects,
  syncCloudPm,
  saveCloudPm,
  recalcPmBudget,
  savePmData,
} from "./storage";

/** Export only selected project tasks; no costs in the contractor-facing version. */
function exportScopePdf(data: ProjectManagerData, address: string, withValues: boolean, es: boolean): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const money = (n: number) => formatCurrency(Number(n) || 0);
  let y = 22;
  const newPage = (needed = 14) => {
    if (y + needed > 275) { doc.addPage(); y = 22; }
  };
  const line = (value: string, bold = false, size = 10) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(value || "-", 168) as string[];
    newPage(lines.length * 5 + 4);
    doc.text(lines, 20, y);
    y += lines.length * 5 + 3;
  };
  doc.setFillColor(22, 40, 65);
  doc.rect(0, 0, 210, 14, "F");
  doc.setTextColor(24, 42, 69);
  line("ADELAYNE GLOBAL CORP | " + (es ? "ALCANCE DE TRABAJO" : "SCOPE OF WORK"), true, 15);
  line(address, true, 11);
  line((es ? "Proyecto " : "Project ") + data.projectId + " | " + new Date().toLocaleDateString(es ? "es-US" : "en-US"), false, 9);
  line(es ? "Documento de planificación; sujeto a inspección y presupuesto final." : "Planning document; subject to inspection and final budget.", false, 9);
  if (data.timeline?.startDate) line(
    (es ? "Inicio estimado: " : "Planned start: ") +
    new Date(data.timeline.startDate).toLocaleDateString(es ? "es-US" : "en-US"), false, 9);
  if (data.timeline?.estimatedCompletion) line(
    (es ? "Finalización estimada: " : "Planned finish: ") +
    new Date(data.timeline.estimatedCompletion).toLocaleDateString(es ? "es-US" : "en-US"), false, 9);
  y += 3;
  const labels: Record<PMItem["status"], [string, string]> = {
    PLANNING: ["Pendiente", "Planned"],
    IN_PROGRESS: ["En progreso", "In progress"],
    COMPLETED: ["Completado", "Completed"],
    ON_HOLD: ["En espera", "On hold"],
  };
  const rows = [...(data.items ?? [])].sort((a,b)=>
    (a.category + a.area).localeCompare(b.category + b.area));
  if (!rows.length) line(es ? "Todavía no hay tareas asignadas." : "No tasks assigned yet.");
  for (const category of ["INTERIOR", "EXTERIOR"] as const) {
    const group = rows.filter((t) => t.category === category);
    if (!group.length) continue;
    newPage(18);
    line(category === "INTERIOR" ? (es ? "INTERIOR" : "INTERIOR") : (es ? "EXTERIOR" : "EXTERIOR"), true, 12);
    for (const task of group) {
      newPage(24);
      line(pmDisplayArea(task.area, !es) + "  -  " + (task.description || task.workType || "-"), true);
      line((es ? "Estado: " : "Status: ") + labels[task.status][es ? 0 : 1] +
        " | " + (es ? "Cantidad: " : "Quantity: ") + (task.quantity ?? 1) + " " + (task.unit ?? ""), false, 9);
      const phase = data.phaseMeta?.[task.category + "::" + task.area];
      if (phase?.coordinator) line((es ? "Responsable: " : "Coordinator: ") + phase.coordinator, false, 9);
      if (phase?.estimatedDays) line((es ? "Días previstos: " : "Estimated days: ") + phase.estimatedDays, false, 9);
      if (task.notes) line((es ? "Notas: " : "Notes: ") + task.notes, false, 9);
      if (withValues) line((es ? "Estimado: " : "Estimated: ") + money(task.totalEstimated) +
        " | " + (es ? "Real: " : "Actual: ") + money(task.totalActual ?? 0), false, 9);
    }
  }
  if (withValues) {
    y += 5;
    line((es ? "Presupuesto original: " : "Original budget: ") + money(data.dealRepairBudget), true);
    line((es ? "Presupuesto detallado: " : "Detailed budget: ") + money(data.budget.total));
    line((es ? "Costo real: " : "Actual spent: ") + money(data.budget.used));
  }
  doc.save("adelayne-scope-" + data.projectId + (withValues ? "-budget" : "-tasks") + ".pdf");
}

const STATUSES: PMItem["status"][] = [
  "PLANNING",
  "IN_PROGRESS",
  "COMPLETED",
  "ON_HOLD",
];

const statusLabel: Record<PMItem["status"], string> = {
  PLANNING: "Planificación",
  IN_PROGRESS: "En progreso",
  COMPLETED: "Completado",
  ON_HOLD: "En espera",
};

const statusLabelEn: Record<PMItem["status"], string> = {
  PLANNING: "Planning", IN_PROGRESS: "In Progress", COMPLETED: "Completed", ON_HOLD: "On Hold",
};
const optionLabelsEn: Record<string, string> = {
  EACH: "Each", SQFT: "Square Feet", LINEAR_FT: "Linear Feet", HOUR: "Hour",
  HIGH: "High", MEDIUM: "Medium", LOW: "Low",
  REPAIR: "Repair", REPLACE: "Replace", NEW: "New", UPGRADE: "Upgrade",
};

const UNITS: { value: string; label: string }[] = [
  { value: "EACH", label: "Cada uno" },
  { value: "SQFT", label: "Pie²" },
  { value: "LINEAR_FT", label: "Pie lineal" },
  { value: "HOUR", label: "Hora" },
];

const PRIORITIES: { value: string; label: string }[] = [
  { value: "HIGH", label: "Alta" },
  { value: "MEDIUM", label: "Media" },
  { value: "LOW", label: "Baja" },
];

const SUB_WORK_TYPES: { value: string; label: string }[] = [
  { value: "REPAIR", label: "Reparar" },
  { value: "REPLACE", label: "Reemplazar" },
  { value: "NEW", label: "Nuevo" },
  { value: "UPGRADE", label: "Mejorar" },
];

function areasForCategory(
  db: PmSubcategoryDatabase,
  map: Record<string, "INTERIOR" | "EXTERIOR">,
  category: "INTERIOR" | "EXTERIOR",
): string[] {
  return Object.keys(db).filter((area) => {
    const cat = map[area] ?? defaultCategoryForArea(area);
    return cat === category;
  });
}

function clonePmData(d: ProjectManagerData): ProjectManagerData {
  return JSON.parse(JSON.stringify(d)) as ProjectManagerData;
}

function PmCompleteItemDialog({
  item,
  open,
  onOpenChange,
  onConfirm,
  title,
  taskLabel,
  hint,
  costLabel,
  placeholder,
  cancelLabel,
  confirmLabel,
}: {
  item: PMItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (actualCost: number) => void;
  title: string;
  taskLabel: string;
  hint: string;
  costLabel: string;
  placeholder: string;
  cancelLabel: string;
  confirmLabel: string;
}) {
  const [costStr, setCostStr] = useState("");

  useEffect(() => {
    if (open && item) {
      const a = Number(item.totalActual) || 0;
      setCostStr(a > 0 ? String(a) : "");
    }
  }, [open, item]);

  const parsed = parseFloat(String(costStr).replace(",", "."));
  const valid = Number.isFinite(parsed) && parsed > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden border-amber-500/30 p-0 sm:max-w-md">
        <div className="bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 px-4 py-3.5">
          <DialogHeader className="space-y-0 text-left">
            <DialogTitle className="text-lg font-bold tracking-tight text-zinc-900">
              {title}
            </DialogTitle>
          </DialogHeader>
        </div>
        <div className="space-y-4 bg-zinc-950 p-5">
          <p className="text-base font-semibold text-zinc-50">{taskLabel}</p>
          <p className="text-sm leading-relaxed text-zinc-400">{hint}</p>
          <div className="space-y-2">
            <Label className="text-amber-400/95">
              {costLabel} <span className="text-red-400">*</span>
            </Label>
            <Input
              type="number"
              inputMode="decimal"
              min={0.01}
              step={1}
              placeholder={placeholder}
              className="border-sky-500/50 bg-zinc-900 text-zinc-100"
              value={costStr}
              onChange={(e) => setCostStr(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter className="gap-2 border-t border-white/10 bg-zinc-950 px-5 py-4">
          <Button variant="secondary" type="button" onClick={() => onOpenChange(false)}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            disabled={!valid}
            className="gap-2 bg-emerald-600 font-semibold uppercase tracking-wide hover:bg-emerald-700"
            onClick={() => {
              if (!valid) return;
              onConfirm(parsed);
            }}
          >
            <Check className="h-4 w-4 shrink-0" aria-hidden />
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PmAddItemDialog({
  open,
  onOpenChange,
  category,
  baseData,
  onSaved,
  editItemId,
  initialArea,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  category: "INTERIOR" | "EXTERIOR";
  baseData: ProjectManagerData;
  onSaved: (next: ProjectManagerData) => void;
  editItemId: string | null;
  initialArea?: string;
}) {
  const { i18n } = useTranslation();
  const pm = (spanish: string, english: string) => i18n.resolvedLanguage === "es" ? spanish : english;
  const [working, setWorking] = useState<ProjectManagerData>(() => clonePmData(baseData));
  const [selectedArea, setSelectedArea] = useState("");
  const [selectedSubs, setSelectedSubs] = useState<PMSubcategorySelection[]>([]);
  const [materials, setMaterials] = useState(0);
  const [labor, setLabor] = useState(0);
  const [other, setOther] = useState(0);
  const [markup, setMarkup] = useState(15);
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState("EACH");
  const [priority, setPriority] = useState("MEDIUM");
  const [status, setStatus] = useState<PMItem["status"]>("PLANNING");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [totalActual, setTotalActual] = useState(0);

  useEffect(() => {
    if (!open) return;
    const h = hydrateProjectManagerData(clonePmData(baseData));
    setWorking(h);
    const existing =
      editItemId != null ? h.items.find((i) => i.id === editItemId) : undefined;
    if (existing) {
      setSelectedArea(existing.area || "");
      setSelectedSubs(
        existing.subcategories?.length
          ? existing.subcategories.map((s) => ({ ...s }))
          : [],
      );
      setMaterials(Number(existing.materialsCost) || 0);
      setLabor(Number(existing.laborCost) || 0);
      setOther(Number(existing.otherCosts) || 0);
      setMarkup(Number(existing.markup) || 15);
      setQuantity(Math.max(1, Number(existing.quantity) || 1));
      setUnit(existing.unit || "EACH");
      setPriority(existing.priority || "MEDIUM");
      setStatus(existing.status);
      setDescription(existing.description || "");
      setNotes(existing.notes || "");
      setTotalActual(Number(existing.totalActual) || 0);
    } else {
      setSelectedArea(initialArea || "");
      setSelectedSubs([]);
      setMaterials(0);
      setLabor(0);
      setOther(0);
      setMarkup(15);
      setQuantity(1);
      setUnit("EACH");
      setPriority("MEDIUM");
      setStatus("PLANNING");
      setDescription("");
      setNotes("");
      setTotalActual(0);
    }
  }, [open, baseData, editItemId, initialArea]);

  const db = working.subcategoryDatabase ?? {};
  const areaMap = working.areaCategoryMap ?? {};

  const areaOptions = useMemo(
    () => areasForCategory(db, areaMap, category).sort((a, b) => a.localeCompare(b)),
    [db, areaMap, category],
  );

  useEffect(() => {
    if (selectedSubs.length === 0) return;
    const tm = selectedSubs.reduce((s, x) => s + x.materials, 0);
    const tl = selectedSubs.reduce((s, x) => s + x.labor, 0);
    setMaterials(tm);
    setLabor(tl);
    if (selectedSubs.length === 1) setUnit(selectedSubs[0].unit);
  }, [selectedSubs]);

  const subRows = selectedArea && db[selectedArea] ? Object.entries(db[selectedArea]) : [];

  const toggleSub = (
    name: string,
    costs: { materials: number; labor: number; unit: string },
    checked: boolean,
    workType: string,
  ) => {
    if (checked) {
      setSelectedSubs((prev) => [
        ...prev.filter((p) => p.name !== name),
        {
          name,
          materials: costs.materials,
          labor: costs.labor,
          unit: costs.unit,
          workType,
        },
      ]);
      if (!description.trim()) {
        setDescription((d) => (d.trim() ? d : name));
      }
    } else {
      setSelectedSubs((prev) => prev.filter((p) => p.name !== name));
    }
  };

  const updateSubCost = (
    subName: string,
    field: "materials" | "labor",
    value: number,
  ) => {
    if (!selectedArea || !db[selectedArea]?.[subName]) return;
    setWorking((w) => {
      const next = clonePmData(w);
      const a = next.subcategoryDatabase![selectedArea][subName];
      a[field] = value;
      return next;
    });
    setSelectedSubs((prev) =>
      prev.map((p) =>
        p.name === subName ? { ...p, [field]: value } : p,
      ),
    );
  };

  const updateSubWorkType = (subName: string, wt: string) => {
    setSelectedSubs((prev) =>
      prev.map((p) => (p.name === subName ? { ...p, workType: wt } : p)),
    );
  };

  const preview = computePmItemTotals(materials, labor, other, quantity, markup);

  const addCustomArea = () => {
    const name = window.prompt(pm("Nombre del área (p. ej., garaje)", "Area name (e.g., garage)"))?.trim();
    if (!name) return;
    if (db[name]) {
      toast.error(pm("Esa área ya existe", "This area already exists"));
      return;
    }
    setWorking((w) => {
      const next = clonePmData(w);
      next.subcategoryDatabase = { ...next.subcategoryDatabase!, [name]: {} };
      next.areaCategoryMap = { ...next.areaCategoryMap!, [name]: category };
      return next;
    });
    setSelectedArea(name);
    setSelectedSubs([]);
    toast.success(pm(`Área "${name}" creada`, `Area "${name}" created`));
  };

  const addCustomSubcategory = () => {
    if (!selectedArea || !db[selectedArea]) {
      toast.message(pm("Primero selecciona un área", "Select an area first"));
      return;
    }
    const name = window.prompt(pm("Nombre de la subcategoría", "Subcategory name"))?.trim();
    if (!name) return;
    const ms = parseFloat(window.prompt(pm("Costo de materiales ($)", "Materials cost ($)"), "0") || "0") || 0;
    const lb = parseFloat(window.prompt(pm("Costo de mano de obra ($)", "Labor cost ($)"), "0") || "0") || 0;
    if (db[selectedArea][name]) {
      toast.error(pm("Esa subcategoría ya existe en el área", "This subcategory already exists in this area"));
      return;
    }
    setWorking((w) => {
      const next = clonePmData(w);
      next.subcategoryDatabase![selectedArea][name] = {
        materials: ms,
        labor: lb,
        unit: "EACH",
      };
      return next;
    });
    toast.success(pm("Subcategoría agregada", "Subcategory added"));
  };

  const saveItem = () => {
    if (!editItemId && status === "COMPLETED") {
      toast.error(
        pm("No puedes crear una tarea con estado completado. Créala con otro estado y actualízala después.", "You cannot create an item as completed. Create it with another status and update it afterward."),
      );
      return;
    }
    const defaultArea =
      category === "INTERIOR" ? "General Interior" : "General Exterior";
    const resolvedArea = selectedArea.trim() || defaultArea;

    let desc = description.trim();
    if (selectedSubs.length > 1 && !desc) {
      desc = selectedSubs.map((s) => s.name).join(", ");
    } else if (!desc) {
      desc = `Trabajo en ${resolvedArea}`;
    }

    const workType =
      selectedSubs.length > 0 ? selectedSubs[0].workType || "REPAIR" : "MANUAL";

    if (editItemId) {
      const prev = working.items.find((i) => i.id === editItemId);
      if (!prev) {
        toast.error(pm("No se encontró la tarea que deseas editar", "The item could not be found"));
        return;
      }
      if (status === "COMPLETED" && !(Number(totalActual) > 0)) {
        toast.error(
          pm("El costo real debe ser mayor que cero para marcar la tarea como completada.", "Actual cost must be greater than zero to mark the item complete."),
        );
        return;
      }
      const item: PMItem = {
        ...prev,
        category,
        area: resolvedArea,
        description: desc,
        workType,
        priority,
        quantity,
        unit,
        materialsCost: materials,
        laborCost: labor,
        otherCosts: other,
        markup,
        totalEstimated: preview.totalEstimated,
        totalActual,
        status,
        notes: notes.trim(),
        subcategories: selectedSubs.length ? [...selectedSubs] : undefined,
      };
      const next = clonePmData(working);
      next.items = next.items.map((i) => (i.id === editItemId ? item : i));
      onSaved(next);
      onOpenChange(false);
      toast.success(pm("Tarea actualizada", "Item updated"));
      return;
    }

    const item: PMItem = {
      id: String(Date.now()),
      category,
      area: resolvedArea,
      description: desc,
      workType,
      priority,
      quantity,
      unit,
      materialsCost: materials,
      laborCost: labor,
      otherCosts: other,
      markup,
      totalEstimated: preview.totalEstimated,
      totalActual: 0,
      status,
      notes: notes.trim(),
      created: new Date().toISOString(),
      subcategories: selectedSubs.length ? [...selectedSubs] : undefined,
    };

    const next = clonePmData(working);
    next.items = [...(next.items || []), item];
    onSaved(next);
    onOpenChange(false);
    toast.success(pm("Tarea agregada", "Item added"));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto border-primary/30">
        <DialogHeader>
          <DialogTitle className="font-[Montserrat] text-primary">
            {editItemId ? pm("Editar tarea", "Edit Item") : pm("Agregar tarea", "Add Item")} —{" "}
            {category === "INTERIOR" ? "Interior" : "Exterior"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div className="min-w-[200px] flex-1 space-y-1.5">
              <Label className="text-primary">{pm("Área / subcategoría", "Area / Subcategory")}</Label>
              <Select value={selectedArea || "__none__"} onValueChange={(v) => {
                setSelectedArea(v === "__none__" ? "" : v);
                setSelectedSubs([]);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder={pm("Seleccionar…", "Select…")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">{pm("Seleccionar…", "Select…")}</SelectItem>
                  {areaOptions.map((a) => (
                    <SelectItem key={a} value={a}>
                      {pmDisplayArea(a, i18n.language.startsWith("en"))}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={addCustomArea}>
                {pm("+ Nueva área", "+ New Area")}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={addCustomSubcategory}>
                {pm("+ Nueva subcategoría", "+ New Subcategory")}
              </Button>
            </div>
          </div>

          {selectedArea && subRows.length > 0 ? (
            <div className="space-y-2 rounded-lg border border-border p-3">
              <Label className="text-primary">{pm("Subcategorías detalladas", "Detailed Subcategories")}</Label>
              <div className="max-h-[280px] space-y-3 overflow-y-auto pr-1">
                {subRows.map(([subName, costs]) => {
                  const sel = selectedSubs.find((s) => s.name === subName);
                  const checked = !!sel;
                  const wt = sel?.workType ?? "REPAIR";
                  return (
                    <div
                      key={subName}
                      className="rounded-md border border-border/60 bg-muted/20 p-2"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(c) =>
                              toggleSub(subName, costs, c === true, wt)
                            }
                          />
                          <span className="text-sm font-medium">{subName}</span>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <div className="flex items-center gap-1">
                            <span className="text-muted-foreground">Mat</span>
                            <Input
                              type="number"
                              className="h-8 w-24"
                              value={costs.materials}
                              onChange={(e) =>
                                updateSubCost(
                                  subName,
                                  "materials",
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                            />
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-muted-foreground">MO</span>
                            <Input
                              type="number"
                              className="h-8 w-24"
                              value={costs.labor}
                              onChange={(e) =>
                                updateSubCost(
                                  subName,
                                  "labor",
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                            />
                          </div>
                          <span className="self-center text-muted-foreground">
                            = {formatCurrency(costs.materials + costs.labor)}
                          </span>
                        </div>
                      </div>
                      {checked ? (
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="text-xs text-muted-foreground">Tipo</span>
                          <Select
                            value={wt}
                            onValueChange={(v) => updateSubWorkType(subName, v)}
                          >
                            <SelectTrigger className="h-8 w-[140px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {SUB_WORK_TYPES.map((o) => (
                                <SelectItem key={o.value} value={o.value}>
                                  {pm(o.label, optionLabelsEn[o.value] ?? o.label)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                {pm("Al seleccionar trabajos, sus costos se suman automáticamente. También puedes escribir montos manualmente.",
                  "Selected work items automatically add costs. You can also enter amounts manually.")}
              </p>
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label>{pm("Descripción del trabajo", "Work Description")}</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder={pm("Describe el trabajo…", "Describe the work…")}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="space-y-1.5">
              <Label>{pm("Cantidad", "Quantity")}</Label>
              <Input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) =>
                  setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>{pm("Unidad", "Unit")}</Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map((u) => (
                    <SelectItem key={u.value} value={u.value}>
                      {pm(u.label, optionLabelsEn[u.value] ?? u.label)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{pm("Prioridad", "Priority")}</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {pm(p.label, optionLabelsEn[p.value] ?? p.label)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{pm("Estado", "Status")}</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as PMItem["status"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {pm(statusLabel[s], statusLabelEn[s])}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="space-y-1.5">
              <Label>{pm("Materiales", "Materials")}</Label>
              <Input
                type="number"
                step={0.01}
                value={materials}
                onChange={(e) => setMaterials(parseFloat(e.target.value) || 0)}
              />
              <p className="text-[11px] text-muted-foreground">
{pm("Ingreso manual o suma automática", "Manual entry or automatic total")}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>{pm("Mano de obra", "Labor")}</Label>
              <Input
                type="number"
                step={0.01}
                value={labor}
                onChange={(e) => setLabor(parseFloat(e.target.value) || 0)}
              />
              <p className="text-[11px] text-muted-foreground">
                Manual o suma automática de subcategorías
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>{pm("Otros costos", "Other Costs")}</Label>
              <Input
                type="number"
                step={0.01}
                value={other}
                onChange={(e) => setOther(parseFloat(e.target.value) || 0)}
              />
              <p className="text-[11px] text-muted-foreground">
{pm("Permisos, tasas y otros gastos", "Permits, fees and other costs")}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>{pm("Margen (%)", "Markup (%)")}</Label>
              <Input
                type="number"
                step={0.01}
                value={markup}
                onChange={(e) => setMarkup(parseFloat(e.target.value) || 0)}
              />
              <p className="text-[11px] text-muted-foreground">
{pm("Porcentaje del contratista", "Contractor markup percentage")}
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm">
            <div className="font-semibold text-emerald-200">Presupuesto estimado (ítem)</div>
            <div className="mt-1 text-lg font-bold tabular-nums">
              {formatCurrency(preview.totalEstimated)}
            </div>
            <p className="text-xs text-muted-foreground">
              {pm("Subtotal", "Subtotal")} {formatCurrency((materials + labor + other) * quantity)} + {pm("margen", "markup")}{" "}
              {formatCurrency(preview.markupAmount)}
            </p>
          </div>

          {editItemId ? (
            <div className="space-y-1.5">
              <Label>{pm("Gasto real", "Actual Cost")}</Label>
              <Input
                type="number"
                step={0.01}
                min={0}
                value={totalActual}
                onChange={(e) => setTotalActual(parseFloat(e.target.value) || 0)}
              />
              <p className="text-[11px] text-muted-foreground">
{pm("Gasto real para comparar con el estimado", "Actual spending compared with the estimate")}
              </p>
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label>{pm("Notas", "Notes")}</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder={pm("Notas adicionales…", "Additional notes…")}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button className="bg-emerald-600 text-white hover:bg-emerald-700" onClick={saveItem}>
            {editItemId ? pm("Guardar cambios", "Save Changes") : pm("Guardar tarea", "Save Item")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function FixFlipProjectManagerPage() {
  const { i18n } = useTranslation();
  const es = i18n.language.startsWith("es");
  const portal = usePortalContent("pm", es ? "es" : "en");
  const pm = (s: string, e: string) => (es ? s : e);
  const { dealId: dealIdParam } = useParams<{ dealId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const dealId = Number(dealIdParam);
  const [cloudReady, setCloudReady] = useState(false);
  const [cloudRevision, setCloudRevision] = useState(0);

  const [data, setData] = useState<ProjectManagerData | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [addCategory, setAddCategory] = useState<"INTERIOR" | "EXTERIOR">("INTERIOR");
  const [editItemId, setEditItemId] = useState<string | null>(null);
  const [presetArea, setPresetArea] = useState<string | undefined>(undefined);
  const [completeTargetItem, setCompleteTargetItem] = useState<PMItem | null>(null);

  useEffect(() => {
    let active = true;
    setCloudReady(false);
    if (!user?.id) { setCloudReady(true); return; }
    void syncCloudProjects(user.id).then(() => {
      if (active) setCloudRevision(value => value + 1);
    }).catch(() => {
      // Existing browser data remain available if the connection fails.
    }).finally(() => { if (active) setCloudReady(true); });
    return () => { active = false; };
  }, [user?.id]);

  const deal = useMemo(() => {
    if (!Number.isFinite(dealId)) return null;
    return loadProjects(user?.id).find((p) => p.id === dealId) ?? null;
  }, [dealId, user?.id, cloudRevision]);

  useEffect(() => {
    if (!Number.isFinite(dealId) || dealId <= 0) {
      navigate("/project-manager", { replace: true });
      return;
    }
    if (!deal) {
      if (!cloudReady) return;
      toast.error(pm("Inversión no encontrada", "Investment not found"));
      navigate("/project-manager", { replace: true });
      return;
    }
    const existing = loadPmData(dealId, user?.id);
    const base =
      existing ||
      createDefaultPmData(dealId, deal.rehabBudget || 0, deal.inventorySnapshot);
    setData(recalcPmBudget(hydrateProjectManagerData(base)));
    if (!user?.id) return;
    let active = true;
    // Compare original timestamps, before recomputing UI totals.
    const localUpdated = existing?.lastUpdated ?? "";
    void syncCloudPm(dealId, user.id).then(remote => {
      if (!active || !remote) return;
      if (!existing || String(remote.lastUpdated || "") > String(localUpdated)) {
        setData(recalcPmBudget(hydrateProjectManagerData(remote)));
      }
    }).catch(() => {
      // Existing browser project remains accessible offline.
    });
    return () => { active = false; };
  }, [dealId, deal, navigate, user?.id, cloudReady]);

  const persist = useCallback(
    (next: ProjectManagerData) => {
      const hydrated = hydrateProjectManagerData(next);
      const merged = recalcPmBudget(hydrated);
      setData(merged);
      savePmData(dealId, merged, user?.id);
      if (user?.id) void saveCloudPm(dealId, merged, user.id).catch(() =>
        toast.error(es
          ? "Cambios guardados en este navegador, pero no se sincronizaron."
          : "Changes saved in this browser but cloud sync failed."
        ));
    },
    [dealId, user?.id, es],
  );

  const reopenPhase = useCallback(
    (phaseCategory: "INTERIOR" | "EXTERIOR", area: string) => {
      if (!data) return;
      const norm = (a: string) => a.trim() || "—";
      const target = norm(area);
      const slice = data.items.filter(
        (i) => i.category === phaseCategory && norm(i.area) === target,
      );
      if (slice.length === 0 || !slice.every((i) => i.status === "COMPLETED")) return;
      persist({
        ...data,
        items: data.items.map((i) =>
          i.category === phaseCategory && norm(i.area) === target
            ? { ...i, status: "IN_PROGRESS" as const }
            : i,
        ),
      });
      toast.success(pm("Fase reactivada", "Phase reopened"));
    },
    [data, persist, pm],
  );

  const confirmCompleteWithCost = useCallback(
    (actualCost: number) => {
      if (!data || !completeTargetItem) return;
      const id = completeTargetItem.id;
      persist({
        ...data,
        items: data.items.map((i) =>
          i.id === id ? { ...i, status: "COMPLETED" as const, totalActual: actualCost } : i,
        ),
      });
      toast.success(pm("Ítem marcado como completado", "Item marked complete"));
      setCompleteTargetItem(null);
    },
    [data, completeTargetItem, persist, pm],
  );

  const openEditItem = useCallback((item: PMItem) => {
    setEditItemId(item.id);
    setPresetArea(undefined);
    setAddCategory(item.category);
    setAddOpen(true);
  }, []);

  const interiorItems = data?.items.filter((i) => i.category === "INTERIOR") ?? [];
  const exteriorItems = data?.items.filter((i) => i.category === "EXTERIOR") ?? [];
  const totalTasks = data?.items.length ?? 0;
  const completedTasks = data?.items.filter((i) => i.status === "COMPLETED").length ?? 0;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const detailedEstimate = (data?.items ?? []).reduce((sum, item) => sum + (Number(item.totalEstimated) || 0), 0);
  const overBudget = (data?.budget.remaining ?? 0) < 0 ||
    ((data?.dealRepairBudget ?? 0) > 0 && detailedEstimate > (data?.dealRepairBudget ?? 0));


  const removeItem = (id: string) => {
    if (!data) return;
    persist({
      ...data,
      items: data.items.filter((i) => i.id !== id),
    });
    toast.success(pm("Tarea eliminada", "Item deleted"));
  };

  if (!data || !deal) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
        {pm("Cargando…", "Loading…")}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => navigate("/project-manager")}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          {pm("Volver", "Back")}
        </Button>
        <div className="flex items-center gap-2">
          <HardHat className="h-6 w-6 text-primary" />
          <div>
            <h1 className="font-[Montserrat] text-xl font-bold">{portal("title", pm("Gestión de proyectos", "Project Management"))}</h1>
            <p className="text-sm text-muted-foreground line-clamp-1">
              {deal.propertyAddress}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border/70 bg-card/85 p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold">{pm("Avance de tareas", "Task progress")}</p>
            <p className="text-xs text-muted-foreground">{completedTasks} / {totalTasks} {pm("tareas completadas", "tasks completed")}</p>
          </div>
          <span className="text-xl font-bold text-primary tabular-nums">{progressPercent}%</span>
        </div>
        <div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progressPercent} className="mt-3 h-2.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${progressPercent}%` }} />
        </div>
        {overBudget && <p className="mt-3 text-xs font-medium text-red-400">{pm("Atención: los gastos reales o presupuestados superan el presupuesto original.", "Warning: actual or estimated costs exceed the original budget.")}</p>}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground">{pm("Presupuesto estimado", "Estimated Budget")}</div>
            <div className="text-xl font-bold text-primary">
              {formatCurrency(data.budget.total)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground">{pm("Gasto real", "Actual Spending")}</div>
            <div className="text-xl font-bold text-amber-500">
              {formatCurrency(data.budget.used)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground">{pm("Restante", "Remaining")}</div>
            <div className="text-xl font-bold text-sky-400">
              {formatCurrency(data.budget.remaining)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground">{pm("Estado", "Status")}</div>
            <div className="text-xl font-bold">{data.status}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/70 bg-card/60 p-3">
        <span className="mr-auto text-sm font-medium">{pm("Documentos de obra / Scope of Work", "Construction scope / Scope of Work")}</span>
        <Button type="button" size="sm" variant="outline" onClick={() => exportScopePdf(data, deal.propertyAddress, false, es)}>
          <FileDown className="mr-2 h-4 w-4" />{pm("PDF sin valores", "PDF without costs")}
        </Button>
        <Button type="button" size="sm" onClick={() => exportScopePdf(data, deal.propertyAddress, true, es)}>
          <FileDown className="mr-2 h-4 w-4" />{pm("PDF con valores", "PDF with costs")}
        </Button>
        {(!data.spaces || data.spaces.length === 0) && deal.inventorySnapshot && (
          <Button type="button" size="sm" variant="secondary" onClick={() => persist({
            ...data, spaces: buildPropertySpaces(deal.inventorySnapshot),
          })}>{pm("Cargar espacios de Inventory", "Load Inventory spaces")}</Button>
        )}
      </div>
      <Tabs defaultValue="interior">
        <TabsList className="grid h-auto w-full max-w-3xl grid-cols-2 gap-1 rounded-lg border border-border/60 bg-muted/30 p-1 sm:grid-cols-4">
          <TabsTrigger
            value="interior"
            className="gap-2 data-[state=active]:border data-[state=active]:border-primary data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
          >
            <Home className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
            <span className="truncate">{pm("Interior", "Interior")}</span>
          </TabsTrigger>
          <TabsTrigger
            value="exterior"
            className="gap-2 data-[state=active]:border data-[state=active]:border-primary data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
          >
            <Trees className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
            <span className="truncate">{pm("Exterior", "Exterior")}</span>
          </TabsTrigger>
          <TabsTrigger
            value="timeline"
            className="gap-2 data-[state=active]:border data-[state=active]:border-primary data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
          >
            <CalendarDays className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
            <span className="truncate">{pm("Cronograma", "Timeline")}</span>
          </TabsTrigger>
          <TabsTrigger
            value="budget"
            className="gap-2 data-[state=active]:border data-[state=active]:border-primary data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
          >
            <Banknote className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
            <span className="truncate">{pm("Presupuesto", "Budget")}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="interior" className="space-y-3">
          <div className="flex items-center gap-2 border-b border-border/50 pb-2">
            <Home className="h-5 w-5 text-primary" aria-hidden />
            <h2 className="font-semibold text-primary">{pm("Módulo interior", "Interior module")}</h2>
          </div>
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={() => {
                setEditItemId(null);
                setPresetArea(undefined);
                setAddCategory("INTERIOR");
                setAddOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              {pm("Agregar ítem", "Add item")}
            </Button>
          </div>
          {(data.spaces ?? []).filter((space) => space.category === "INTERIOR").length > 0 && (
            <div className="rounded-xl border border-border/70 bg-card/60 p-4">
              <p className="mb-3 text-sm font-semibold">{pm("Espacios disponibles para remodelar", "Spaces available for renovation")}</p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {(data.spaces ?? []).filter((space) => space.category === "INTERIOR").map((space) => {
                  const count = data.items.filter((item) => item.area === space.name).length;
                  return <Button type="button" key={space.id} variant="outline" className="h-auto min-h-14 flex-col gap-1 px-3 py-2 text-left" onClick={() => {
                    setEditItemId(null); setPresetArea(space.name); setAddCategory("INTERIOR"); setAddOpen(true);
                  }}>
                    <span className="w-full truncate font-semibold">{pmDisplayArea(space.name, !es)}</span>
                    <span className="w-full text-xs text-muted-foreground">{count} {pm("tareas", "tasks")}</span>
                  </Button>;
                })}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{pm("Solo los trabajos añadidos generan costos.", "Only assigned work creates costs.")}</p>
            </div>
          )}
          <ItemsTable
            items={interiorItems}
            onDelete={removeItem}
            onEdit={openEditItem}
          />
        </TabsContent>

        <TabsContent value="exterior" className="space-y-3">
          <div className="flex items-center gap-2 border-b border-border/50 pb-2">
            <Trees className="h-5 w-5 text-primary" aria-hidden />
            <h2 className="font-semibold text-primary">{pm("Módulo exterior", "Exterior module")}</h2>
          </div>
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={() => {
                setEditItemId(null);
                setPresetArea(undefined);
                setAddCategory("EXTERIOR");
                setAddOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              {pm("Agregar ítem", "Add item")}
            </Button>
          </div>
          <ItemsTable
            items={exteriorItems}
            onDelete={removeItem}
            onEdit={openEditItem}
          />
        </TabsContent>

        <TabsContent value="timeline" className="space-y-3">
          <div className="flex items-center gap-2 border-b border-border/50 pb-2">
            <CalendarDays className="h-5 w-5 text-primary" aria-hidden />
            <h2 className="font-semibold text-primary">
              {pm("Cronograma del proyecto", "Project timeline")}
            </h2>
          </div>
          <PmTimelinePanel
            data={data}
            onPersist={persist}
            onReopenPhase={reopenPhase}
            onRequestCompleteItem={(item) => setCompleteTargetItem(item)}
            onEditItem={openEditItem}
          />
        </TabsContent>

        <TabsContent value="budget" className="space-y-3">
          <div className="flex items-center gap-2 border-b border-border/50 pb-2">
            <Banknote className="h-5 w-5 text-primary" aria-hidden />
            <h2 className="font-semibold text-primary">
              {pm("Control de presupuesto", "Budget control")}
            </h2>
          </div>
          <PmBudgetPanel
            items={data.items}
            dealRepairBudget={data.dealRepairBudget}
            onEditItem={openEditItem}
          />
        </TabsContent>
      </Tabs>

      <PmAddItemDialog
        open={addOpen}
        onOpenChange={(v) => {
          setAddOpen(v);
          if (!v) setEditItemId(null);
        }}
        category={addCategory}
        baseData={data}
        onSaved={persist}
        editItemId={editItemId}
        initialArea={presetArea}
      />

      <PmCompleteItemDialog
        item={completeTargetItem}
        open={completeTargetItem != null}
        onOpenChange={(v) => {
          if (!v) setCompleteTargetItem(null);
        }}
        onConfirm={confirmCompleteWithCost}
        title={pm("Marcar como completado", "Mark as completed")}
        taskLabel={completeTargetItem?.description || completeTargetItem?.workType || "—"}
        hint={pm(
          "El costo real es obligatorio y debe ser mayor que 0 para marcar el ítem como completado.",
          "Actual cost is required and must be greater than 0 to mark the item as completed.",
        )}
        costLabel={pm("Costo real ($)", "Actual cost ($)")}
        placeholder={pm("Ej: 1500", "e.g. 1500")}
        cancelLabel={pm("CANCELAR", "CANCEL")}
        confirmLabel={pm("MARCAR COMPLETADO", "MARK COMPLETE")}
      />
    </div>
  );
}

function ItemsTable({
  items,
  onDelete,
  onEdit,
}: {
  items: PMItem[];
  onDelete: (id: string) => void;
  onEdit: (item: PMItem) => void;
}) {
  const { i18n } = useTranslation();
  const pm = (spanish: string, english: string) =>
    i18n.resolvedLanguage?.startsWith("es") ? spanish : english;
  const showBreakdown = items.some(
    (i) =>
      i.materialsCost != null ||
      i.laborCost != null ||
      i.markup != null,
  );
  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-dashed py-8 text-center text-muted-foreground">
        {pm("Sin tareas. Agrega la primera con el botón superior.", "No tasks yet. Add the first one using the button above.")}
      </p>
    );
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{pm("Área", "Area")}</TableHead>
          <TableHead>{pm("Descripción", "Description")}</TableHead>
          {showBreakdown ? (
            <>
              <TableHead className="text-right">{pm("Mat.", "Mat.")}</TableHead>
              <TableHead className="text-right">{pm("M. O.", "Labor")}</TableHead>
              <TableHead className="text-right">{pm("Margen", "Markup")}</TableHead>
            </>
          ) : null}
          <TableHead className="text-right">{pm("Est.", "Est.")}</TableHead>
          <TableHead className="text-right">{pm("Real", "Actual")}</TableHead>
          <TableHead>{pm("Estado", "Status")}</TableHead>
          <TableHead className="w-24 text-right">{/* edit + delete */}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="font-medium">{item.area}</TableCell>
            <TableCell className="max-w-[220px] truncate text-muted-foreground">
              {item.description}
            </TableCell>
            {showBreakdown ? (
              <>
                <TableCell className="text-right tabular-nums">
                  {item.materialsCost != null ? formatCurrency(item.materialsCost) : "—"}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {item.laborCost != null ? formatCurrency(item.laborCost) : "—"}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {item.markup != null ? `${item.markup}%` : "—"}
                </TableCell>
              </>
            ) : null}
            <TableCell className="text-right tabular-nums">
              {formatCurrency(item.totalEstimated)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatCurrency(item.totalActual || 0)}
            </TableCell>
            <TableCell>
              <Badge variant="secondary">{pm(statusLabel[item.status], statusLabelEn[item.status])}</Badge>
            </TableCell>
            <TableCell className="text-right">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-amber-500 hover:text-amber-400"
                onClick={() => onEdit(item)}
                aria-label={pm("Editar tarea", "Edit task")}
                type="button"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-destructive"
                onClick={() => onDelete(item.id)}
                aria-label={pm("Eliminar tarea", "Delete task")}
                type="button"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
