/** Misma fórmula que `saveProjectItem` en CalculatorFix-flip/script.js. */
export function computePmItemTotals(
  materials: number,
  labor: number,
  other: number,
  quantity: number,
  markupPercent: number,
): { subtotal: number; markupAmount: number; totalEstimated: number } {
  const q = Math.max(1, Math.floor(Math.abs(quantity)) || 1);
  const m = Number.isFinite(materials) ? materials : 0;
  const l = Number.isFinite(labor) ? labor : 0;
  const o = Number.isFinite(other) ? other : 0;
  const subtotal = (m + l + o) * q;
  const markupAmount = subtotal * ((Number.isFinite(markupPercent) ? markupPercent : 0) / 100);
  return {
    subtotal,
    markupAmount,
    totalEstimated: subtotal + markupAmount,
  };
}
