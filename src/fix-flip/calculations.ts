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
      Math.round((downPaymentAmount / purchasePrice) * 100 * 10) / 10;
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
      Math.round((downPaymentAmount / purchasePrice) * 100 * 10) / 10;
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
      Math.round((calculatedHmlLoanAmount / purchasePrice) * 100 * 10) / 10;
  } else {
    calculatedHmlLoanAmount = 0;
    calculatedHmlLoanPercent = 0;
  }

  const totalFinancingNeeded = totalProjectCosts - calculatedDownPaymentAmount;
  let gapLoanAmount = 0;
  if (calculatedHmlLoanAmount < totalFinancingNeeded) {
    gapLoanAmount = totalFinancingNeeded - calculatedHmlLoanAmount;
  }

  const hmlPoints = calculatedHmlLoanAmount * (hmlPointsRate / 100);
  let monthlyPayment = 0;
  let totalHmlInterest = 0;
  if (projectMonths > 0 && hmlInterestRate > 0) {
    const monthlyRate = hmlInterestRate / 100 / 12;
    const denominator = Math.pow(1 + monthlyRate, projectMonths) - 1;
    if (denominator > 0) {
      monthlyPayment =
        (calculatedHmlLoanAmount *
          monthlyRate *
          Math.pow(1 + monthlyRate, projectMonths)) /
        denominator;
      totalHmlInterest = monthlyPayment * projectMonths - calculatedHmlLoanAmount;
    }
  }

  const totalFinancingCosts = hmlPoints + totalHmlInterest + hmlAdminFees;
  const tpcPlusCost = totalProjectCosts + totalFinancingCosts;
  const resaleCommissions = (arv * reCommissions) / 100;
  const totalSellingCosts = resaleCommissions + resaleClosingCosts;
  const netSalePrice = arv - totalSellingCosts;
  const profit = netSalePrice - tpcPlusCost;
  const roi = tpcPlusCost > 0 ? (profit / tpcPlusCost) * 100 : 0;
  const cashOnCash =
    calculatedDownPaymentAmount > 0
      ? (profit / calculatedDownPaymentAmount) * 100
      : 0;
  const profitMeetsPercent = roi >= profitMinPercent;
  const profitMeetsAmount = profit >= profitMinAmount;
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
    capitalRequired: calculatedDownPaymentAmount,
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
};

export function evaluateDeal(
  calculation: FixFlipCalculation,
  lang: FixFlipLanguage,
): DealEvaluation {
  const t = (k: string) => ffT(lang, k);
  if (!calculation || calculation.arv === 0) {
    return {
      score: 0,
      level: "poor",
      levelText: t("evaluateNoData"),
      recommendation: t("evaluateNoDataRec"),
      icon: "📊",
      risk: "—",
      roi: 0,
      profit: 0,
      factors: [],
    };
  }

  let score = 0;
  const factors: string[] = [];
  const roi = calculation.roi;
  if (roi >= 30) {
    score += 40;
    factors.push(lang === "es" ? "ROI excelente (≥30 %)" : "Excellent ROI (≥30%)");
  } else if (roi >= 20) {
    score += 30;
    factors.push(lang === "es" ? "ROI bueno (20–29 %)" : "Good ROI (20–29%)");
  } else if (roi >= 15) {
    score += 20;
    factors.push(lang === "es" ? "ROI regular (15–19 %)" : "Fair ROI (15–19%)");
  } else if (roi >= 10) {
    score += 10;
    factors.push(lang === "es" ? "ROI bajo (10–14 %)" : "Low ROI (10–14%)");
  } else {
    factors.push(lang === "es" ? "ROI muy bajo (<10 %)" : "Very low ROI (<10%)");
  }

  const profit = calculation.profit;
  const profitPercent = (profit / calculation.arv) * 100;
  if (profitPercent >= 25) {
    score += 25;
    factors.push(lang === "es" ? "Ganancia excelente (≥25 % del ARV)" : "Excellent profit (≥25% ARV)");
  } else if (profitPercent >= 20) {
    score += 20;
    factors.push(lang === "es" ? "Ganancia buena (20–24 % del ARV)" : "Good profit (20–24% ARV)");
  } else if (profitPercent >= 15) {
    score += 15;
    factors.push(lang === "es" ? "Ganancia regular (15–19 % del ARV)" : "Fair profit (15–19% ARV)");
  } else if (profitPercent >= 10) {
    score += 10;
    factors.push(lang === "es" ? "Ganancia baja (10–14 % del ARV)" : "Low profit (10–14% ARV)");
  } else if (profitPercent > 0) {
    score += 5;
    factors.push(lang === "es" ? "Ganancia muy baja (<10 % del ARV)" : "Very low profit (<10% ARV)");
  } else {
    factors.push(lang === "es" ? "Sin ganancia" : "No profit");
  }

  const cashOnCash = calculation.cashOnCash;
  if (cashOnCash >= 50) {
    score += 20;
    factors.push(lang === "es" ? "Rentabilidad sobre efectivo excelente (≥50 %)" : "Excellent cash-on-cash return (≥50%)");
  } else if (cashOnCash >= 30) {
    score += 15;
    factors.push(lang === "es" ? "Rentabilidad sobre efectivo buena (30–49 %)" : "Good cash-on-cash return (30–49%)");
  } else if (cashOnCash >= 20) {
    score += 10;
    factors.push(lang === "es" ? "Rentabilidad sobre efectivo regular (20–29 %)" : "Fair cash-on-cash return (20–29%)");
  } else if (cashOnCash >= 10) {
    score += 5;
    factors.push(lang === "es" ? "Rentabilidad sobre efectivo baja (10–19 %)" : "Low cash-on-cash return (10–19%)");
  } else {
    factors.push(lang === "es" ? "Rentabilidad sobre efectivo muy baja (<10 %)" : "Very low cash-on-cash return (<10%)");
  }

  const ltv = (calculation.hmlLoanAmount / calculation.arv) * 100;
  let riskLevel = "Bajo";
  let riskScore = 15;
  if (ltv > 80) {
    riskScore = 0;
    riskLevel = "Muy Alto";
    factors.push(lang === "es" ? "LTV muy alto (>80 %)" : "Very high LTV (>80%)");
  } else if (ltv > 75) {
    riskScore = 5;
    riskLevel = "Alto";
    factors.push(lang === "es" ? "LTV alto (75–80 %)" : "High LTV (75–80%)");
  } else if (ltv > 70) {
    riskScore = 10;
    riskLevel = "Medio";
    factors.push(lang === "es" ? "LTV medio (70–75 %)" : "Moderate LTV (70–75%)");
  } else {
    riskScore = 15;
    riskLevel = "Bajo";
    factors.push(lang === "es" ? "LTV bajo (≤70 %)" : "Low LTV (≤70%)");
  }
  score += riskScore;

  const minRoiTarget = Number(calculation.profitMinPercent) || 0;
  const minProfitTarget = Number(calculation.profitMinAmount) || 0;
  const meetsRoiTarget = roi >= minRoiTarget;
  const meetsProfitTarget = profit >= minProfitTarget;
  if (meetsRoiTarget && meetsProfitTarget) {
    score += 5;
    factors.push(lang === "es" ? "Cumple los mínimos de rentabilidad y ganancia" : "Meets minimum ROI and profit");
  } else if (!meetsRoiTarget && !meetsProfitTarget) {
    score -= 10;
    factors.push(lang === "es" ? "No cumple los mínimos de rentabilidad ni de ganancia" : "Below minimum ROI and profit");
  } else if (!meetsRoiTarget) {
    score -= 6;
    factors.push(lang === "es" ? "No alcanza la rentabilidad mínima" : "Below minimum ROI");
  } else if (!meetsProfitTarget) {
    score -= 6;
    factors.push(lang === "es" ? "No alcanza la ganancia mínima" : "Below minimum profit");
  }

  score = Math.max(0, Math.min(100, score));

  let level: DealEvaluation["level"];
  let levelText: string;
  let recommendation: string;
  let icon: string;
  const meetsAllMinimums = calculation.dealDecision;
  if (score >= 80) {
    level = "excellent";
    levelText = t("evaluateExcellent");
    recommendation = t("evaluateExcellentRec");
    icon = "🚀";
  } else if (score >= 60) {
    level = "good";
    levelText = t("evaluateGood");
    recommendation = t("evaluateGoodRec");
    icon = "✅";
  } else if (score >= 40) {
    level = "fair";
    levelText = t("evaluateFair");
    recommendation = t("evaluateFairRec");
    icon = "⚠️";
  } else {
    level = "poor";
    levelText = t("evaluatePoor");
    recommendation = t("evaluatePoorRec");
    icon = "❌";
  }

  if (!meetsAllMinimums) {
    // A favorable qualitative score cannot override an investor's hard thresholds.
    level = "poor";
    levelText = t("dealStatusRejected");
    recommendation = t("evaluateBelowMinimumRec");
    icon = "❌";
  }

  return {
    score: Math.round(score),
    level,
    levelText,
    recommendation,
    icon,
    risk: riskLevel,
    roi,
    profit,
    factors,
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
  // The investor's mandatory minimums determine acceptance; the risk score is advisory.
  // Never approve 14.95% against a 15% target based on rounded display values.
  if (!dealDecision) {
    return { text: t("dealStatusRejected"), color: "#ef4444" };
  }
  const minSuffix = "";
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
      confidenceText = "Cumple minimos";
      confidenceClass = "bg-emerald-500/20 text-emerald-400";
      if (roi >= 20 && investVsArvPct <= 75) {
        signalText = "Cumple y se ve fuerte";
        signalClass = "bg-emerald-500/20 text-emerald-400";
        signalNote =
          "Cumple tus minimos y ademas muestra buen margen.";
      } else {
        signalText = "Cumple minimos";
        signalClass = "bg-emerald-500/20 text-emerald-400";
        signalNote =
          "Cumple ROI y ganancia minima definidos por ti.";
      }
    } else if (!meetsRoi && !meetsProfit) {
      confidenceText = "No cumple minimos";
      confidenceClass = "bg-red-500/20 text-red-400";
      signalText = "No cumple minimos";
      signalClass = "bg-red-500/20 text-red-400";
      signalNote = `No alcanza ROI minimo (${formatPercentage(minRoi, 2)}) ni ganancia minima (${formatCurrency(minProfit)}).`;
    } else if (!meetsRoi) {
      confidenceText = "ROI bajo minimo";
      confidenceClass = "bg-amber-500/20 text-amber-400";
      signalText = "ROI por debajo";
      signalClass = "bg-amber-500/20 text-amber-400";
      signalNote = `ROI actual ${formatPercentage(roi, 2)} vs minimo ${formatPercentage(minRoi, 2)}.`;
    } else if (!meetsProfit) {
      confidenceText = "Profit bajo minimo";
      confidenceClass = "bg-amber-500/20 text-amber-400";
      signalText = "Ganancia por debajo";
      signalClass = "bg-amber-500/20 text-amber-400";
      signalNote = `Ganancia actual ${formatCurrency(profit)} vs minimo ${formatCurrency(minProfit)}.`;
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
