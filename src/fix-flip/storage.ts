import {
  PM_SUBCATEGORY_DATABASE_DEFAULT,
  defaultCategoryForArea,
} from "./pmDefaults";
import type { FixFlipProject, ProjectManagerData, PmSubcategoryDatabase, PMSpace } from "./types";
import { supabase } from "@/lib/supabase";

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
  for (const space of data.spaces ?? []) {
    if (!mergedDb[space.name]) mergedDb[space.name] = { ...(mergedDb[space.templateArea] ?? {}) };
    map[space.name] = space.category;
  }
  return {
    ...data,
    subcategoryDatabase: mergedDb,
    areaCategoryMap: map,
    phaseMeta: { ...(data.phaseMeta ?? {}) },
  };
}

const PROJECTS_KEY = "fixFlipProjects";

export function loadProjects(userId?: string): FixFlipProject[] {
  try {
    const raw = localStorage.getItem(PROJECTS_KEY);
    if (!raw && !userId) return [];
    const data = JSON.parse(raw);
    const legacy = Array.isArray(data) ? data : [];
    if (!userId) return legacy;
    const cached = JSON.parse(localStorage.getItem("fixFlipCloudCache:" + userId) || "[]");
    if (!Array.isArray(cached)) return legacy;
    return [...new Map([...legacy, ...cached].map((p: FixFlipProject) => [p.id, p])).values()];
  } catch {
    return [];
  }
}

export function saveProjects(projects: FixFlipProject[], userId?: string): void {
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  if (userId) localStorage.setItem("fixFlipCloudCache:" + userId, JSON.stringify(projects));
}

export function loadPmData(dealId: number, userId?: string): ProjectManagerData | null {
  try {
    const raw = (userId ? localStorage.getItem("fixFlipPmCloud:" + userId + ":" + dealId) : null) ||
      localStorage.getItem(`pm_${dealId}`);
    if (!raw) return null;
    return JSON.parse(raw) as ProjectManagerData;
  } catch {
    return null;
  }
}

export function savePmData(dealId: number, data: ProjectManagerData, userId?: string): void {
  localStorage.setItem(`pm_${dealId}`, JSON.stringify(data));
  if (userId) localStorage.setItem("fixFlipPmCloud:" + userId + ":" + dealId, JSON.stringify(data));
}

export function buildPropertySpaces(snapshot?: FixFlipProject["inventorySnapshot"]): PMSpace[] {
  if (!snapshot) return [];
  const spaces: PMSpace[] = [];
  for (let i = 1; i <= Math.min(30, Math.ceil(Math.max(0, snapshot.bathrooms || 0))); i++)
    spaces.push({ id: "bath-" + i, name: "Baño " + i, category: "INTERIOR", templateArea: "Baños" });
  for (let i = 1; i <= Math.min(30, Math.floor(Math.max(0, snapshot.bedrooms || 0))); i++)
    spaces.push({ id: "bed-" + i, name: "Habitación " + i, category: "INTERIOR", templateArea: "Pintura" });
  spaces.push({ id: "kitchen", name: "Cocina", category: "INTERIOR", templateArea: "Cocina" });
  spaces.push({ id: "living", name: "Sala", category: "INTERIOR", templateArea: "Pintura" });
  return spaces;
}

export function createDefaultPmData(
  dealId: number,
  repairBudget: number,
  snapshot?: FixFlipProject["inventorySnapshot"],
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
    spaces: buildPropertySpaces(snapshot),
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
  // The calculator's rehab budget remains the approved baseline; detail lines
  // are estimates, not a replacement for the original budget.
  const totalEstimated = baseline > 0 ? baseline : lineEstimated;
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

/** Cloud writes are owned by the authenticated user and protected by Supabase RLS.
 * Legacy browser data is never uploaded automatically without explicit consent.
 */
export async function syncCloudProjects(userId: string): Promise<FixFlipProject[]> {
  const { data, error } = await supabase.from("investment_deals")
    .select("payload").eq("user_id", userId);
  if (error) throw error;
  const projects = (data ?? []).map(row => row.payload as FixFlipProject)
    .filter((p) => Number.isFinite(p?.id));
  localStorage.setItem("fixFlipCloudCache:" + userId, JSON.stringify(projects));
  return loadProjects(userId);
}

export async function saveCloudProject(project: FixFlipProject, userId: string): Promise<void> {
  const { error } = await supabase.from("investment_deals").upsert({
    user_id: userId, deal_id: project.id, payload: project, updated_at: new Date().toISOString(),
  }, { onConflict: "user_id,deal_id" });
  if (error) throw error;
  const cacheKey = "fixFlipCloudCache:" + userId;
  const cached = JSON.parse(localStorage.getItem(cacheKey) || "[]") as FixFlipProject[];
  localStorage.setItem(cacheKey, JSON.stringify([...new Map(
    [...cached.filter(p => p.id !== project.id), project].map(p => [p.id, p])
  ).values()]));
}

export async function deleteCloudProject(dealId: number, userId: string): Promise<void> {
  const { error } = await supabase.from("investment_deals")
    .delete().eq("user_id", userId).eq("deal_id", dealId);
  if (error) throw error;
  const key = "fixFlipCloudCache:" + userId;
  const cached = JSON.parse(localStorage.getItem(key) || "[]") as FixFlipProject[];
  localStorage.setItem(key, JSON.stringify(cached.filter(p => p.id !== dealId)));
}

export async function syncCloudPm(dealId: number, userId: string): Promise<ProjectManagerData | null> {
  const { data, error } = await supabase.from("investment_projects")
    .select("payload").eq("user_id", userId).eq("deal_id", dealId).maybeSingle();
  if (error) throw error;
  const result = data?.payload as ProjectManagerData | undefined;
  if (result) localStorage.setItem("fixFlipPmCloud:" + userId + ":" + dealId, JSON.stringify(result));
  return result ?? null;
}

export async function saveCloudPm(dealId: number, data: ProjectManagerData, userId: string): Promise<void> {
  const { error } = await supabase.from("investment_projects").upsert({
    user_id: userId, deal_id: dealId, payload: data, updated_at: new Date().toISOString(),
  }, { onConflict: "user_id,deal_id" });
  if (error) throw error;
  localStorage.setItem("fixFlipPmCloud:" + userId + ":" + dealId, JSON.stringify(data));
}

export async function importLocalDeals(userId: string): Promise<number> {
  const legacy = loadProjects();
  for (const deal of legacy) await saveCloudProject(deal, userId);
  await syncCloudProjects(userId);
  return legacy.length;
}
