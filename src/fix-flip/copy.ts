import type { FixFlipLanguage } from "./types";

const STRINGS: Record<
  FixFlipLanguage,
  Record<string, string>
> = {
  es: {
    evaluateNoData: "Sin Datos",
    evaluateNoDataRec: "Ingresa los datos para evaluar la inversión.",
    evaluateExcellent: "Excelente",
    evaluateExcellentRec:
      "¡Excelente oportunidad! Recomendado proceder inmediatamente.",
    evaluateGood: "Bueno",
    evaluateGoodRec: "Inversión con buen potencial. Revisa las condiciones antes de avanzar.",
    evaluateFair: "Regular",
    evaluateFairRec: "La inversión presenta riesgos. Analiza los costos y las condiciones antes de decidir.",
    evaluatePoor: "Malo",
    evaluatePoorRec: "Inversión no recomendada. Considera otras oportunidades.",
    dealStatusMinNotMet: " · No cumple los requisitos mínimos",
    dealStatusRejected: "NO CUMPLE LOS MÍNIMOS",
    evaluateBelowMinimumRec: "La rentabilidad o la ganancia calculada no alcanza el mínimo establecido. No se recomienda continuar con esta inversión bajo las condiciones actuales.",
    gaugePoints: "Puntos",
    gaugePoor: "Malo",
    gaugeFair: "Regular",
    gaugeGood: "Bueno",
    gaugeExcellent: "Excelente",
    dealStatusLevelExcellent: "✨ EXCELENTE",
    dealStatusLevelGood: "✅ BUENO",
    dealStatusLevelFair: "⚠️ REGULAR",
    dealStatusLevelPoor: "❌ MALO",
    scenarioConservative: "Conservador",
    scenarioTarget: "Objetivo",
    scenarioAggressive: "Agresivo",
    noScenarioData: "No hay datos suficientes para escenarios",
  },
  en: {
    evaluateNoData: "No Data",
    evaluateNoDataRec: "Enter data to evaluate this deal",
    evaluateExcellent: "Excellent",
    evaluateExcellentRec: "Excellent opportunity! Strongly recommended to proceed.",
    evaluateGood: "Good",
    evaluateGoodRec: "Good deal with solid potential. Consider proceeding.",
    evaluateFair: "Fair",
    evaluateFairRec: "Acceptable deal but with risks. Review carefully.",
    evaluatePoor: "Poor",
    evaluatePoorRec: "Deal not recommended. Look for better opportunities.",
    dealStatusMinNotMet: " · Below minimums",
    dealStatusRejected: "DOES NOT MEET MINIMUMS",
    evaluateBelowMinimumRec: "The calculated ROI or profit is below the required minimum. This investment does not qualify under the current assumptions.",
    gaugePoints: "Points",
    gaugePoor: "Poor",
    gaugeFair: "Fair",
    gaugeGood: "Good",
    gaugeExcellent: "Excellent",
    dealStatusLevelExcellent: "✨ EXCELLENT",
    dealStatusLevelGood: "✅ GOOD",
    dealStatusLevelFair: "⚠️ FAIR",
    dealStatusLevelPoor: "❌ POOR",
    scenarioConservative: "Conservative",
    scenarioTarget: "Target",
    scenarioAggressive: "Aggressive",
    noScenarioData: "No scenario data available",
  },
};

export function ffT(lang: FixFlipLanguage, key: string): string {
  return STRINGS[lang]?.[key] ?? STRINGS.es[key] ?? key;
}
