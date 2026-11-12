import { ffT } from "./copy";
import type {
  FixFlipCalculation,
  FixFlipLanguage,
  UnderwritingInputs,
} from "./types";

const MAX_MONEY = 100_000_000;

const RULES: Record<string, { min?: number; max?: number }> = {
  projectMonths: { min: 0, max: 120 },
  arv: { min: 0, max: MAX_MONEY },
  purchasePrice: { min: 0, max: MAX_MONEY },
  rehabBudget: { min: 0, max: MAX_MONEY },
  closingCosts: { min: 0, max: MAX_MONEY },
  holdingCosts: { min: 0, max: MAX_MONEY },
  downPaymentAmount: { min: 0, max: MAX_MONEY },
  cashOnHand: { min: 0, max: MAX_MONEY },
  downPaymentPercent: { min: 0, max: 100 },
  hmlPointsRate: { min: 0, max: 20 },
  hmlInterestRate: { min: 0, max: 100 },
  hmlAdminFees: { min: 0, max: MAX_MONEY },
  reCommissions: { min: 0, max: 20 },
  resaleClosingCosts: { min: 0, max: MAX_MONEY },
  profitMinPercent: { min: 0, max: 100 },
  profitMinAmount: { min: 0, max: MAX_MONEY },
};

function clampField(key: string, value: number): number {
  const rule = RULES[key];
  let v = value;
  if (rule?.min != null) v = Math.max(rule.min, v);
  if (rule?.max != null) v = Math.min(rule.max, v);
  return v;
}

export function formatCurrency(amount: number): string {
  const n = Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export function formatPercentage(value: number, decimals = 2): string {
  const n = Number.isFinite(value) ? value : 0;
  return `${n.toFixed(decimals)}%`;
}

export function formatPercentageShort(value: number, decimals = 1): string {
  const n = Number.isFinite(value) ? value : 0;
  return n.toFixed(decimals);
}

export type ComputeOpts = {
  lastModifiedField: string | null;
  projectCount: number;
};

export function computeUnderwriting(
  input: UnderwritingInputs,
  opts: ComputeOpts,
): FixFlipCalculation {
  const projectMonths = clampField("projectMonths", input.projectMonths);
  const arv = clampField("arv", input.arv);
  const purchasePrice = clampField("purchasePrice", input.purchasePrice);
  const rehabBudget = clampField("rehabBudget", input.rehabBudget);
  const closingCosts = clampField("closingCosts", input.closingCosts);
  const holdingCosts = clampField("holdingCosts", input.holdingCosts);
  const cashOnHand = clampField("cashOnHand", input.cashOnHand ?? 0);
  let downPaymentAmount = clampField(
    "downPaymentAmount",
    input.downPaymentAmount,
  );
  let downPaymentPercent = clampField(
    "downPaymentPercent",
    input.downPaymentPercent,
  );
  const hmlPointsRate = clampField("hmlPointsRate", input.hmlPointsRate);
  const hmlInterestRate = clampField("hmlInterestRate", input.hmlInterestRate);
  const hmlAdminFees = clampField("hmlAdminFees", input.hmlAdminFees);
  const reCommissions = clampField("reCommissions", input.reCommissions);
  const resaleClosingCosts = clampField(
    "resaleClosingCosts",
    input.resaleClosingCosts,
  );
  const profitMinPercent = clampField(
    "profitMinPercent",
    input.profitMinPercent,
  );
  const profitMinAmount = clampField(
    "profitMinAmount",
    input.profitMinAmount,
  );

  const totalHoldingCosts = holdingCosts * projectMonths;
  const totalProjectCosts =
    purchasePrice + rehabBudget + closingCosts + totalHoldingCosts;

  const last = opts.lastModifiedField;
  const isEditingDownAmount =
    last === "down-payment-amount" || last === "downPaymentAmount";
  const isEditingDownPercent =
    last === "down-payment-percent" || last === "downPaymentPercent";

  let calculatedDownPaymentAmount = downPaymentAmount;
  let calculatedDownPaymentPercent = downPaymentPercent;

  if (downPaymentAmount > 0 && purchasePrice > 0 && downPaymentPercent === 0) {
    calculatedDownPaymentPercent =
      (downPaymentAmount / purchasePrice) * 100;
  } else if (
    downPaymentPercent > 0 &&
    purchasePrice > 0 &&
    downPaymentAmount === 0
  ) {
    calculatedDownPaymentAmount = (purchasePrice * downPaymentPercent) / 100;
  } else if (
    downPaymentAmount > 0 &&
    downPaymentPercent > 0 &&
    purchasePrice > 0
  ) {
    const expectedPercent =
      (downPaymentAmount / purchasePrice) * 100;
    const expectedAmount = (purchasePrice * downPaymentPercent) / 100;
    if (isEditingDownPercent && !isEditingDownAmount) {
      calculatedDownPaymentAmount = expectedAmount;
    } else {
      calculatedDownPaymentPercent = expectedPercent;
    }
  }

  let calculatedHmlLoanAmount = purchasePrice - calculatedDownPaymentAmount;
  let calculatedHmlLoanPercent = 0;
  if (calculatedHmlLoanAmount > 0 && purchasePrice > 0) {
    calculatedHmlLoanPercent =
      (calculatedHmlLoanAmount / purchasePrice) * 100;
  } else {
    calculatedHmlLoanAmount = 0;
    calculatedHmlLoanPercent = 0;
  }

  const totalFinancingNeeded = totalProjectCosts - calculatedDownPaymentAmount;
  let gapLoanAmount = 0;
  if (calculatedHmlLoanAmount < totalFinancingNeeded) {
    gapLoanAmount = totalFinancingNeeded - calculatedHmlLoanAmount;
  }

  // Hard-money interest-only estimate: quoted HML rate is ANNUAL in both
  // payment-timing modes; it accrues on principal until sale (no phantom amortization).
  // Future draw schedules must use actual outstanding balances per period.
  const hmlPoints = calculatedHmlLoanAmount * (hmlPointsRate / 100);
  const totalHmlInterest =
    calculatedHmlLoanAmount * (hmlInterestRate / 100) * (projectMonths / 12);
  const totalFinancingCosts = hmlPoints + totalHmlInterest + hmlAdminFees;
  const tpcPlusCost = totalProjectCosts + totalFinancingCosts;
  const resaleCommissions = (arv * reCommissions) / 100;
  const totalSellingCosts = resaleCommissions + resaleClosingCosts;
  const netSalePrice = arv - totalSellingCosts;
  const profit = netSalePrice - tpcPlusCost;
  const roi = tpcPlusCost > 0 ? (profit / tpcPlusCost) * 100 : 0;
  // HML is assumed to fund the PURCHASE only. Rehab, holding, fees,
  // and closing require equity unless explicitly funded by a separate loan.
  const cashToClose = calculatedDownPaymentAmount + closingCosts + hmlPoints + hmlAdminFees;
  const capitalRequired = cashToClose + rehabBudget + totalHoldingCosts + totalHmlInterest;
  const liquidityShortfall = cashOnHand > 0 ? Math.max(0, capitalRequired - cashOnHand) : 0;
  const cashOnCash = capitalRequired > 0 ? (profit / capitalRequired) * 100 : 0;
  const profitMeetsPercent = roi >= profitMinPercent;
  const profitMeetsAmount = profit >= profitMinAmount;
  // Legacy binary field retained for compatibility, NOT for final decision labels.
  const dealDecision = profitMeetsPercent && profitMeetsAmount;

  return {
    projectName: `Project ${opts.projectCount + 1}`,
    propertyAddress: input.propertyAddress || "Property Address",
    projectMonths,
    arv,
    purchasePrice,
    rehabBudget,
    closingCosts,
    holdingCosts,
    hmlLoanAmount: calculatedHmlLoanAmount,
    cashOnHand,
    cashToClose,
    liquidityShortfall,
    financingAssumptions: "Purchase-only HML; annual nominal interest-only accrual; no rehab/GAP funding assumed.",
    hmlLoanPercent: calculatedHmlLoanPercent,
    downPaymentAmount: calculatedDownPaymentAmount,
    downPaymentPercent: calculatedDownPaymentPercent,
    hmlPointsRate,
    hmlInterestRate,
    hmlAdminFees,
    hmlPointsCost: hmlPoints,
    hmlTotalInterest: totalHmlInterest,
    hmlTotalFees: totalFinancingCosts,
    gapLoanAmount,
    reCommissions,
    resaleClosingCosts,
    resaleCommissions,
    totalSellingCosts,
    netSalePrice,
    profitMinPercent,
    profitMinAmount,
    totalProjectCosts,
    tpcPlusCost,
    totalCapitalNeeded: tpcPlusCost,
    capitalRequired,
    profit,
    roi,
    cashOnCash,
    dealDecision,
    date: new Date().toISOString(),
    interestType: input.interestType,
  };
}

export type DealEvaluation = {
  score: number;
  level: "excellent" | "good" | "fair" | "poor";
  levelText: string;
  recommendation: string;
  icon: string;
  risk: string;
  roi: number;
  profit: number;
  factors: string[];
  meetsRoiTarget: boolean;
  meetsProfitTarget: boolean;
};

export function evaluateDeal(
  calculation: FixFlipCalculation,
  lang: FixFlipLanguage,
): DealEvaluation {
  const t = (key: string) => ffT(lang, key);
  const empty = calculation.arv <= 0 || calculation.purchasePrice <= 0;
  if (empty) return {
    score: 0, level: "poor", levelText: t("evaluateNoData"),
    recommendation: t("evaluateNoDataRec"), icon: "ℹ️", risk: "-",
    roi: 0, profit: 0, factors: [], meetsRoiTarget: false, meetsProfitTarget: false,
  };

  const roi = calculation.roi;
  const profit = calculation.profit;
  const targetRoi = Number(calculation.profitMinPercent) || 0;
  const targetProfit = Number(calculation.profitMinAmount) || 0;
  const meetsRoiTarget = roi >= targetRoi;
  const meetsProfitTarget = profit >= targetProfit;
  const ratio = (current: number, target: number) =>
    target > 0 ? Math.max(0, current / target) : current > 0 ? 1 : 0;
  const roiPoints = Math.min(25, 20 * ratio(roi, targetRoi));
  const profitPoints = Math.min(25, 20 * ratio(profit, targetProfit));
  const ltv = calculation.arv > 0 ? calculation.hmlLoanAmount / calculation.arv : 1;
  const funding = calculation.cashOnHand || 0;
  const required = calculation.capitalRequired || 0;
  // Missing cash data should be neutral, never considered verified.
  const liquidityPoints = funding > 0
    ? Math.min(20, Math.max(0, 20 * funding / Math.max(1, required)))
    : 10;
  const grossMargin = calculation.arv > 0 ? profit / calculation.arv : 0;
  const marginPoints = Math.max(0, Math.min(12, grossMargin * 80));
  const leveragePoints = Math.max(0, Math.min(8, 8 * (0.9 - ltv) / 0.4));
  const riskPoints = marginPoints + leveragePoints;
  const durationPoints = Math.max(0, 10 - Math.max(0, calculation.projectMonths - 4));
  const score = Math.round(Math.max(0, Math.min(100,
    roiPoints + profitPoints + liquidityPoints + riskPoints + durationPoints,
  )));
  const level: DealEvaluation["level"] =
    score >= 80 ? "excellent" : score >= 60 ? "good" : score >= 40 ? "fair" : "poor";
  const factors = [
    (lang === "es" ? "ROI: " : "ROI: ") +
      formatPercentage(roi) + " / " + formatPercentage(targetRoi) +
      (meetsRoiTarget ? " ✓" : " ⚠"),
    (lang === "es" ? "Ganancia: " : "Profit: ") +
      formatCurrency(profit) + " / " + formatCurrency(targetProfit) +
      (meetsProfitTarget ? " ✓" : " ⚠"),
    funding > 0
      ? (lang === "es" ? "Efectivo disponible: " : "Cash available: ") +
        formatCurrency(funding) + (funding >= required ? " ✓" : " ⚠")
      : (lang === "es" ? "Efectivo disponible sin verificar" : "Cash available not provided"),
  ];
  const risk = ltv > 0.8 ? (lang === "es" ? "Alto" : "High") :
    ltv > 0.7 ? (lang === "es" ? "Medio" : "Moderate") :
    (lang === "es" ? "Bajo" : "Low");
  return {
    score, level,
    levelText: level === "excellent" ? t("evaluateExcellent") :
      level === "good" ? t("evaluateGood") :
      level === "fair" ? t("evaluateFair") : t("evaluatePoor"),
    recommendation: level === "excellent" ? t("evaluateExcellentRec") :
      level === "good" ? t("evaluateGoodRec") :
      level === "fair" ? t("evaluateFairRec") : t("evaluatePoorRec"),
    icon: level === "excellent" ? "📈" : level === "good" ? "✅" :
      level === "fair" ? "⚠️" : "🔎",
    risk, roi, profit, factors, meetsRoiTarget, meetsProfitTarget,
  };
}

export function scoreToNeedleDegrees(score: number): number {
  const s = Math.max(0, Math.min(100, Number(score) || 0));
  if (s < 40) return -90 + (s / 40) * 45;
  if (s < 60) return -45 + ((s - 40) / 20) * 45;
  if (s < 80) return 0 + ((s - 60) / 20) * 45;
  return 45 + ((s - 80) / 20) * 45;
}

export function getDealStatusPresentation(
  evaluation: DealEvaluation,
  dealDecision: boolean,
  lang: FixFlipLanguage,
): { text: string; color: string } {
  const t = (k: string) => ffT(lang, k);
  if (!evaluation || evaluation.levelText === t("evaluateNoData")) {
    return { text: t("evaluateNoData"), color: "#9e9e9e" };
  }
  // Display objective fulfillment separately from the qualitative risk score.
  // Comparisons use the raw values: 14.95 never rounds up to 15.
  if (!dealDecision && evaluation.meetsRoiTarget !== evaluation.meetsProfitTarget) {
    return {
      text: evaluation.meetsRoiTarget ? t("dealStatusPartialRoi") : t("dealStatusPartialProfit"),
      color: "#f59e0b",
    };
  }
  if (!dealDecision && evaluation.profit <= 0) {
    return { text: t("dealStatusRejected"), color: "#ef4444" };
  }
  const minSuffix = !dealDecision ? t("dealStatusMinNotMet") : "";
  switch (evaluation.level) {
    case "excellent":
      return {
        text: t("dealStatusLevelExcellent") + minSuffix,
        color: dealDecision ? "#28a745" : "#ffc107",
      };
    case "good":
      return {
        text: t("dealStatusLevelGood") + minSuffix,
        color: dealDecision ? "#4CAF50" : "#ffc107",
      };
    case "fair":
      return {
        text: t("dealStatusLevelFair") + minSuffix,
        color: dealDecision ? "#ffc107" : "#ff9800",
      };
    default:
      return { text: t("dealStatusLevelPoor"), color: "#F44336" };
  }
}

export type ScenarioRow = {
  label: string;
  arv: number;
  netSale: number;
  profit: number;
  roi: number;
};

export type StudentAnalysisView = {
  signalText: string;
  signalClass: string;
  signalNote: string;
  confidenceText: string;
  confidenceClass: string;
  breakEvenArv: number;
  safetyMargin: number;
  monthlyProfit: number;
  months: number;
  insightFactors: string[];
};

export function buildStudentAnalysis(
  calc: FixFlipCalculation,
  evaluation: DealEvaluation | null,
): StudentAnalysisView {
  const invested = Number(calc.tpcPlusCost) || 0;
  const netSale = Number(calc.netSalePrice) || 0;
  const profit = Number(calc.profit) || 0;
  const roi = Number(calc.roi) || 0;
  const arv = Number(calc.arv) || 0;
  const months = Math.max(1, Number(calc.projectMonths) || 1);
  const minRoi = Number(calc.profitMinPercent) || 0;
  const minProfit = Number(calc.profitMinAmount) || 0;
  const commissionRate = (Number(calc.reCommissions) || 0) / 100;
  const resaleClosing = Number(calc.resaleClosingCosts) || 0;
  const denominator = 1 - commissionRate;
  const breakEvenArv =
    denominator <= 0 ? 0 : (invested + resaleClosing) / denominator;
  const safetyMargin = arv > 0 ? ((arv - breakEvenArv) / arv) * 100 : 0;
  const monthlyProfit = profit / months;
  const investVsArvPct = arv > 0 ? (invested / arv) * 100 : 0;

  let signalText = "Sin datos";
  let signalClass = "bg-amber-500/20 text-amber-400";
  let signalNote = "Carga datos para evaluar";
  let confidenceText = "Sin validar";
  let confidenceClass = "bg-amber-500/20 text-amber-400";

  if (invested > 0 || netSale > 0 || profit !== 0) {
    const meetsRoi = roi >= minRoi;
    const meetsProfit = profit >= minProfit;
    if (meetsRoi && meetsProfit) {
      confidenceText = "Cumple los objetivos";
      confidenceClass = "bg-emerald-500/20 text-emerald-400";
      if (roi >= 20 && investVsArvPct <= 75) {
        signalText = "Cumple y se ve fuerte";
        signalClass = "bg-emerald-500/20 text-emerald-400";
        signalNote =
          "Cumple tus objetivos y además muestra buen margen.";
      } else {
        signalText = "Cumple los objetivos";
        signalClass = "bg-emerald-500/20 text-emerald-400";
        signalNote =
          "Cumple ROI y ganancia minima definidos por ti.";
      }
    } else if (!meetsRoi && !meetsProfit) {
      confidenceText = "No cumple los objetivos";
      confidenceClass = "bg-red-500/20 text-red-400";
      signalText = "No cumple los objetivos";
      signalClass = "bg-red-500/20 text-red-400";
      signalNote = `No alcanza ROI mínimo (${formatPercentage(minRoi, 2)}) ni ganancia minima (${formatCurrency(minProfit)}).`;
    } else if (!meetsRoi) {
      confidenceText = "ROI inferior al objetivo";
      confidenceClass = "bg-amber-500/20 text-amber-400";
      signalText = "ROI inferior al objetivo";
      signalClass = "bg-amber-500/20 text-amber-400";
      signalNote = `ROI actual ${formatPercentage(roi, 2)} frente al mínimo ${formatPercentage(minRoi, 2)}.`;
    } else if (!meetsProfit) {
      confidenceText = "Ganancia inferior al objetivo";
      confidenceClass = "bg-amber-500/20 text-amber-400";
      signalText = "Ganancia por debajo";
      signalClass = "bg-amber-500/20 text-amber-400";
      signalNote = `Ganancia actual ${formatCurrency(profit)} frente al mínimo ${formatCurrency(minProfit)}.`;
    }
  }

  const insightFactors = (evaluation?.factors || []).slice(0, 3);

  return {
    signalText,
    signalClass,
    signalNote,
    confidenceText,
    confidenceClass,
    breakEvenArv,
    safetyMargin,
    monthlyProfit,
    months,
    insightFactors,
  };
}

export function buildRoiScenarios(
  calculation: FixFlipCalculation,
  lang: FixFlipLanguage,
): ScenarioRow[] {
  const t = (k: string) => ffT(lang, k);
  const targetRoi = Number(calculation.profitMinPercent) || 0;
  const reComRate = Number(calculation.reCommissions) || 0;
  const closingSell = Number(calculation.resaleClosingCosts) || 0;
  const tpc = Number(calculation.tpcPlusCost) || 0;
  const commissionFactor = 1 - reComRate / 100;
  if (tpc <= 0 || commissionFactor <= 0) return [];

  const template: { delta: number; labelKey: string }[] = [
    { delta: -3, labelKey: "scenarioConservative" },
    { delta: 0, labelKey: "scenarioTarget" },
    { delta: 3, labelKey: "scenarioAggressive" },
  ];

  return template.map(({ delta, labelKey }) => {
    const roiPct = Math.max(0, targetRoi + delta);
    const targetProfit = tpc * (roiPct / 100);
    const targetNetSale = tpc + targetProfit;
    const targetArv = (targetNetSale + closingSell) / commissionFactor;
    return {
      label: t(labelKey),
      arv: targetArv,
      netSale: targetNetSale,
      profit: targetProfit,
      roi: roiPct,
    };
  });
}
