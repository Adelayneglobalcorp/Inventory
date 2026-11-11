import { Banknote, Pencil } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "./calculations";
import type { PMItem } from "./types";

function num(n: number): number {
  return Number.isFinite(n) ? n : 0;
}

function itemMaterials(item: PMItem): number {
  return num(item.materialsCost);
}

function itemLabor(item: PMItem): number {
  return num(item.laborCost);
}

function itemOther(item: PMItem): number {
  return num(item.otherCosts);
}

/** Margen / overhead implícito (como legacy: total − mat − MO − otros). */
function itemMarkupPortion(item: PMItem): number {
  return num(item.totalEstimated) - itemMaterials(item) - itemLabor(item) - itemOther(item);
}

type AreaAgg = {
  estimated: number;
  actual: number;
  count: number;
  items: PMItem[];
};

function aggregateByArea(items: PMItem[]): Record<string, AreaAgg> {
  const map: Record<string, AreaAgg> = {};
  for (const item of items) {
    const a = item.area || "—";
    if (!map[a]) {
      map[a] = { estimated: 0, actual: 0, count: 0, items: [] };
    }
    map[a].estimated += num(item.totalEstimated);
    map[a].actual += num(item.totalActual);
    map[a].count += 1;
    map[a].items.push(item);
  }
  return map;
}

type Alert = { type: "danger" | "warning" | "info" | "secondary" | "success"; icon: string; message: string };

function buildBudgetAlerts(
  items: PMItem[],
  dealRepairBudget: number,
  totalActual: number,
  totalEstimated: number,
): Alert[] {
  const alerts: Alert[] = [];
  const deal = num(dealRepairBudget);

  if (deal > 0 && totalActual > deal) {
    alerts.push({
      type: "danger",
      icon: "⚠️",
      message: `Presupuesto del Deal excedido en ${formatCurrency(totalActual - deal)}`,
    });
  }
  if (deal > 0 && totalEstimated > deal) {
    alerts.push({
      type: "warning",
      icon: "📊",
      message: `Presupuesto PM supera Deal en ${formatCurrency(totalEstimated - deal)}`,
    });
  }
  const percentUsed = deal > 0 ? (totalActual / deal) * 100 : 0;
  if (deal > 0 && percentUsed > 80 && percentUsed < 100) {
    alerts.push({
      type: "warning",
      icon: "⚡",
      message: `Presupuesto del Deal casi agotado (${Math.round(percentUsed)}% utilizado)`,
    });
  }
  if (items.length > 0) {
    const avg = totalEstimated / items.length;
    const expensive = items.filter((i) => num(i.totalEstimated) > avg * 2);
    if (expensive.length > 0) {
      alerts.push({
        type: "info",
        icon: "💰",
        message: `${expensive.length} ítem(s) con presupuesto elevado`,
      });
    }
    const planning = items.filter((i) => i.status === "PLANNING").length;
    if (planning > items.length * 0.5) {
      alerts.push({
        type: "secondary",
        icon: "📋",
        message: `${planning} ítems aún en planificación`,
      });
    }
  }
  if (deal > 0 && items.length > 0 && totalActual <= deal && percentUsed < 50) {
    alerts.push({
      type: "success",
      icon: "✅",
      message: `Buen control del presupuesto del Deal (${Math.round(percentUsed)}% utilizado)`,
    });
  }
  return alerts;
}

const alertClass: Record<Alert["type"], string> = {
  danger: "border-destructive/50 bg-destructive/10 text-destructive",
  warning: "border-amber-500/40 bg-amber-500/10 text-amber-200",
  info: "border-sky-500/40 bg-sky-500/10 text-sky-100",
  secondary: "border-border bg-muted/50 text-muted-foreground",
  success: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
};

export function PmBudgetPanel({
  items,
  dealRepairBudget,
  onEditItem,
}: {
  items: PMItem[];
  dealRepairBudget: number;
  onEditItem: (item: PMItem) => void;
}) {
  const deal = num(dealRepairBudget);
  const totalEstimated = items.reduce((s, i) => s + num(i.totalEstimated), 0);
  const totalActual = items.reduce((s, i) => s + num(i.totalActual), 0);
  const totalMaterials = items.reduce((s, i) => s + itemMaterials(i), 0);
  const totalLabor = items.reduce((s, i) => s + itemLabor(i), 0);
  const totalOther = items.reduce((s, i) => s + itemOther(i), 0);
  const totalMarkup = items.reduce((s, i) => s + itemMarkupPortion(i), 0);

  const interiorItems = items.filter((i) => i.category === "INTERIOR");
  const exteriorItems = items.filter((i) => i.category === "EXTERIOR");
  const interiorEstimated = interiorItems.reduce((s, i) => s + num(i.totalEstimated), 0);
  const exteriorEstimated = exteriorItems.reduce((s, i) => s + num(i.totalEstimated), 0);

  const areaBudgets = aggregateByArea(items);
  const areaEntries = Object.entries(areaBudgets).sort(([a], [b]) => a.localeCompare(b));

  const pct = (nume: number, den: number) =>
    den > 0 ? Math.min(100, Math.round((nume / den) * 100)) : 0;

  const pctEstVsDeal = pct(totalEstimated, deal);
  const pctActVsDeal = pct(totalActual, deal);

  const alerts = buildBudgetAlerts(items, deal, totalActual, totalEstimated);

  if (items.length === 0) {
    return (
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-primary">{formatCurrency(deal)}</div>
              <p className="text-xs text-muted-foreground">Presupuesto de reparaciones (Deal)</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-sky-400">{formatCurrency(0)}</div>
              <p className="text-xs text-muted-foreground">Gastado en reparaciones</p>
            </CardContent>
          </Card>
        </div>
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center text-muted-foreground">
          <Banknote className="mb-3 h-14 w-14 opacity-40" />
          <p className="max-w-md text-sm">
            No hay ítems agregados. Agrega ítems en Interior o Exterior para ver el control de
            presupuesto.
          </p>
        </div>
      </div>
    );
  }

  const intPct = totalEstimated > 0 ? Math.round((interiorEstimated / totalEstimated) * 100) : 0;
  const extPct = totalEstimated > 0 ? Math.round((exteriorEstimated / totalEstimated) * 100) : 0;

  return (
    <div className="space-y-6">
      <Card className="border-primary/20">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="text-center">
              <div className="text-lg font-bold text-primary">{formatCurrency(deal)}</div>
              <p className="text-[11px] text-muted-foreground">Presupuesto original (Deal)</p>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-amber-500">{formatCurrency(totalEstimated)}</div>
              <p className="text-[11px] text-muted-foreground">Presupuesto detallado (PM)</p>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-sky-400">{formatCurrency(totalActual)}</div>
              <p className="text-[11px] text-muted-foreground">Gasto real acumulado</p>
            </div>
            <div className="text-center">
              <div
                className={`text-lg font-bold ${deal - totalActual >= 0 ? "text-emerald-400" : "text-red-400"}`}
              >
                {formatCurrency(deal - totalActual)}
              </div>
              <p className="text-[11px] text-muted-foreground">Restante del Deal</p>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <p className="text-xs text-muted-foreground">
              PM vs Deal: {pctEstVsDeal}% estimado · Gastado vs Deal: {pctActVsDeal}%
            </p>
            <div className="flex h-7 w-full overflow-hidden rounded-md bg-muted">
              <div
                className="flex items-center justify-center bg-amber-500/90 text-[10px] font-medium text-black"
                style={{ width: `${pctEstVsDeal}%`, minWidth: pctEstVsDeal > 0 ? "2rem" : 0 }}
                title="Presupuesto PM"
              >
                {pctEstVsDeal > 12 ? `${pctEstVsDeal}%` : ""}
              </div>
              <div
                className="flex items-center justify-center bg-sky-500/90 text-[10px] font-medium text-black"
                style={{ width: `${pctActVsDeal}%`, minWidth: pctActVsDeal > 0 ? "2rem" : 0 }}
                title="Gastado"
              >
                {pctActVsDeal > 12 ? `${pctActVsDeal}%` : ""}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-primary">
              Distribución por categoría
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-center text-sm">
              <div>
                <div className="font-bold text-amber-500">{formatCurrency(interiorEstimated)}</div>
                <p className="text-[11px] text-muted-foreground">
                  Interior ({interiorItems.length} ítems)
                </p>
              </div>
              <div>
                <div className="font-bold text-sky-400">{formatCurrency(exteriorEstimated)}</div>
                <p className="text-[11px] text-muted-foreground">
                  Exterior ({exteriorItems.length} ítems)
                </p>
              </div>
            </div>
            <div className="flex h-5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="bg-amber-500/90 transition-all"
                style={{ width: `${intPct}%` }}
                title={`Interior ${intPct}%`}
              />
              <div
                className="bg-sky-500/90 transition-all"
                style={{ width: `${extPct}%` }}
                title={`Exterior ${extPct}%`}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-primary">Desglose de costos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 text-center text-sm sm:grid-cols-4">
              <div>
                <div className="font-bold text-blue-400">{formatCurrency(totalMaterials)}</div>
                <p className="text-[11px] text-muted-foreground">Materiales</p>
              </div>
              <div>
                <div className="font-bold text-emerald-400">{formatCurrency(totalLabor)}</div>
                <p className="text-[11px] text-muted-foreground">Mano de obra</p>
              </div>
              <div>
                <div className="font-bold text-muted-foreground">{formatCurrency(totalOther)}</div>
                <p className="text-[11px] text-muted-foreground">Otros</p>
              </div>
              <div>
                <div className="font-bold text-amber-400">{formatCurrency(totalMarkup)}</div>
                <p className="text-[11px] text-muted-foreground">Margen / otros</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-primary">Presupuesto por área</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Área</TableHead>
                <TableHead className="text-center">Ítems</TableHead>
                <TableHead className="text-right">Presupuesto</TableHead>
                <TableHead className="text-right">Actual</TableHead>
                <TableHead className="text-right">Diferencia</TableHead>
                <TableHead className="text-center">% Hecho</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-[70px] text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {areaEntries.map(([area, d]) => {
                const difference = d.estimated - d.actual;
                const percentComplete =
                  d.estimated > 0 ? Math.round((d.actual / d.estimated) * 100) : 0;
                const done = percentComplete >= 100;
                const mid = percentComplete >= 50;
                return (
                  <TableRow key={area}>
                    <TableCell className="font-medium">{area}</TableCell>
                    <TableCell className="text-center">{d.count}</TableCell>
                    <TableCell className="text-right tabular-nums text-primary">
                      {formatCurrency(d.estimated)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-amber-500">
                      {formatCurrency(d.actual)}
                    </TableCell>
                    <TableCell
                      className={`text-right tabular-nums ${difference >= 0 ? "text-emerald-500" : "text-red-400"}`}
                    >
                      {formatCurrency(difference)}
                    </TableCell>
                    <TableCell className="w-[120px]">
                      <div className="flex flex-col items-center gap-0.5">
                        <Progress
                          value={Math.min(100, percentComplete)}
                          className="h-2 w-full max-w-[100px]"
                        />
                        <span className="text-[10px] text-muted-foreground">{percentComplete}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px]">
                        {done ? "✅ Completado" : mid ? "🔄 En progreso" : "📋 Planificado"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {d.items.length <= 1 ? (
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-amber-500 hover:text-amber-400"
                          onClick={() => d.items[0] && onEditItem(d.items[0])}
                          aria-label={`Editar ítem de ${area}`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      ) : (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-amber-500 hover:text-amber-400"
                              aria-label={`Elegir ítem a editar de ${area}`}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="max-w-[280px]">
                            {d.items.map((it) => (
                              <DropdownMenuItem key={it.id} onSelect={() => onEditItem(it)}>
                                <span className="truncate">{it.description || it.workType || "—"}</span>
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
            <TableFooter>
              <TableRow className="border-t border-primary/30 bg-muted/30 font-semibold">
                <TableCell>TOTAL</TableCell>
                <TableCell className="text-center">{items.length}</TableCell>
                <TableCell className="text-right tabular-nums text-primary">
                  {formatCurrency(totalEstimated)}
                </TableCell>
                <TableCell className="text-right tabular-nums text-amber-500">
                  {formatCurrency(totalActual)}
                </TableCell>
                <TableCell
                  className={`text-right tabular-nums ${totalEstimated - totalActual >= 0 ? "text-emerald-500" : "text-red-400"}`}
                >
                  {formatCurrency(totalEstimated - totalActual)}
                </TableCell>
                <TableCell className="text-center">
                  {totalEstimated > 0 ? Math.round((totalActual / totalEstimated) * 100) : 0}%
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-[10px]">
                    {totalActual >= totalEstimated ? "✅ Dentro de ejecución" : "⚠️ En ejecución"}
                  </Badge>
                </TableCell>
                <TableCell />
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-primary">Análisis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 text-center text-sm">
              <div>
                <div className="font-bold text-sky-400">
                  {formatCurrency(totalEstimated / items.length)}
                </div>
                <p className="text-[11px] text-muted-foreground">Promedio por ítem</p>
              </div>
              <div>
                <div className="font-bold text-emerald-400">
                  {formatCurrency(totalEstimated / 90)}
                </div>
                <p className="text-[11px] text-muted-foreground">Promedio diario (90 días)</p>
              </div>
            </div>
            <hr className="my-3 border-border" />
            <div className="grid grid-cols-2 gap-3 text-center text-sm">
              <div>
                <div className="font-bold text-amber-500">
                  {totalEstimated > 0 ? Math.round((totalMaterials / totalEstimated) * 100) : 0}%
                </div>
                <p className="text-[11px] text-muted-foreground">% Materiales</p>
              </div>
              <div>
                <div className="font-bold text-blue-400">
                  {totalEstimated > 0 ? Math.round((totalLabor / totalEstimated) * 100) : 0}%
                </div>
                <p className="text-[11px] text-muted-foreground">% Mano de obra</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-primary">Alertas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {alerts.length === 0 ? (
              <div className="py-4 text-center text-emerald-500">
                <p className="font-medium">Presupuesto bajo control</p>
                <p className="text-xs text-muted-foreground">
                  Indicadores dentro de parámetros normales
                </p>
              </div>
            ) : (
              alerts.map((a, i) => (
                <div
                  key={i}
                  className={`rounded-md border px-3 py-2 text-sm ${alertClass[a.type]}`}
                >
                  <span className="mr-2">{a.icon}</span>
                  <span>{a.message}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
