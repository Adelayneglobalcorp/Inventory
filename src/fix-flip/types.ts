export type FixFlipLanguage = "es" | "en";

export interface FixFlipCalculation {
  projectName: string;
  propertyAddress: string;
  projectMonths: number;
  arv: number;
  purchasePrice: number;
  rehabBudget: number;
  closingCosts: number;
  holdingCosts: number;
  hmlLoanAmount: number;
  hmlLoanPercent: number;
  downPaymentAmount: number;
  downPaymentPercent: number;
  hmlPointsRate: number;
  hmlInterestRate: number;
  hmlAdminFees: number;
  hmlPointsCost: number;
  hmlTotalInterest: number;
  hmlTotalFees: number;
  gapLoanAmount: number;
  cashOnHand?: number;
  cashToClose?: number;
  liquidityShortfall?: number;
  financingAssumptions?: string;
  reCommissions: number;
  resaleClosingCosts: number;
  resaleCommissions: number;
  totalSellingCosts: number;
  netSalePrice: number;
  profitMinPercent: number;
  profitMinAmount: number;
  totalProjectCosts: number;
  tpcPlusCost: number;
  totalCapitalNeeded: number;
  capitalRequired: number;
  profit: number;
  roi: number;
  cashOnCash: number;
  dealDecision: boolean;
  date: string;
  interestType: "monthly" | "annual";
}

export type FixFlipProject = FixFlipCalculation & { id: number };

/** Línea seleccionada desde la base de subcategorías (legacy `selectedSubcategories`). */
export interface PMSubcategorySelection {
  name: string;
  materials: number;
  labor: number;
  unit: string;
  workType: string;
}

export interface PMItem {
  id: string;
  category: "INTERIOR" | "EXTERIOR";
  area: string;
  description: string;
  workType?: string;
  totalEstimated: number;
  totalActual?: number;
  status: "PLANNING" | "IN_PROGRESS" | "COMPLETED" | "ON_HOLD";
  quantity?: number;
  unit?: string;
  priority?: string;
  notes?: string;
  /** Desglose legacy (saveProjectItem en script.js). */
  materialsCost?: number;
  laborCost?: number;
  otherCosts?: number;
  markup?: number;
  created?: string;
  subcategories?: PMSubcategorySelection[];
}

/** Costos por subcategoría por área (claves = nombre área → nombre trabajo → costos). */
export type PmSubcategoryDatabase = Record<
  string,
  Record<string, { materials: number; labor: number; unit: string }>
>;

export interface PMPhaseProvider {
  id: string;
  name: string;
  role: string;
  phone: string;
}

export interface PMPhaseNote {
  id: string;
  text: string;
  priority: string;
  createdAt: string;
}

export interface PMPhaseMeta {
  estimatedDays: number;
  coordinator: string;
  providers: PMPhaseProvider[];
  notes: PMPhaseNote[];
}

export interface ProjectManagerData {
  projectId: number;
  projectName: string;
  created: string;
  lastUpdated: string;
  status: string;
  dealRepairBudget: number;
  budget: { total: number; used: number; remaining: number };
  timeline: {
    startDate: string;
    estimatedCompletion: string;
    phases: unknown[];
  };
  items: PMItem[];
  subcategoryDatabase?: PmSubcategoryDatabase;
  /** Sobrescribe interior/exterior por área personalizada. */
  areaCategoryMap?: Record<string, "INTERIOR" | "EXTERIOR">;
  /** Metadatos por fase: clave `${category}::${area}`. */
  phaseMeta?: Record<string, PMPhaseMeta>;
}

export interface UnderwritingInputs {
  propertyAddress: string;
  projectMonths: number;
  arv: number;
  purchasePrice: number;
  rehabBudget: number;
  closingCosts: number;
  holdingCosts: number;
  cashOnHand: number;
  downPaymentAmount: number;
  downPaymentPercent: number;
  hmlPointsRate: number;
  hmlInterestRate: number;
  interestType: "monthly" | "annual";
  hmlAdminFees: number;
  reCommissions: number;
  resaleClosingCosts: number;
  profitMinPercent: number;
  profitMinAmount: number;
}
