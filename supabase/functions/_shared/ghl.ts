// Cliente mínimo de la API pública de GoHighLevel (LeadConnector) para la subcuenta BuyCash 2day.
// El token (GHL_PIT) vive solo como secreto de Supabase; nunca llega al navegador.

const GHL_BASE = "https://services.leadconnectorhq.com";

export const GHL = {
  locationId: Deno.env.get("GHL_LOCATION_ID") ?? "d9ywc9jnJ91bEk3uYHfg",
  adminContactId: Deno.env.get("GHL_ADMIN_CONTACT_ID") ?? "muTjlvcnhpLsKwqz4poM",
  emailFrom: Deno.env.get("GHL_EMAIL_FROM") ?? "Global 360 · Adelayne Global Corp <Global360@info.buycash2day.com>",
  pipelineId: Deno.env.get("GHL_PIPELINE_ID") ?? "r6xWZWU7zBV9xvzexMCe",
  stages: {
    registrado: "1ba856fa-8125-4f0b-bd50-633fe77856bb",
    interes: "58b5c5a8-be60-43cb-922d-95e2ff86349e",
    financiamiento: "047ad536-5085-4d4c-b3fd-49c2e3090422",
    revision: "640ac899-cb6f-48d5-a87c-c7f572453978",
    cerrado: "a3fea1e8-c3c2-4869-8549-428ad86aa33c",
  } as const,
  fields: {
    idioma: "UUUaEsoEeOKUOUmQnivX",
    perfil: "GIXonwhasyPfHRJIEVgb",
  },
};

const STAGE_ORDER = [
  GHL.stages.registrado,
  GHL.stages.interes,
  GHL.stages.financiamiento,
  GHL.stages.revision,
  GHL.stages.cerrado,
];

async function ghl(path: string, init: RequestInit = {}): Promise<any> {
  const token = Deno.env.get("GHL_PIT");
  if (!token) throw new Error("GHL_PIT no está configurado");
  const res = await fetch(GHL_BASE + path, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Version: "2021-07-28",
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const text = await res.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    throw new Error(`GHL ${init.method ?? "GET"} ${path} → ${res.status}: ${typeof data === "string" ? data : JSON.stringify(data)}`);
  }
  return data;
}

export type Lang = "es" | "en";

export function splitName(fullName: string | null | undefined): { firstName?: string; lastName?: string } {
  const clean = (fullName ?? "").trim().replace(/\s+/g, " ");
  if (!clean) return {};
  const [first, ...rest] = clean.split(" ");
  return { firstName: first, lastName: rest.join(" ") || undefined };
}

/** Crea o actualiza el contacto (por email/teléfono) y devuelve su id. */
export async function upsertContact(input: {
  email: string;
  fullName?: string | null;
  phone?: string | null;
  lang?: Lang;
  tags?: string[];
  source?: string;
  perfil?: string | null;
}): Promise<string> {
  const customFields: { id: string; field_value: string }[] = [];
  if (input.lang) customFields.push({ id: GHL.fields.idioma, field_value: input.lang === "en" ? "English" : "Español" });
  if (input.perfil) customFields.push({ id: GHL.fields.perfil, field_value: input.perfil });
  const body: Record<string, unknown> = {
    locationId: GHL.locationId,
    email: input.email,
    ...splitName(input.fullName),
    ...(input.phone ? { phone: input.phone } : {}),
    // Las etiquetas NO van en el upsert: GHL reemplaza las existentes. Se agregan después con addTags.
    ...(input.source ? { source: input.source } : {}),
    ...(customFields.length ? { customFields } : {}),
  };
  const data = await ghl("/contacts/upsert", { method: "POST", body: JSON.stringify(body) });
  const id = data?.contact?.id;
  if (!id) throw new Error("GHL no devolvió el id del contacto");
  // Etiqueta de idioma (idioma-es / idioma-en): deja solo la del idioma actual.
  const tags = [...(input.tags ?? [])];
  if (input.lang) {
    tags.push(`idioma-${input.lang}`);
    await removeTags(id, [`idioma-${input.lang === "en" ? "es" : "en"}`]).catch(() => undefined);
  }
  if (tags.length) await addTags(id, tags);
  return id;
}

export async function addTags(contactId: string, tags: string[]): Promise<void> {
  await ghl(`/contacts/${contactId}/tags`, { method: "POST", body: JSON.stringify({ tags }) });
}

export async function removeTags(contactId: string, tags: string[]): Promise<void> {
  await ghl(`/contacts/${contactId}/tags`, { method: "DELETE", body: JSON.stringify({ tags }) });
}

export async function addNote(contactId: string, body: string): Promise<void> {
  await ghl(`/contacts/${contactId}/notes`, { method: "POST", body: JSON.stringify({ body }) });
}

/** Crea u actualiza la oportunidad del contacto en el pipeline Inventory, sin retroceder de etapa. */
export async function advanceOpportunity(contactId: string, stageId: string, name: string, monetaryValue?: number): Promise<void> {
  const search = await ghl(
    `/opportunities/search?location_id=${GHL.locationId}&pipeline_id=${GHL.pipelineId}&contact_id=${contactId}&limit=1`,
  ).catch(() => null);
  const current = search?.opportunities?.[0];
  if (current) {
    const from = STAGE_ORDER.indexOf(current.pipelineStageId);
    const to = STAGE_ORDER.indexOf(stageId);
    const update: Record<string, unknown> = {};
    if (to > from) update.pipelineStageId = stageId;
    if (monetaryValue && monetaryValue > (current.monetaryValue ?? 0)) update.monetaryValue = monetaryValue;
    if (Object.keys(update).length) {
      await ghl(`/opportunities/${current.id}`, { method: "PUT", body: JSON.stringify({ pipelineId: GHL.pipelineId, ...update }) });
    }
    return;
  }
  await ghl("/opportunities/", {
    method: "POST",
    body: JSON.stringify({
      locationId: GHL.locationId,
      pipelineId: GHL.pipelineId,
      pipelineStageId: stageId,
      contactId,
      name,
      status: "open",
      ...(monetaryValue ? { monetaryValue } : {}),
    }),
  });
}

/** Envía un correo al contacto desde GHL (queda en su conversación). */
export async function sendEmail(contactId: string, subject: string, html: string): Promise<void> {
  await ghl("/conversations/messages", {
    method: "POST",
    body: JSON.stringify({ type: "Email", contactId, subject, html, emailFrom: GHL.emailFrom }),
  });
}

/** Aviso interno por correo a Adelayne. */
export async function notifyAdmin(subject: string, html: string): Promise<void> {
  await sendEmail(GHL.adminContactId, subject, html);
}
