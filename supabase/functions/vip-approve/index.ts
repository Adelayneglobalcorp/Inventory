// Aprobación del pago VIP por Zelle.
// Adelayne recibe (correo/SMS) un enlace personal a la página «aprobar-pago.html?t=…»;
// esa página llama a esta función:
//   POST { t }                      → datos de la orden (para mostrar a quién aprueba)
//   POST { t, action: "approve" }   → activa la cuenta 12 meses + correo de acceso aprobado
//   POST { t, action: "reject" }    → marca el pago como no confirmado + correo a la persona
// El token (64 caracteres aleatorios) es la autorización: solo lo tiene Adelayne y sirve una sola vez.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { addNote, addTags, GHL, notifyAdmin, removeTags, sendEmail, sendSms, setOpportunityStage, upsertContact, type Lang } from "../_shared/ghl.ts";
import { vipSms } from "../_shared/sms.ts";
import { adminVipDecision, VIP, vipApprovedEmail, vipRejectedEmail } from "../_shared/emails.ts";

const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, apikey, authorization, x-client-info",
};
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (req.method !== "POST") return json(405, { error: "method" });
  let body: { t?: string; action?: string };
  try { body = await req.json(); } catch { return json(400, { error: "json" }); }
  const t = String(body.t ?? "");
  if (!/^[a-f0-9]{64}$/.test(t)) return json(404, { error: "not_found" });

  const { data: o } = await admin.from("vip_orders").select("*").eq("approve_token", t).maybeSingle();
  if (!o) return json(404, { error: "not_found" });
  const info = {
    name: o.full_name, email: o.email, phone: o.phone, lang: o.lang, amount: o.amount,
    status: o.status, created_at: o.created_at, decided_at: o.decided_at, access_until: o.access_until,
  };
  if (!body.action) return json(200, { ok: true, order: info });
  if (body.action !== "approve" && body.action !== "reject") return json(400, { error: "action" });
  if (o.status !== "pendiente") return json(409, { error: "already_decided", order: info });

  const lang: Lang = o.lang === "en" ? "en" : "es";
  const name = o.full_name ?? "";
  const nowIso = new Date().toISOString();

  try {
    if (body.action === "approve") {
      const until = new Date();
      until.setFullYear(until.getFullYear() + 1);
      // Se marca primero la orden (evita doble aprobación si se pulsa dos veces).
      const { data: upd } = await admin.from("vip_orders")
        .update({ status: "aprobado", decided_at: nowIso, access_until: until.toISOString() })
        .eq("id", o.id).eq("status", "pendiente").select("id");
      if (!upd?.length) return json(409, { error: "already_decided", order: info });
      const { error: pe } = await admin.from("profiles")
        .update({ role: "usuario", is_approved: true, approved_at: nowIso }).eq("id", o.user_id);
      if (pe) throw new Error("profiles: " + pe.message);
      await admin.auth.admin.updateUserById(o.user_id, { user_metadata: { role: "usuario", payment: "zelle_aprobado" } }).catch(() => undefined);

      // La cuenta ya quedó activa; si algo del CRM falla, se informa pero no se revierte el acceso.
      let warn: string | undefined;
      try {
        const contactId = o.contact_id ?? await upsertContact({ email: o.email, fullName: name, phone: o.phone, lang });
        const mail = vipApprovedEmail(lang, name, until);
        await sendEmail(contactId, mail.subject, mail.html);
        if (o.phone) await sendSms(contactId, vipSms.approved(lang, name));
        await addTags(contactId, ["vip-pagado"]);
        await removeTags(contactId, ["vip-pago-pendiente"]).catch(() => undefined);
        await setOpportunityStage(contactId, GHL.stages.cerrado, `Global 360 VIP · ${name || o.email}`, Number(o.amount) || VIP.amount);
        await addNote(contactId, `✅ Pago VIP por Zelle confirmado ($${o.amount}). Acceso activo hasta ${until.toISOString().slice(0, 10)}.`);
        const adm = adminVipDecision({ name, email: o.email, approved: true });
        await notifyAdmin(adm.subject, adm.html).catch(() => undefined);
      } catch (e) {
        warn = "crm";
        console.error("vip-approve crm", o.id, String(e));
      }
      return json(200, { ok: true, warn, order: { ...info, status: "aprobado", decided_at: nowIso, access_until: until.toISOString() } });
    }

    const { data: upd } = await admin.from("vip_orders")
      .update({ status: "rechazado", decided_at: nowIso }).eq("id", o.id).eq("status", "pendiente").select("id");
    if (!upd?.length) return json(409, { error: "already_decided", order: info });
    const contactId = o.contact_id ?? await upsertContact({ email: o.email, fullName: name, phone: o.phone, lang });
    await addTags(contactId, ["vip-pago-rechazado"]);
    await removeTags(contactId, ["vip-pago-pendiente"]).catch(() => undefined);
    await addNote(contactId, "❌ Pago VIP por Zelle no confirmado. Se le pidió escribir por WhatsApp con su comprobante.");
    const mail = vipRejectedEmail(lang, name, o.email);
    await sendEmail(contactId, mail.subject, mail.html);
    if (o.phone) await sendSms(contactId, vipSms.rejected(lang));
    const adm = adminVipDecision({ name, email: o.email, approved: false });
    await notifyAdmin(adm.subject, adm.html).catch(() => undefined);
    return json(200, { ok: true, order: { ...info, status: "rechazado", decided_at: nowIso } });
  } catch (e) {
    console.error("vip-approve error", o.id, String(e));
    return json(500, { error: "server", detail: String(e) });
  }
});
