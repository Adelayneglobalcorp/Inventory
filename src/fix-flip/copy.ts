import type { FixFlipLanguage } from "./types";

const STRINGS: Record<
  FixFlipLanguage,
  Record<string, string>
> = {
  es: {
    evaluateNoData: "Sin Datos",
    evaluateNoDataRec: "Ingresa datos para evaluar el deal",
    evaluateExcellent: "Excelente",
    evaluateExcellentRec:
      "¡Excelente oportunidad! Recomendado proceder inmediatamente.",
    evaluateGood: "Bueno",
    evaluateGoodRec: "Buen deal con potencial sólido. Considerar proceder.",
    evaluateFair: "Regular",
    evaluateFairRec: "Deal aceptable pero con riesgos. Evaluar cuidadosamente.",
    evaluatePoor: "Malo",
    evaluatePoorRec: "Deal no recomendado. Buscar mejores oportunidades.",
    dealStatusMinNotMet: " · No cumple mínimos",
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
