import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Calculator,
  GraduationCap,
  Hammer,
  HandCoins,
  Home,
  RotateCcw,
  Save,
  ShoppingCart,
  Sparkles,
  Store,
  TrendingUp,
  Zap,
  Info,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { DealGauge } from "./components/DealGauge";
import {
  buildRoiScenarios,
  buildStudentAnalysis,
  computeUnderwriting,
  evaluateDeal,
  formatCurrency,
  formatPercentage,
  getDealStatusPresentation,
} from "./calculations";
import type { FixFlipLanguage, FixFlipProject, UnderwritingInputs } from "./types";
import { loadProjects, saveProjects, syncCloudProjects, saveCloudProject } from "./storage";
import { useAuth } from "@/contexts/AuthContext";
import { getProperties } from "@/lib/properties";
import { usePortalContent } from "@/lib/portalContent";

/** Campos numéricos del formulario (excl. texto y select). */
type NumericInputKey = Exclude<
  keyof UnderwritingInputs,
  "propertyAddress" | "interestType"
>;

const PERCENTAGE_KEYS = new Set<NumericInputKey>([
  "downPaymentPercent", "hmlPointsRate", "hmlInterestRate",
  "reCommissions", "profitMinPercent",
]);
function numericValueFromRaw(raw: string, key: NumericInputKey): number {
  const value = raw.trim().replace(/\s/g, "").replace(/[$%]/g, "");
  if (value === "" || value === "-" || value === "." || value === "-.") return 0;
  const comma = value.lastIndexOf(",");
  const dot = value.lastIndexOf(".");
  const isFractional = PERCENTAGE_KEYS.has(key);
  // For money, a single separator followed by exactly three digits
  // is a grouping separator: 1,234 or 1.234 both mean 1234.
  const grouping = !isFractional && ((comma >= 0 && dot < 0 &&
    /^-?\d{1,3}(,\d{3})+$/.test(value)) || (dot >= 0 && comma < 0 &&
    /^-?\d{1,3}(\.\d{3})+$/.test(value)));
  const normalized = grouping ? value.replace(/[,.]/g, "") :
    comma > dot ? value.replace(/\./g, "").replace(",", ".") :
    value.replace(/,/g, "");
  if (!/^-?\d*(?:\.\d*)?$/.test(normalized)) return NaN;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : NaN;
}

function HmlFieldLabel({ children }: { children: ReactNode }) {
  return (
    <Label className="text-[11px] font-semibold uppercase tracking-wide text-primary">
      {children}
    </Label>
  );
}

function HmlHelper({ children }: { children: ReactNode }) {
  return <p className="mt-1 text-xs leading-snug text-muted-foreground">{children}</p>;
}

function HmlReadonlyValue({ value }: { value: string }) {
  return (
    <div className="flex h-10 w-full items-center rounded-md border border-border bg-muted/50 px-3 text-sm tabular-nums">
      {value}
    </div>
  );
}

const emptyInputs = (): UnderwritingInputs => ({
  propertyAddress: "",
  projectMonths: 0,
  arv: 0,
  purchasePrice: 0,
  rehabBudget: 0,
  closingCosts: 0,
  holdingCosts: 0,
  cashOnHand: 0,
  downPaymentAmount: 0,
  downPaymentPercent: 0,
  hmlPointsRate: 0,
  hmlInterestRate: 0,
  interestType: "monthly",
  hmlAdminFees: 0,
  reCommissions: 0,
  resaleClosingCosts: 0,
  profitMinPercent: 0,
  profitMinAmount: 0,
});

function projectToInputs(p: FixFlipProject): UnderwritingInputs {
  return {
    propertyAddress: p.propertyAddress || "",
    projectMonths: p.projectMonths,
    arv: p.arv,
    purchasePrice: p.purchasePrice,
    rehabBudget: p.rehabBudget,
    closingCosts: p.closingCosts,
    holdingCosts: p.holdingCosts,
    cashOnHand: p.cashOnHand ?? 0,
    downPaymentAmount: p.downPaymentAmount,
    downPaymentPercent: p.downPaymentPercent,
    hmlPointsRate: p.hmlPointsRate,
    hmlInterestRate: p.hmlInterestRate,
    interestType: p.interestType === "annual" ? "annual" : "monthly",
    hmlAdminFees: p.hmlAdminFees,
    reCommissions: p.reCommissions,
    resaleClosingCosts: p.resaleClosingCosts,
    profitMinPercent: p.profitMinPercent,
    profitMinAmount: p.profitMinAmount,
  };
}

export default function FixFlipCalculatorPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { i18n, t } = useTranslation();
  const lang: FixFlipLanguage = i18n.language.startsWith("en") ? "en" : "es";
  const portal = usePortalContent("calculator", lang);
  const hmlI18n = useMemo(
    () =>
      lang === "es"
        ? {
            title: "Financiamiento HML",
            terms: "Términos de financiamiento",
            down$: "Enganche ($)",
            downHint:
              "Monto del enganche; el % sobre precio de compra se sincroniza automáticamente.",
            downPct: "% Enganche",
            cashAvailable: "Efectivo disponible ($)",
            cashAvailableHint: "Dinero propio disponible. Deja 0 si aún no lo conoces.",
            downPctHint:
              "Porcentaje sobre precio de compra; el monto se sincroniza si editas el %.",
            loanAmt: "Monto préstamo HML",
            loanAmtHint:
              "Calculado automáticamente (precio de compra − enganche).",
            loanPct: "% Préstamo HML",
            loanPctHint:
              "Calculado automáticamente sobre precio de compra.",
            points: "Puntos HML %",
            pointsHint: "Puntos del préstamo HML.",
            rate: "Tasa de interés",
            rateHint: "Tasa de interés anual (nominal).",
            intType: "Pago de intereses",
            intTypeHint: "La tasa indicada es ANUAL. Estimación de interés simple, sin amortización.",
            intMonthly: "Mensual",
            intAnnual: "Anual",
            fees: "Gastos administrativos HML",
            feesHint: "Honorarios administrativos del prestamista.",
            ltv: "LTV HML (ARV)",
            ltvHint: "Préstamo HML ÷ ARV × 100.",
            calc: "Costos calculados",
            intTot: "Interés HML total",
            intTotHint: "Interés total estimado del préstamo.",
            feesTot: "Costos financieros HML",
            feesTotHint: "Puntos + interés + administrativos.",
          }
        : {
            title: "HML financing",
            terms: "Financing terms",
            down$: "Down payment",
            downHint:
              "Down payment amount (% is calculated automatically over purchase price).",
            downPct: "% Down payment",
            cashAvailable: "Available cash ($)",
            cashAvailableHint: "Your available funds. Enter 0 if not known yet.",
            downPctHint:
              "Percent of purchase price; amount stays in sync when you edit %.",
            loanAmt: "HML loan amount",
            loanAmtHint:
              "Automatically calculated (purchase price − down payment).",
            loanPct: "% HML loan",
            loanPctHint: "Automatically calculated over purchase price.",
            points: "HML points %",
            pointsHint: "HML loan points.",
            rate: "HML interest rate",
            rateHint: "Annual interest rate.",
            intType: "Interest payment timing",
            intTypeHint: "The rate above is ANNUAL. Interest-only estimate, without amortization.",
            intMonthly: "Monthly",
            intAnnual: "Annual",
            fees: "HML admin fees",
            feesHint: "HML administrative fees.",
            ltv: "HML LTV (ARV)",
            ltvHint: "HML loan ÷ ARV × 100.",
            calc: "Calculated costs",
            intTot: "HML total interest",
            intTotHint: "Total loan interest.",
            feesTot: "HML total fees",
            feesTotHint: "Points + interest + admin.",
          },
    [lang],
  );
  const saleI18n = useMemo(
    () =>
      lang === "es"
        ? {
            title: "Costos de venta",
            reComm: "Comisiones inmobiliarias %",
            reCommHint: "Porcentaje de comisión sobre el ARV al vender.",
            resaleClose: "Cierre al revender ($)",
            resaleCloseHint:
              "Costos de cierre estimados al vender la propiedad.",
            calc: "Costos calculados",
            cardComm: "Comisiones por venta",
            cardCommHint: "Comisiones calculadas (ARV × %).",
            cardTot: "Costo total de venta",
            cardTotHint: "Comisiones más cierre al vender.",
            cardNet: "Precio neto de venta",
            cardNetHint: "ARV menos costos de venta.",
          }
        : {
            title: "Selling costs",
            reComm: "RE commissions %",
            reCommHint: "Real estate agent commissions (percent of ARV).",
            resaleClose: "Resale closing costs ($)",
            resaleCloseHint: "Estimated closing costs when you sell.",
            calc: "Calculated costs",
            cardComm: "Resale commissions",
            cardCommHint: "Calculated commissions (ARV × %).",
            cardTot: "Total selling costs",
            cardTotHint: "Commissions plus resale closing.",
            cardNet: "Net sale price",
            cardNetHint: "ARV minus selling costs.",
          },
    [lang],
  );
  const execI18n = useMemo(
    () =>
      lang === "es"
        ? {
            title: "Resumen ejecutivo",
            score: "Puntuación",
            estado: "Estado",
            confianza: "Confianza",
            tpc: "TPC + financiamiento",
            net: "Ganancia neta",
            roi: "ROI",
            coc: "Rentabilidad sobre efectivo",
            step1: "Paso 1 · Inviertes",
            step1Hint: "Precio de compra inicial.",
            step2: "Paso 2 · Arreglas",
            step2Hint: "Presupuesto de remodelación.",
            step3: "Paso 3 · Vendes",
            step3Hint: "Venta neta después de costos.",
            step4: "Paso 4 · Resultado",
            signal: "Señal rápida",
            minRoi: "ROI mínimo",
            minProfit: "Ganancia mínima",
            kpiBe: "ARV de equilibrio",
            kpiBeHint: "ARV mínimo para no perder.",
            kpiMargin: "Margen de seguridad",
            kpiMarginHint: "Cuánto puede bajar el ARV.",
            kpiMo: "Utilidad mensual",
            why: "Por qué este resultado",
            invVsArv: "Inversión / ARV",
          }
        : {
            title: "Executive summary",
            score: "Score",
            estado: "Status",
            confianza: "Confidence",
            tpc: "TPC + financing",
            net: "Net profit",
            roi: "ROI",
            coc: "Cash on cash",
            step1: "Step 1 · You buy",
            step1Hint: "Initial purchase price.",
            step2: "Step 2 · You fix",
            step2Hint: "Renovation (rehab) budget.",
            step3: "Step 3 · You sell",
            step3Hint: "Net proceeds after selling costs.",
            step4: "Step 4 · Outcome",
            signal: "Quick read",
            minRoi: "Min ROI",
            minProfit: "Min profit",
            kpiBe: "Break-even ARV",
            kpiBeHint: "Minimum ARV to break even.",
            kpiMargin: "Safety margin",
            kpiMarginHint: "How far ARV can fall before loss.",
            kpiMo: "Profit per month",
            why: "Why this result",
            invVsArv: "Invested / ARV",
          },
    [lang],
  );
  const [searchParams, setSearchParams] = useSearchParams();
  const [inputs, setInputs] = useState<UnderwritingInputs>(emptyInputs);
  /** Texto mientras el usuario edita; permite campo vacío y decimales a medias. */
  const [numDrafts, setNumDrafts] = useState<Partial<Record<NumericInputKey, string>>>(
    {},
  );
  const [lastField, setLastField] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [projects, setProjects] = useState<FixFlipProject[]>(() => []);
  const [cloudHydrated, setCloudHydrated] = useState(false);
  useEffect(() => {
    if (!user?.id) return;
    let active = true;
    setProjects(loadProjects(user.id));
    setCloudHydrated(false);
    syncCloudProjects(user.id).then(all => { if (active) setProjects(all); })
      .catch(() => { /* Browser copy remains available offline. */ })
      .finally(() => { if (active) setCloudHydrated(true); });
    return () => { active = false; };
  }, [user?.id]);

  const [selectedInventoryId, setSelectedInventoryId] = useState<string | null>(null);
  const [inventoryProperties, setInventoryProperties] = useState<Array<{
    id: string; address: string; city: string; state: string;
    price: number; arv: number | null; rehab_cost: number | null; status: string;
    bedrooms: number; bathrooms: number; property_type?: string;
  }>>([]);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [inventoryError, setInventoryError] = useState<string | null>(null);
  const [propertySearch, setPropertySearch] = useState("");

  useEffect(() => {
    let active = true;
    getProperties().then(({ data, error }) => {
      if (!active) return;
      setInventoryLoading(false);
      if (error) { setInventoryError(error); return; }
      setInventoryProperties((data ?? []).map((p) => ({
        id: p.id, address: p.address, city: p.city, state: p.state,
        price: Number(p.price) || 0,
        arv: p.arv == null ? null : Number(p.arv),
        rehab_cost: p.rehab_cost == null ? null : Number(p.rehab_cost),
        status: p.status,
        bedrooms: Number(p.bedrooms) || 0,
        bathrooms: Number(p.bathrooms) || 0,
        property_type: p.property_type,
      })));
    }).catch((error: unknown) => {
      if (!active) return;
      setInventoryLoading(false);
      setInventoryError(error instanceof Error ? error.message : String(error));
    });
    return () => { active = false; };
  }, []);

  const selectInventoryProperty = (id: string) => {
    const p = inventoryProperties.find((property) => property.id === id);
    if (!p) return;
    setSelectedInventoryId(id);
    setInputs((prev) => ({
      ...prev,
      propertyAddress: [p.address, p.city, p.state].filter(Boolean).join(", "),
      purchasePrice: p.price,
      arv: p.arv ?? 0,
      rehabBudget: p.rehab_cost ?? 0,
      downPaymentAmount: 0,
      downPaymentPercent: 0,
    }));
    setNumDrafts({});
    setLastField(null);
    setEditingId(null);
    setPropertySearch("");
    toast.success(lang === "es" ? "Propiedad cargada desde Inventory. Revisa los datos antes de guardar." : "Property loaded from Inventory. Review the figures before saving.");
  };

  const editId = searchParams.get("edit");
  useEffect(() => {
    if (!editId) return;
    const id = Number(editId);
    if (!Number.isFinite(id)) return;
    const list = loadProjects(user?.id);
    const p = list.find((x) => x.id === id);
    if (!p && !cloudHydrated) return;
    if (p) {
      setInputs(projectToInputs(p));
      setNumDrafts({});
      setEditingId(id);
      setSelectedInventoryId(p.inventoryPropertyId ?? null);
      toast.info(lang === "es" ? `Editando análisis` : `Editing analysis`);
    }
    setSearchParams({}, { replace: true });
  }, [editId, lang, setSearchParams, user?.id, projects, cloudHydrated]);

  const calculation = useMemo(
    () =>
      computeUnderwriting(inputs, {
        lastModifiedField: lastField,
        projectCount: projects.length,
      }),
    [inputs, lastField, projects.length],
  );

  const evaluation = useMemo(
    () => evaluateDeal(calculation, lang),
    [calculation, lang],
  );

  const statusPresentation = useMemo(
    () => getDealStatusPresentation(evaluation, calculation.dealDecision, lang),
    [evaluation, calculation.dealDecision, lang],
  );

  const scenarios = useMemo(
    () => buildRoiScenarios(calculation, lang),
    [calculation, lang],
  );

  const student = useMemo(
    () => buildStudentAnalysis(calculation, evaluation, lang),
    [calculation, evaluation, lang],
  );

  const setNum = useCallback((key: NumericInputKey, v: number) => {
    setInputs((prev) => ({ ...prev, [key]: v }));
  }, []);

  const handleNumChange = useCallback(
    (key: NumericInputKey, raw: string) => {
      const nextVal = numericValueFromRaw(raw, key);
      setNumDrafts((d) => ({ ...d, [key]: raw }));
      // Keep the user's draft visible without propagating an invalid number into financial formulas.
      if (!Number.isFinite(nextVal)) return;
      setInputs((prev) => {
        const next = { ...prev, [key]: nextVal } as UnderwritingInputs;
        const purchase = key === "purchasePrice" ? nextVal : Number(prev.purchasePrice) || 0;

        // Legacy behavior: down payment amount and percent stay in sync.
        if (key === "downPaymentAmount") {
          next.downPaymentPercent =
            purchase > 0 ? (nextVal / purchase) * 100 : 0;
          return next;
        }
        if (key === "downPaymentPercent") {
          next.downPaymentAmount =
            purchase > 0 ? (purchase * nextVal) / 100 : 0;
          return next;
        }
        if (key === "purchasePrice" && purchase > 0) {
          if (lastField === "down-payment-percent" || lastField === "downPaymentPercent") {
            next.downPaymentAmount =
              (purchase * (Number(prev.downPaymentPercent) || 0)) / 100;
          } else {
            next.downPaymentPercent =
              ((Number(prev.downPaymentAmount) || 0) / purchase) * 100;
          }
          return next;
        }
        return next;
      });
    },
    [lastField],
  );

  const handleNumBlur = useCallback((key: NumericInputKey) => {
    setNumDrafts((d) => {
      const next = { ...d };
      delete next[key];
      return next;
    });
  }, []);

  const numInputProps = useCallback(
    (key: NumericInputKey) => ({
      type: "text" as const,
      inputMode: "decimal" as const,
      autoComplete: "off" as const,
      value: numDrafts[key] ?? (key === "projectMonths"
        ? String(Math.round(Number(inputs[key]) || 0))
        : (Number(inputs[key]) || 0).toFixed(2)),
      onChange: (e: { target: { value: string } }) =>
        handleNumChange(key, e.target.value),
      onBlur: () => handleNumBlur(key),
    }),
    [numDrafts, inputs, handleNumChange, handleNumBlur],
  );

  const handleSave = () => {
    if (calculation.purchasePrice <= 0 || calculation.arv <= 0 || calculation.projectMonths <= 0) {
      toast.error(lang === "es"
        ? "Completa precio de compra, ARV y duración antes de guardar."
        : "Enter purchase price, ARV, and project duration before saving.");
      return;
    }
    const list = loadProjects(user?.id);
    const id = editingId ?? Date.now();
    const existing = list.find((p) => p.id === id);
    const saved: FixFlipProject = {
      ...calculation,
      id,
      projectName: existing?.projectName ?? (inputs.propertyAddress.trim() || calculation.projectName),
      inventoryPropertyId: selectedInventoryId ?? existing?.inventoryPropertyId,
      inventorySnapshot: selectedInventoryId
        ? (() => {
            const p = inventoryProperties.find((p) => p.id === selectedInventoryId);
            return p ? { bedrooms: p.bedrooms, bathrooms: p.bathrooms, propertyType: p.property_type } : existing?.inventorySnapshot;
          })()
        : existing?.inventorySnapshot,
      date: new Date().toISOString(),
    };
    const idx = list.findIndex((p) => p.id === id);
    if (idx >= 0) list[idx] = saved;
    else list.push(saved);
    saveProjects(list, user?.id);
    setProjects(list);
    if (user?.id) void saveCloudProject(saved, user.id).catch(() =>
      toast.error(lang === "es" ? "Guardado local. No se pudo sincronizar con la nube." :
        "Saved locally. Cloud synchronization failed."));
    setEditingId(null);
    toast.success(lang === "es" ? "Análisis guardado" : "Analysis saved");
  };

  const handleReset = () => {
    setInputs(emptyInputs());
    setNumDrafts({});
    setEditingId(null);
    setLastField(null);
    setSelectedInventoryId(null);
    toast.message(lang === "es" ? "Formulario reiniciado" : "Form reset");
  };

  const num = (
    key: NumericInputKey,
    label: string,
    _step = 1,
    helper?: ReactNode,
  ) => (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {label}
        {/ARV|ROI|HML|LTV|LTC/i.test(label) && (
          <Tooltip delayDuration={100}>
            <TooltipTrigger type="button" className="inline-flex rounded-full text-muted-foreground hover:text-primary" aria-label={lang === "es" ? "Información del campo" : "Field information"}>
              <Info className="h-3.5 w-3.5" />
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[260px] text-xs leading-relaxed">
              {/ARV/i.test(label)
                ? (lang === "es" ? "Valor estimado de venta después de remodelar." : "Estimated resale value after renovations.")
                : /ROI/i.test(label)
                  ? (lang === "es" ? "Rentabilidad sobre el costo total del proyecto." : "Return relative to total project costs.")
                  : /LTV|LTC/i.test(label)
                    ? (lang === "es" ? "Porcentaje del préstamo respecto al valor o costo." : "Loan percentage relative to property value or cost.")
                    : (lang === "es" ? "Préstamo privado para financiar la operación." : "Private loan used to finance the investment.")}
            </TooltipContent>
          </Tooltip>
        )}
      </Label>
      <Input
        {...numInputProps(key)}
        onFocus={() => setLastField(String(key))}
        className="bg-background"
      />
      {helper ? <p className="text-[11px] text-muted-foreground">{helper}</p> : null}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-[Montserrat] text-2xl font-bold flex items-center gap-2">
            <Calculator className="h-7 w-7 text-primary" />
            {portal("title", lang === "es" ? "Calculadora Fix & Flip" : "Fix & Flip Calculator")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {portal("subtitle", lang === "es"
              ? "Paso 1: análisis de inversión"
              : "Step 1: investment analysis")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-1" />
            {lang === "es" ? "Reiniciar" : "Reset"}
          </Button>
          <Button size="sm" className="gold-gradient text-primary-foreground" onClick={handleSave}>
            <Save className="h-4 w-4 mr-1" />
            {lang === "es" ? "Guardar análisis" : "Save Analysis"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card className="border-border/80 bg-card/90">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-[Montserrat]">
                {lang === "es" ? "Datos del proyecto" : "Project inputs"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <section className="space-y-3 rounded-lg border border-border/60 p-4">
                <h3 className="text-sm font-semibold text-primary">
                  {lang === "es" ? "Propiedad" : "Property"}
                </h3>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    {lang === "es" ? "Dirección" : "Address"}
                  </Label>
                  <Input
                    value={inputs.propertyAddress}
                    onChange={(e) => {
                      setSelectedInventoryId(null);
                      setInputs((p) => ({ ...p, propertyAddress: e.target.value }));
                    }}
                    placeholder={lang === "es" ? "Escribe una dirección nueva" : "Enter a new address"}
                    className="bg-background"
                  />
                  <div className="mt-3 space-y-2 rounded-md border border-border/70 p-3">
                    <Label className="text-xs font-semibold">
                      {lang === "es" ? "Cargar propiedad desde Inventory" : "Load property from Inventory"}
                    </Label>
                    <Input
                      value={propertySearch}
                      onChange={(e) => setPropertySearch(e.target.value)}
                      placeholder={lang === "es" ? "Buscar dirección o ciudad..." : "Search address or city..."}
                      className="bg-background"
                    />
                    <Select value="" onValueChange={selectInventoryProperty}>
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder={lang === "es" ? "Seleccionar propiedad existente" : "Select existing property"} />
                      </SelectTrigger>
                      <SelectContent>
                        {inventoryProperties
                          .filter((p) => (p.address + " " + p.city + " " + p.state).toLowerCase().includes(propertySearch.toLowerCase()))
                          .map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.address}, {p.city} · {formatCurrency(p.price)} · {p.status === 'available'
                                ? t('properties.list.status.available')
                                : p.status === 'on_sale'
                                  ? t('properties.list.status.onSale')
                                  : p.status === 'sold'
                                    ? t('properties.list.status.sold')
                                    : p.status}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    {inventoryLoading && <p className="text-xs text-muted-foreground">{lang === "es" ? "Cargando propiedades..." : "Loading properties..."}</p>}
                    {inventoryError && <p className="text-xs text-destructive">{t('uiFixes.propertyLoadFailed')}</p>}
                    <p className="text-xs text-muted-foreground">
                      {lang === "es"
                        ? inventoryProperties.length + " propiedades cargadas. Selecciona una para completar precio, ARV y rehab, o escribe una dirección nueva arriba."
                        : inventoryProperties.length + " properties loaded. Select one to fill price, ARV and rehab, or enter a new address above."}
                    </p>
                  </div>
                </div>
                {num("projectMonths", lang === "es" ? "Meses del proyecto" : "Project months")}
              </section>

              <section className="space-y-3 rounded-lg border border-border/60 p-4">
                <h3 className="text-sm font-semibold text-primary">
                  {lang === "es" ? "Rentabilidad objetivo" : "Profit targets"}
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {num("arv", "ARV")}
                  {num("profitMinPercent", lang === "es" ? "ROI mínimo %" : "Min ROI %", 0.5)}
                  {num(
                    "profitMinAmount",
                    lang === "es" ? "Ganancia mínima $" : "Min profit $",
                    1000,
                  )}
                </div>
              </section>

              <section className="space-y-3 rounded-lg border border-border/60 p-4">
                <h3 className="text-sm font-semibold text-primary">
                  {lang === "es" ? "Costos del proyecto" : "Project costs"}
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {num(
                    "purchasePrice",
                    lang === "es" ? "Precio compra" : "Purchase price",
                    1000,
                    lang === "es"
                      ? "Valor de compra de la propiedad."
                      : "Property acquisition price.",
                  )}
                  {num(
                    "rehabBudget",
                    lang === "es" ? "Remodelación" : "Renovation",
                    1000,
                    lang === "es"
                      ? "Presupuesto estimado de remodelación."
                      : "Estimated renovation budget.",
                  )}
                  {num(
                    "closingCosts",
                    lang === "es" ? "Cierre compra" : "Closing",
                    100,
                    lang === "es"
                      ? "Costos de cierre al comprar."
                      : "Closing costs at purchase.",
                  )}
                  {num(
                    "holdingCosts",
                    lang === "es" ? "Mantenimiento / mes" : "Holding costs / month",
                    100,
                    lang === "es"
                      ? "Gasto mensual de mantenimiento/holding."
                      : "Monthly holding cost.",
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {lang === "es" ? "Costo total proyecto:" : "Total project cost:"}{" "}
                  <span className="font-semibold text-foreground">
                    {formatCurrency(calculation.totalProjectCosts)}
                  </span>
                </p>
              </section>

              <section className="space-y-4 rounded-lg border border-border/60 p-4">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-primary">
                    {hmlI18n.title}
                  </h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">{hmlI18n.terms}</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-1.5">
                    <HmlFieldLabel>{hmlI18n.cashAvailable}</HmlFieldLabel>
                    <Input {...numInputProps("cashOnHand")} onFocus={() => setLastField("cashOnHand")} />
                    <HmlHelper>{hmlI18n.cashAvailableHint}</HmlHelper>
                  </div>
                  <div className="space-y-1">
                    <HmlFieldLabel>{hmlI18n.down$}</HmlFieldLabel>
                    <Input
                      {...numInputProps("downPaymentAmount")}
                      onFocus={() => setLastField("down-payment-amount")}
                      className="bg-background"
                    />
                    <HmlHelper>{hmlI18n.downHint}</HmlHelper>
                  </div>
                  <div className="space-y-1.5">
                    <HmlFieldLabel>{hmlI18n.downPct}</HmlFieldLabel>
                    <Input
                      {...numInputProps("downPaymentPercent")}
                      onFocus={() => setLastField("down-payment-percent")}
                      className="bg-background"
                    />
                    <HmlHelper>{hmlI18n.downPctHint}</HmlHelper>
                  </div>
                  <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
                    <HmlFieldLabel>{hmlI18n.loanAmt}</HmlFieldLabel>
                    <HmlReadonlyValue
                      value={formatCurrency(calculation.hmlLoanAmount)}
                    />
                    <HmlHelper>{hmlI18n.loanAmtHint}</HmlHelper>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-1.5">
                    <HmlFieldLabel>{hmlI18n.loanPct}</HmlFieldLabel>
                    <HmlReadonlyValue
                      value={formatPercentage(calculation.hmlLoanPercent, 1)}
                    />
                    <HmlHelper>{hmlI18n.loanPctHint}</HmlHelper>
                  </div>
                  <div className="space-y-1.5">
                    <HmlFieldLabel>{hmlI18n.points}</HmlFieldLabel>
                    <Input
                      {...numInputProps("hmlPointsRate")}
                      onFocus={() => setLastField("hmlPointsRate")}
                      className="bg-background"
                    />
                    <HmlHelper>{hmlI18n.pointsHint}</HmlHelper>
                  </div>
                  <div className="space-y-1.5">
                    <HmlFieldLabel>{hmlI18n.rate}</HmlFieldLabel>
                    <Input
                      {...numInputProps("hmlInterestRate")}
                      onFocus={() => setLastField("hmlInterestRate")}
                      className="bg-background"
                    />
                    <HmlHelper>{hmlI18n.rateHint}</HmlHelper>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <HmlFieldLabel>{hmlI18n.intType}</HmlFieldLabel>
                    <Select
                      value={inputs.interestType}
                      onValueChange={(v: "monthly" | "annual") =>
                        setInputs((p) => ({ ...p, interestType: v }))
                      }
                    >
                      <SelectTrigger className="bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">{hmlI18n.intMonthly}</SelectItem>
                        <SelectItem value="annual">{hmlI18n.intAnnual}</SelectItem>
                      </SelectContent>
                    </Select>
                    <HmlHelper>{hmlI18n.intTypeHint}</HmlHelper>
                  </div>
                  <div className="space-y-1.5">
                    <HmlFieldLabel>{hmlI18n.fees}</HmlFieldLabel>
                    <Input
                      {...numInputProps("hmlAdminFees")}
                      onFocus={() => setLastField("hmlAdminFees")}
                      className="bg-background"
                    />
                    <HmlHelper>{hmlI18n.feesHint}</HmlHelper>
                  </div>
                </div>

                <div className="rounded-lg border border-primary/40 bg-primary/5 p-4">
                  <HmlFieldLabel>{hmlI18n.ltv}</HmlFieldLabel>
                  <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight">
                    {calculation.arv > 0
                      ? formatPercentage(
                          (calculation.hmlLoanAmount / calculation.arv) * 100,
                          2,
                        )
                      : "0.00%"}
                  </p>
                  <HmlHelper>{hmlI18n.ltvHint}</HmlHelper>
                </div>

                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-emerald-500">
                    {hmlI18n.calc}
                  </h4>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-border/80 bg-card/80 p-3">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {hmlI18n.intTot}
                      </div>
                      <div className="mt-1 text-lg font-bold tabular-nums">
                        {formatCurrency(calculation.hmlTotalInterest)}
                      </div>
                      <HmlHelper>{hmlI18n.intTotHint}</HmlHelper>
                    </div>
                    <div className="rounded-lg border border-border/80 bg-card/80 p-3">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {hmlI18n.feesTot}
                      </div>
                      <div className="mt-1 text-lg font-bold tabular-nums">
                        {formatCurrency(calculation.hmlTotalFees)}
                      </div>
                      <HmlHelper>{hmlI18n.feesTotHint}</HmlHelper>
                    </div>
                  </div>
                </div>
              </section>

              <section className="space-y-4 rounded-lg border border-border/60 p-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-primary">
                  <ShoppingCart className="h-4 w-4 shrink-0" aria-hidden />
                  {saleI18n.title}
                </h3>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <HmlFieldLabel>{saleI18n.reComm}</HmlFieldLabel>
                    <div className="relative">
                      <Input
                        {...numInputProps("reCommissions")}
                        onFocus={() => setLastField("reCommissions")}
                        className={cn("bg-background pr-10 tabular-nums")}
                      />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        %
                      </span>
                    </div>
                    <HmlHelper>{saleI18n.reCommHint}</HmlHelper>
                  </div>
                  <div className="space-y-1.5">
                    <HmlFieldLabel>{saleI18n.resaleClose}</HmlFieldLabel>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        $
                      </span>
                      <Input
                        {...numInputProps("resaleClosingCosts")}
                        onFocus={() => setLastField("resaleClosingCosts")}
                        className={cn("bg-background pl-8 tabular-nums")}
                      />
                    </div>
                    <HmlHelper>{saleI18n.resaleCloseHint}</HmlHelper>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-emerald-500">
                    {saleI18n.calc}
                  </h4>
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="rounded-lg border border-border/80 bg-card/80 p-3">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {saleI18n.cardComm}
                      </div>
                      <div className="mt-1 text-lg font-bold tabular-nums">
                        {formatCurrency(calculation.resaleCommissions)}
                      </div>
                      <HmlHelper>{saleI18n.cardCommHint}</HmlHelper>
                    </div>
                    <div className="rounded-lg border border-border/80 bg-card/80 p-3">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {saleI18n.cardTot}
                      </div>
                      <div className="mt-1 text-lg font-bold tabular-nums">
                        {formatCurrency(calculation.totalSellingCosts)}
                      </div>
                      <HmlHelper>{saleI18n.cardTotHint}</HmlHelper>
                    </div>
                    <div className="rounded-lg border border-border/80 bg-card/80 p-3 sm:col-span-2 lg:col-span-1">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {saleI18n.cardNet}
                      </div>
                      <div className="mt-1 text-lg font-bold tabular-nums text-primary">
                        {formatCurrency(calculation.netSalePrice)}
                      </div>
                      <HmlHelper>{saleI18n.cardNetHint}</HmlHelper>
                    </div>
                  </div>
                </div>
              </section>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-primary/30 bg-gradient-to-br from-amber-500/[0.07] via-card to-emerald-500/[0.10] shadow-lg shadow-amber-500/[0.08]">
            <CardHeader className="space-y-1 border-b border-primary/15 bg-gradient-to-r from-primary/15 via-transparent to-emerald-500/10 pb-4">
              <CardTitle className="flex items-center gap-2 font-[Montserrat] text-lg text-primary">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary shadow-inner">
                  <GraduationCap className="h-5 w-5" aria-hidden />
                </span>
                {execI18n.title}
                <Sparkles
                  className="ml-auto h-5 w-5 text-amber-400 opacity-90"
                  aria-hidden
                />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 pt-5 text-sm">
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <div className="rounded-xl border border-white/10 bg-card/80 p-3 shadow-sm backdrop-blur-sm">
                  <div className="flex items-center justify-between gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {execI18n.tpc}
                    <TrendingUp className="h-3.5 w-3.5 text-sky-400" aria-hidden />
                  </div>
                  <div className="mt-1 text-base font-bold tabular-nums text-foreground">
                    {formatCurrency(calculation.tpcPlusCost)}
                  </div>
                </div>
                <div className="rounded-xl border border-amber-400/35 bg-gradient-to-br from-amber-500/20 to-yellow-500/10 p-3 shadow-md shadow-amber-500/10">
                  <div className="flex items-center justify-between gap-1 text-[10px] font-semibold uppercase tracking-wide text-amber-200/90">
                    {execI18n.net}
                    <HandCoins className="h-3.5 w-3.5 text-amber-300" aria-hidden />
                  </div>
                  <div
                    className={cn(
                      "mt-1 text-base font-bold tabular-nums",
                      calculation.profit >= 0
                        ? "text-yellow-300 drop-shadow-[0_0_14px_rgba(250,204,21,0.35)]"
                        : "text-red-400",
                    )}
                  >
                    {formatCurrency(calculation.profit)}
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-card/80 p-3 shadow-sm backdrop-blur-sm">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {execI18n.roi}
                  </div>
                  <div className="mt-1 text-base font-bold tabular-nums text-foreground">
                    {formatPercentage(calculation.roi)}
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-card/80 p-3 shadow-sm backdrop-blur-sm">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {execI18n.coc}
                  </div>
                  <div className="mt-1 text-base font-bold tabular-nums text-emerald-300">
                    {formatPercentage(calculation.cashOnCash)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-border/70 bg-card/70 p-3">
                  <p className="text-xs text-muted-foreground">{lang === "es" ? "Efectivo necesario (estimado)" : "Estimated required cash"}</p>
                  <p className="mt-1 text-lg font-bold tabular-nums">{formatCurrency(calculation.capitalRequired)}</p>
                </div>
                <div className="rounded-xl border border-border/70 bg-card/70 p-3">
                  <p className="text-xs text-muted-foreground">{lang === "es" ? "Efectivo estimado al cierre" : "Estimated cash to close"}</p>
                  <p className="mt-1 text-lg font-bold tabular-nums">{formatCurrency(calculation.cashToClose ?? 0)}</p>
                </div>
                <div className="rounded-xl border border-border/70 bg-card/70 p-3">
                  <p className="text-xs text-muted-foreground">{lang === "es" ? "Diferencia de liquidez" : "Cash shortfall"}</p>
                  <p className="mt-1 text-lg font-bold tabular-nums">{(calculation.cashOnHand ?? 0) > 0
                    ? formatCurrency(calculation.liquidityShortfall ?? 0)
                    : (lang === "es" ? "Sin verificar" : "Not provided")}</p>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">{lang === "es"
                ? "Estimación: el préstamo HML cubre solo la compra; remodelación y reservas requieren fondos propios salvo financiamiento adicional confirmado."
                : "Estimate: HML funds the purchase only; rehab and reserves require equity unless additional financing is confirmed."}</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-violet-400/25 bg-violet-500/10 p-4 text-center shadow-sm">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-violet-200/80">
                    {execI18n.score}
                  </div>
                  <div className="mt-1 text-3xl font-bold tabular-nums text-white">
                    {evaluation.score}
                  </div>
                </div>
                <div className="rounded-xl border border-sky-400/25 bg-sky-500/10 p-4 text-center shadow-sm">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-sky-200/80">
                    {execI18n.estado}
                  </div>
                  <div className="mt-1 line-clamp-2 text-sm font-semibold leading-tight text-sky-100">
                    {evaluation.levelText}
                  </div>
                </div>
                <div className="flex flex-col items-center justify-center rounded-xl border border-emerald-400/30 bg-emerald-500/15 p-4 text-center shadow-sm">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-emerald-200/90">
                    {execI18n.confianza}
                  </div>
                  <span
                    className={cn(
                      "mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-semibold",
                      student.confidenceClass,
                      "border-emerald-400/40 shadow-sm",
                    )}
                  >
                    {student.confidenceText}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  {
                    icon: Home,
                    title: execI18n.step1,
                    hint: execI18n.step1Hint,
                    value: formatCurrency(calculation.purchasePrice),
                  },
                  {
                    icon: Hammer,
                    title: execI18n.step2,
                    hint: execI18n.step2Hint,
                    value: formatCurrency(calculation.rehabBudget),
                  },
                  {
                    icon: Store,
                    title: execI18n.step3,
                    hint: execI18n.step3Hint,
                    value: formatCurrency(calculation.netSalePrice),
                  },
                  {
                    icon: TrendingUp,
                    title: execI18n.step4,
                    hint: "",
                    value: formatCurrency(calculation.profit),
                    extra: `${execI18n.roi} ${formatPercentage(calculation.roi, 2)} · ${execI18n.invVsArv} ${formatPercentage(calculation.arv > 0 ? (calculation.tpcPlusCost / calculation.arv) * 100 : 0, 1)}`,
                  },
                ].map((step, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-primary/20 bg-gradient-to-b from-card/90 to-muted/20 p-3 shadow-sm transition-colors hover:border-primary/40"
                  >
                    <div className="flex items-start gap-2">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary">
                        <step.icon className="h-4 w-4" aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] font-semibold uppercase leading-tight tracking-wide text-primary">
                          {step.title}
                        </div>
                        <div
                          className={cn(
                            "mt-1 text-lg font-bold tabular-nums",
                            i === 3 && calculation.profit >= 0 && "text-yellow-300",
                            i === 3 && calculation.profit < 0 && "text-red-400",
                          )}
                        >
                          {step.value}
                        </div>
                        {step.hint ? (
                          <p className="mt-0.5 text-[11px] text-muted-foreground">{step.hint}</p>
                        ) : null}
                        {"extra" in step && step.extra ? (
                          <p className="mt-1 text-[11px] text-muted-foreground">{step.extra}</p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-3 rounded-2xl border border-emerald-400/25 bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-cyan-500/10 p-4 shadow-inner sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-emerald-200">
                    {execI18n.signal}
                  </div>
                  <p className="mt-1 text-sm text-emerald-50/95">{student.signalNote}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-dashed border-emerald-400/50 bg-emerald-950/20 px-2.5 py-1 text-[11px] font-medium text-emerald-100">
                    {execI18n.minRoi}: {formatPercentage(inputs.profitMinPercent, 2)}
                  </span>
                  <span className="rounded-full border border-dashed border-emerald-400/50 bg-emerald-950/20 px-2.5 py-1 text-[11px] font-medium text-emerald-100">
                    {execI18n.minProfit}: {formatCurrency(inputs.profitMinAmount)}
                  </span>
                  <span
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-bold shadow-md",
                      student.signalClass,
                      "border-white/20",
                    )}
                  >
                    {student.signalText}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-orange-400/20 bg-orange-500/10 p-3">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-orange-200/90">
                    {execI18n.kpiBe}
                  </div>
                  <div className="mt-1 font-bold tabular-nums">
                    {formatCurrency(student.breakEvenArv)}
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">{execI18n.kpiBeHint}</p>
                </div>
                <div className="rounded-xl border border-cyan-400/20 bg-cyan-500/10 p-3">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-cyan-200/90">
                    {execI18n.kpiMargin}
                  </div>
                  <div className="mt-1 font-bold tabular-nums text-cyan-100">
                    {formatPercentage(student.safetyMargin)}
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">{execI18n.kpiMarginHint}</p>
                </div>
                <div className="rounded-xl border border-lime-400/25 bg-lime-500/10 p-3">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-lime-200/90">
                    {execI18n.kpiMo}
                  </div>
                  <div className="mt-1 font-bold tabular-nums text-lime-100">
                    {formatCurrency(student.monthlyProfit)}
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {lang === "es"
                      ? `Ganancia estimada ÷ ${Math.max(1, calculation.projectMonths || 1)} mes(es).`
                      : `Estimated profit ÷ ${Math.max(1, calculation.projectMonths || 1)} month(s).`}
                  </p>
                </div>
              </div>

              {student.insightFactors.length > 0 ? (
                <div className="rounded-2xl border border-amber-400/20 bg-gradient-to-br from-amber-500/10 to-yellow-600/5 p-4">
                  <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-amber-200">
                    <Zap className="h-4 w-4 text-amber-400" aria-hidden />
                    {execI18n.why}
                  </div>
                  <ul className="space-y-2">
                    {student.insightFactors.map((f, i) => (
                      <li
                        key={`${i}-${f}`}
                        className="flex gap-2 text-sm text-amber-50/95"
                      >
                        <Zap
                          className="mt-0.5 h-4 w-4 shrink-0 text-amber-400"
                          aria-hidden
                        />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{lang === "es" ? "Escenarios de rentabilidad" : "ROI scenarios"}</CardTitle>
            </CardHeader>
            <CardContent>
              {scenarios.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {lang === "es"
                    ? "Ingresa datos para ver escenarios"
                    : "Enter data for scenarios"}
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{lang === "es" ? "Escenario" : "Scenario"}</TableHead>
                      <TableHead>ARV</TableHead>
                      <TableHead>{lang === "es" ? "Venta neta" : "Net sale"}</TableHead>
                      <TableHead>{lang === "es" ? "Ganancia" : "Profit"}</TableHead>
                      <TableHead>ROI</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scenarios.map((row) => (
                      <TableRow key={row.label}>
                        <TableCell className="font-medium">{row.label}</TableCell>
                        <TableCell>{formatCurrency(row.arv)}</TableCell>
                        <TableCell>{formatCurrency(row.netSale)}</TableCell>
                        <TableCell>{formatCurrency(row.profit)}</TableCell>
                        <TableCell>{formatPercentage(row.roi)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 lg:sticky lg:top-32 lg:z-30 lg:self-start lg:max-h-[calc(100vh-9rem)] lg:overflow-y-auto lg:overscroll-y-contain lg:pr-1">
          <DealGauge evaluation={evaluation} lang={lang} />
          <Card className="border-primary/30 bg-card/95">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                {lang === "es" ? "Resultados" : "Live results"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {lang === "es" ? "Inversión total" : "Total investment"}
                </span>
                <span className="font-bold">{formatCurrency(calculation.tpcPlusCost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {lang === "es" ? "Ganancia" : "Profit"}
                </span>
                <span className="font-bold text-primary">{formatCurrency(calculation.profit)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">ROI</span>
                <span className="font-bold">{formatPercentage(calculation.roi)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">CoC</span>
                <span className="font-bold">{formatPercentage(calculation.cashOnCash)}</span>
              </div>
              <div
                className="rounded-md p-2 text-center font-bold"
                style={{ color: statusPresentation.color }}
              >
                {statusPresentation.text}
              </div>
              <p className="text-xs text-muted-foreground">{evaluation.recommendation}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">
                {lang === "es" ? "Costos financieros" : "Financing costs"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {lang === "es" ? "Interés HML" : "HML interest"}
                </span>
                <span>{formatCurrency(calculation.hmlTotalInterest)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {lang === "es" ? "Fees totales" : "Total fees"}
                </span>
                <span>{formatCurrency(calculation.hmlTotalFees)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {lang === "es" ? "Venta neta" : "Net sale price"}
                </span>
                <span>{formatCurrency(calculation.netSalePrice)}</span>
              </div>
            </CardContent>
          </Card>

          <Button
            size="sm"
            className="w-full gold-gradient text-primary-foreground"
            onClick={handleSave}
          >
            <Save className="h-4 w-4 mr-1" />
            {lang === "es" ? "Guardar inversión" : "Save deal"}
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate("/deals")}
          >
            {lang === "es" ? "Ver mis inversiones" : "Go to my deals"}
          </Button>
        </div>
      </div>
      <p className="border-t border-border/60 pt-4 text-[11px] leading-relaxed text-muted-foreground">
        {lang === "es"
          ? "Aviso: Calculadora educativa. Las proyecciones dependen de los datos ingresados, no garantizan resultados ni constituyen asesoramiento de inversión. Verifica los supuestos y consulta a profesionales antes de invertir. Adelayne Global Corp no toma decisiones de inversión por el usuario."
          : "Notice: Educational calculator. Estimates depend on user-provided data, do not guarantee outcomes, and are not investment advice. Verify assumptions and consult qualified professionals before investing. Adelayne Global Corp does not make investment decisions for users."}
      </p>
    </div>
  );
}
