// Registro desde el landing (formulario de GHL «Inventory · Acceso anticipado»).
// El workflow de GHL llama a esta función con un webhook (cabecera x-inventory-secret).
// Crea la cuenta en Inventory con acceso inmediato; el disparador de auth.users genera el
// evento «registration», que envía el correo «Crea tu contraseña» desde GHL.
// Si la persona ya tenía cuenta, le enviamos un enlace para restablecer/crear contraseña.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const SITE_URL = (Deno.env.get("SITE_URL") ?? "https://inventoryapp.buycash2day.com").replace(/\/$/, "");

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

function pick(obj: Record<string, any>, ...keys: string[]): string {
  for (const k of keys) {
    const v = k.split(".").reduce((o: any, p) => (o == null ? o : o[p]), obj);
    if (v != null && String(v).trim() !== "") return String(v).trim();
  }
  return "";
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json(405, { error: "method" });
  const provided = req.headers.get("x-inventory-secret") ?? new URL(req.url).searchParams.get("key") ?? "";
  const { data: ok } = await admin.rpc("inventory_webhook_secret_ok", { p: provided });
  if (ok !== true) return json(401, { error: "unauthorized" });

  let body: Record<string, any> = {};
  try { body = await req.json(); } catch { return json(400, { error: "json" }); }

  // GHL envía los datos del contacto en distintos formatos según la acción: se aceptan varios nombres.
  const email = pick(body, "email", "contact.email").toLowerCase();
  const fullName = pick(body, "full_name", "fullName", "name", "contact.name", "contact.full_name") ||
    [pick(body, "first_name", "contact.first_name"), pick(body, "last_name", "contact.last_name")].filter(Boolean).join(" ");
  const phone = pick(body, "phone", "contact.phone");
  const langRaw = pick(body, "language", "idioma", "idioma_preferido", "contact.idioma_preferido").toLowerCase();
  const language = langRaw.startsWith("en") ? "en" : "es";
  if (!email || !email.includes("@")) return json(400, { error: "email requerido" });

  // ¿Ya existe la cuenta?
  const { data: existing } = await admin.from("profiles").select("id").ilike("email", email).maybeSingle();
  if (existing) {
    // Cuenta existente: Supabase envía el correo de recuperación (sale por el hook auth-email, con diseño Inventory).
    const { error } = await admin.auth.resetPasswordForEmail(email, { redirectTo: `${SITE_URL}/reset-password` });
    return json(200, { ok: true, existing: true, recoverySent: !error });
  }

  const password = crypto.randomUUID() + crypto.randomUUID();
  const { data, error } = await admin.auth.admin.createUser({
    email, password, email_confirm: true,
    user_metadata: { full_name: fullName || email.split("@")[0], phone: phone || undefined, language, source: "landing", role: "usuario" },
  });
  if (error) {
    console.error("ghl-invite createUser", error.message);
    return json(500, { ok: false, error: error.message });
  }
  await admin.from("profiles").upsert({
    id: data.user!.id, email, full_name: fullName || email.split("@")[0], phone: phone || null,
    role: "usuario", is_approved: true, approved_at: new Date().toISOString(), preferred_language: language,
  }, { onConflict: "id" });
  return json(200, { ok: true, created: true, userId: data.user!.id });
});
