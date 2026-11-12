// Registro desde el sitio web (formulario de GHL «Inventory · Acceso anticipado»).
// El workflow de GHL llama a esta función con un webhook. Por seguridad NO se confía en los
// datos del cuerpo: se recibe el contact_id y la función lee el contacto directamente de GHL
// (con el token privado) y exige la etiqueta del formulario. Así nadie puede crear cuentas
// llamando a la URL con datos inventados.
// Crea la cuenta con acceso inmediato; el disparador de auth.users genera el evento
// «registration», que envía el correo «Crea tu contraseña» desde GHL.
// Si la persona ya tenía cuenta, se le envía un enlace para restablecer su contraseña.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { GHL } from "../_shared/ghl.ts";

const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const SITE_URL = (Deno.env.get("SITE_URL") ?? "https://inventoryapp.buycash2day.com").replace(/\/$/, "");
const REQUIRED_TAG = "inventory-acceso-anticipado";

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

// deno-lint-ignore no-explicit-any
function pick(obj: Record<string, any>, ...keys: string[]): string {
  for (const k of keys) {
    // deno-lint-ignore no-explicit-any
    const v = k.split(".").reduce((o: any, p) => (o == null ? o : o[p]), obj);
    if (v != null && String(v).trim() !== "") return String(v).trim();
  }
  return "";
}

// deno-lint-ignore no-explicit-any
async function fetchContact(contactId: string): Promise<any | null> {
  const res = await fetch(`https://services.leadconnectorhq.com/contacts/${encodeURIComponent(contactId)}`, {
    headers: { Authorization: `Bearer ${Deno.env.get("GHL_PIT")}`, Version: "2021-07-28", Accept: "application/json" },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.contact ?? null;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json(405, { error: "method" });
  // deno-lint-ignore no-explicit-any
  let body: Record<string, any> = {};
  try { body = await req.json(); } catch { return json(400, { error: "json" }); }

  const contactId = pick(body, "contact_id", "contactId", "contact.id", "id");
  if (!contactId) return json(400, { error: "contact_id requerido" });

  const contact = await fetchContact(contactId);
  if (!contact || contact.locationId !== GHL.locationId) return json(404, { error: "contacto no encontrado" });
  const tags: string[] = (contact.tags ?? []).map((t: string) => String(t).toLowerCase());
  if (!tags.includes(REQUIRED_TAG)) return json(403, { error: "el contacto no viene del formulario" });

  const email = String(contact.email ?? "").trim().toLowerCase();
  if (!email.includes("@")) return json(400, { error: "el contacto no tiene email" });
  const fullName = [contact.firstName, contact.lastName].filter(Boolean).join(" ").trim() || contact.contactName || email.split("@")[0];
  const phone = contact.phone ?? null;
  // deno-lint-ignore no-explicit-any
  const idioma = (contact.customFields ?? []).find((f: any) => f.id === GHL.fields.idioma)?.value ?? "";
  const language = String(idioma).toLowerCase().startsWith("en") ? "en" : "es";

  // ¿Ya existe la cuenta?
  const { data: existing } = await admin.from("profiles").select("id").ilike("email", email).maybeSingle();
  if (existing) {
    // Cuenta existente: el correo de recuperación sale por el hook auth-email (diseño Global 360).
    const { error } = await admin.auth.resetPasswordForEmail(email, { redirectTo: `${SITE_URL}/reset-password` });
    return json(200, { ok: true, existing: true, recoverySent: !error });
  }

  const password = crypto.randomUUID() + crypto.randomUUID();
  const { data, error } = await admin.auth.admin.createUser({
    email, password, email_confirm: true,
    user_metadata: { full_name: fullName, phone: phone || undefined, language, source: "landing", role: "usuario" },
  });
  if (error) {
    console.error("ghl-invite createUser", error.message);
    return json(500, { ok: false, error: error.message });
  }
  await admin.from("profiles").upsert({
    id: data.user!.id, email, full_name: fullName, phone,
    role: "usuario", is_approved: true, approved_at: new Date().toISOString(), preferred_language: language,
  }, { onConflict: "id" });
  console.log("ghl-invite cuenta creada", data.user!.id);
  return json(200, { ok: true, created: true, userId: data.user!.id });
});
