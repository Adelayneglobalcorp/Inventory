import {
  PM_SUBCATEGORY_DATABASE_DEFAULT,
  defaultCategoryForArea,
} from "./pmDefaults";
import type { FixFlipProject, ProjectManagerData, PmSubcategoryDatabase } from "./types";

function deepClonePmDb<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

/** Igual que `ensureProjectSubcategoryDatabase`: fusiona defaults con datos guardados. */
export function mergePmSubcategoryDatabase(stored: unknown): PmSubcategoryDatabase {
  const base = deepClonePmDb(PM_SUBCATEGORY_DATABASE_DEFAULT);
  if (!stored || typeof stored !== "object" || Array.isArray(stored)) return base;
  const s = stored as PmSubcategoryDatabase;
  for (const area of Object.keys(base)) {
    if (!s[area] || typeof s[area] !== "object") continue;
    for (const sub of Object.keys(base[area])) {
      if (s[area][sub] && typeof s[area][sub] === "object") {
        base[area][sub] = { ...base[area][sub], ...s[area][sub] };
      }
    }
    for (const sub of Object.keys(s[area])) {
      if (!base[area][sub]) {
        base[area][sub] = { ...s[area][sub] };
      }
    }
  }
  for (const area of Object.keys(s)) {
    if (!base[area]) base[area] = { ...s[area] };
  }
  return base;
}

export function hydrateProjectManagerData(data: ProjectManagerData): ProjectManagerData {
  const mergedDb = mergePmSubcategoryDatabase(data.subcategoryDatabase);
  const map: Record<string, "INTERIOR" | "EXTERIOR"> = {
    ...(data.areaCategoryMap ?? {}),
  };
  for (const area of Object.keys(mergedDb)) {
    if (!map[area]) map[area] = defaultCategoryForArea(area);
  }
  return {
    ...data,
    subcategoryDatabase: mergedDb,
    areaCategoryMap: map,
    phaseMeta: { ...(data.phaseMeta ?? {}) },
  };
}

const PROJECTS_KEY = "fixFlipProjects";

export function loadProjects(): FixFlipProject[] {
  try {
    const raw = localStorage.getItem(PROJECTS_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function saveProjects(projects: FixFlipProject[]): void {
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

export function loadPmData(dealId: number): ProjectManagerData | null {
  try {
    const raw = localStorage.getItem(`pm_${dealId}`);
    if (!raw) return null;
    return JSON.parse(raw) as ProjectManagerData;
  } catch {
    return null;
  }
}

export function savePmData(dealId: number, data: ProjectManagerData): void {
  localStorage.setItem(`pm_${dealId}`, JSON.stringify(data));
}

export function createDefaultPmData(
  dealId: number,
  repairBudget: number,
): ProjectManagerData {
  const now = new Date().toISOString();
  return hydrateProjectManagerData({
    projectId: dealId,
    projectName: `Proyecto ${dealId}`,
    created: now,
    lastUpdated: now,
    status: "ACTIVE",
    dealRepairBudget: repairBudget,
    budget: {
      total: repairBudget,
      used: 0,
      remaining: repairBudget,
    },
    timeline: {
      startDate: now,
      estimatedCompletion: new Date(
        Date.now() + 6 * 30 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      phases: [],
    },
    items: [],
    areaCategoryMap: {},
    phaseMeta: {},
  });
}

/** Match legacy updateBudget(); sin líneas, el total sigue el presupuesto del deal. */
export function recalcPmBudget(data: ProjectManagerData): ProjectManagerData {
  const items = data.items || [];
  const lineEstimated = items.reduce(
    (s, i) => s + (Number(i.totalEstimated) || 0),
    0,
  );
  const totalActual = items.reduce(
    (s, i) => s + (Number(i.totalActual) || 0),
    0,
  );
  const baseline = Number(data.dealRepairBudget) || 0;
  const totalEstimated =
    lineEstimated > 0 ? lineEstimated : baseline;
  return {
    ...data,
    budget: {
      total: totalEstimated,
      used: totalActual,
      remaining: totalEstimated - totalActual,
    },
    lastUpdated: new Date().toISOString(),
  };
}
