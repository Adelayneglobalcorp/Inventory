import { describe, expect, it } from "vitest";
import { computeUnderwriting, evaluateDeal, buildRoiScenarios } from "./calculations";
import { buildPropertySpaces, recalcPmBudget } from "./storage";
import type { UnderwritingInputs, ProjectManagerData } from "./types";

const base: UnderwritingInputs = {
  propertyAddress: "123 Example Rd",
  projectMonths: 5,
  purchasePrice: 400_000,
  arv: 540_000,
  rehabBudget: 35_000,
  closingCosts: 10_000,
  holdingCosts: 1_000,
  cashOnHand: 150_000,
  downPaymentAmount: 0,
  downPaymentPercent: 20,
  hmlPointsRate: 1,
  hmlInterestRate: 12,
  interestType: "monthly",
  hmlAdminFees: 500,
  reCommissions: 5,
  resaleClosingCosts: 5_000,
  profitMinPercent: 15,
  profitMinAmount: 30_000,
};

const evaluate = (overrides: Partial<UnderwritingInputs> = {}) =>
  computeUnderwriting({ ...base, ...overrides }, {
    lastModifiedField: "downPaymentPercent",
    projectCount: 0,
  });

describe("Fix & Flip financial calculations", () => {
  it("calculates interest-only HML rather than phantom amortization", () => {
    const deal = evaluate();
    expect(deal.downPaymentAmount).toBe(80_000);
    expect(deal.hmlLoanAmount).toBe(320_000);
    expect(deal.hmlTotalInterest).toBeCloseTo(16_000, 2);
    expect(deal.hmlPointsCost).toBeCloseTo(3_200, 2);
    expect(deal.tpcPlusCost).toBeCloseTo(469_700, 2);
    expect(deal.netSalePrice).toBeCloseTo(508_000, 2);
    expect(deal.profit).toBeCloseTo(38_300, 2);
    expect(deal.roi).toBeCloseTo((38_300 / 469_700) * 100, 8);
  });
  it("separates purchase down payment from total required cash", () => {
    const deal = evaluate({ cashOnHand: 80_000 });
    expect(deal.cashToClose).toBeCloseTo(93_700, 2);
    expect(deal.capitalRequired).toBeCloseTo(149_700, 2);
    expect(deal.liquidityShortfall).toBeCloseTo(69_700, 2);
    expect(deal.cashOnCash).toBeCloseTo((38_300 / 149_700) * 100, 8);
  });
  it("does not round 14.95% up to meet a 15% goal", () => {
    const deal = evaluate();
    const testCase = { ...deal, roi: 14.95, profit: 98_506.66, profitMinPercent: 15, profitMinAmount: 75_000 };
    const result = evaluateDeal(testCase, "es");
    expect(result.meetsRoiTarget).toBe(false);
    expect(result.meetsProfitTarget).toBe(true);
    expect(result.score).toBeGreaterThan(0);
  });
  it("scores complete absence of essential figures as no data", () => {
    const result = evaluateDeal(evaluate({ purchasePrice: 0 }), "en");
    expect(result.score).toBe(0);
    expect(result.levelText).toBe("No Data");
  });
  it("recalculates project outcomes in conservative and optimistic scenarios", () => {
    const rows = buildRoiScenarios(evaluate(), "en");
    expect(rows).toHaveLength(3);
    expect(rows[0].profit).toBeLessThan(rows[1].profit);
    expect(rows[2].profit).toBeGreaterThan(rows[1].profit);
    expect(rows[1].profit).toBeCloseTo(evaluate().profit, 2);
  });
  it("preserves decimal interest and down-payment precision", () => {
    const deal = evaluate({ hmlInterestRate: 11.75, downPaymentPercent: 14.95 });
    expect(deal.downPaymentPercent).toBeCloseTo(14.95, 9);
    expect(deal.downPaymentAmount).toBeCloseTo(59_800, 2);
    expect(deal.hmlTotalInterest).toBeCloseTo(deal.hmlLoanAmount * 0.1175 * 5 / 12, 6);
  });
});

describe("Project Manager preset and baseline", () => {
  it("creates bathroom and bedroom spaces without default tasks", () => {
    const spaces = buildPropertySpaces({ bedrooms: 3, bathrooms: 3 });
    expect(spaces.filter(s => s.templateArea === "Baños")).toHaveLength(3);
    expect(spaces.filter(s => s.name.startsWith("Habitación"))).toHaveLength(3);
    expect(spaces.some(s => s.name === "Cocina")).toBe(true);
  });
  it("keeps the deal renovation budget as baseline", () => {
    const pm: ProjectManagerData = {
      projectId: 1, projectName: "Demo", created: "2026-01-01",
      lastUpdated: "2026-01-01", status: "ACTIVE", dealRepairBudget: 40_000,
      budget: { total: 40_000, used: 0, remaining: 40_000 },
      timeline: { startDate: "2026-01-01", estimatedCompletion: "2026-04-01", phases: [] },
      items: [{ id: "task1", category: "INTERIOR", area: "Baños", description: "Replace sink",
        totalEstimated: 1_000, totalActual: 800, status: "COMPLETED" }],
    };
    const result = recalcPmBudget(pm);
    expect(result.budget.total).toBe(40_000);
    expect(result.budget.used).toBe(800);
    expect(result.budget.remaining).toBe(39_200);
  });
});
