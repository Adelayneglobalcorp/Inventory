// Recibe los eventos de la base de datos (disparadores con pg_net) y los refleja en GoHighLevel:
//   registration → contacto + etiqueta + pipeline + correo de confirmación + aviso a Adelayne
//   interest     → nota + etiqueta + pipeline + aviso a Adelayne (sin correo al cliente)
//   financing    → nota + etiqueta + pipeline + correo al cliente + aviso a Adelayne con todos los datos
// Se protege con un secreto compartido guardado en Supabase Vault (no requiere JWT).
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { addNote, advanceOpportunity, GHL, notifyAdmin, notifyAdminSms, sendEmail, sendSms, upsertContact, type Lang } from "../_shared/ghl.ts";
import { vipSms } from "../_shared/sms.ts";
import { adminFinancing, adminInterest, adminNewUser, adminVipNew, financingClientEmail, money, registrationEmail, loanLabel, SITE_URL, VIP, vipPaymentEmail } from "../_shared/emails.ts";

const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function langOf(...vals: unknown[]): Lang {
  for (const v of vals) {
    const s = String(v ?? "").toLowerCase();
    if (s.startsWith("en")) return "en";
    if (s.startsWith("es")) return "es";
  }
  return "es";
}

async function secretOk(req: Request): Promise<boolean> {
  const provided = req.headers.get("x-inventory-secret") ?? "";
  if (!provided) return false;
  const { data, error } = await admin.rpc("inventory_webhook_secret_ok", { p: provided });
  return !error && data === true;
}

/** Perfil del usuario; si la app aún no lo creó, lo crea ya aprobado (acceso inmediato). */
async function ensureProfile(userId: string) {
  let profile: any = null;
  for (let i = 0; i < 4; i++) {
    const { data } = await admin.from("profiles").select("id, email, full_name, phone, role, is_approved, preferred_language").eq("id", userId).maybeSingle();
    if (data) { profile = data; break; }
    await sleep(1500);
  }
  const { data: au } = await admin.auth.admin.getUserById(userId);
  const user = au?.user;
  if (!profile && user) {
    const meta = user.user_metadata ?? {};
    // Paquete VIP: queda pendiente hasta que se confirme el pago por Zelle.
    const vip = meta.plan === "vip_495";
    const row = {
      id: user.id, email: user.email, full_name: meta.full_name ?? user.email?.split("@")[0],
      phone: meta.phone ?? null,
      ...(vip ? { role: "pendiente", is_approved: false } : { role: "usuario", is_approved: true, approved_at: new Date().toISOString() }),
      preferred_language: langOf(meta.language, meta.preferred_language),
    };
    await admin.from("profiles").upsert(row, { onConflict: "id" });
    profile = row;
  }
  return { profile, user };
}

async function onRegistration(userId: string) {
  const { profile, user } = await ensureProfile(userId);
  if (!user?.email) return { skipped: "sin email" };
  const meta = user.user_metadata ?? {};
  if (profile?.role === "admin" || meta.role === "admin") return { skipped: "admin" };

  const name = profile?.full_name ?? meta.full_name ?? "";
  const phone = profile?.phone ?? meta.phone ?? null;
  const lang = langOf(profile?.preferred_language, meta.language, meta.preferred_language);
  const fromLanding = meta.source === "landing";
  // Registro directo en el sitio web (formulario propio con contraseña).
  const fromWeb = meta.source === "web";
  const PERFILES = ["Inversionista con capital", "Broker o agente inmobiliario", "Quiero empezar a invertir"];
  const perfil = PERFILES.includes(meta.perfil) ? String(meta.perfil) : null;

  const vip = meta.plan === "vip_495";
  // A2P: consentimiento explícito de SMS (casilla opcional del formulario, sin marcar por defecto).
  const smsConsent = meta.sms_consent === true;
  const contactId = await upsertContact({
    email: user.email, fullName: name, phone, lang, perfil,
    tags: ["inventory-registrado", fromLanding || fromWeb ? "inventory-origen-landing" : "inventory-origen-app", ...(vip ? ["vip-investor", "vip-pago-pendiente"] : []), ...(smsConsent ? ["sms-consentimiento"] : [])],
    source: fromWeb ? "Global 360 · Sitio web" : fromLanding ? "Global 360 · Landing" : "Global 360 · App",
  });

  // Paquete VIP (sitio web): orden pendiente + correo con el pago por Zelle + aviso a Adelayne con el enlace para aprobar.
  if (vip) {
    let { data: order } = await admin.from("vip_orders").select("*").eq("user_id", user.id).maybeSingle();
    if (!order) {
      const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
      const ins = await admin.from("vip_orders").insert({
        user_id: user.id, email: user.email, full_name: name, phone, lang, amount: VIP.amount, approve_token: token, contact_id: contactId,
        sms_consent: smsConsent, sms_consent_at: smsConsent ? (meta.sms_consent_at ?? new Date().toISOString()) : null,
      }).select("*").single();
      if (ins.error) throw new Error("vip_orders: " + ins.error.message);
      order = ins.data;
    }
    await advanceOpportunity(contactId, GHL.stages.revision, `Global 360 VIP · ${name || user.email}`, VIP.amount);
    await addNote(contactId, `⭐ Registro VIP Investor Package ($${VIP.amount}) desde el sitio web. Pago por Zelle pendiente de confirmar.` +
      (smsConsent
        ? `\n📱 Consentimiento SMS: SÍ — casilla marcada en global.buycash2day.com (${meta.sms_consent_at ?? new Date().toISOString()}).`
        : "\n📱 Consentimiento SMS: no (no se le envían SMS)."));
    const mail = vipPaymentEmail(lang, name, user.email);
    await sendEmail(contactId, mail.subject, mail.html);
    const approveUrl = `${VIP.approvePage}?t=${order.approve_token}`;
    const adm = adminVipNew({ name, email: user.email, phone, lang, perfil, approveUrl });
    await notifyAdmin(adm.subject, adm.html);
    // SMS (se envían solo cuando VIP_SMS_ENABLED = "true", tras aprobar A2P).
    const smsClient = phone && smsConsent ? await sendSms(contactId, vipSms.payment(lang, name)) : false;
    const smsAdmin = await notifyAdminSms(vipSms.admin({ name, email: user.email, phone, approveUrl }));
    return { contactId, vip: true, smsClient, smsAdmin };
  }
  await advanceOpportunity(contactId, GHL.stages.registrado, `Global 360 · ${name || user.email}`);

  // Registro desde el landing: la persona aún no tiene contraseña → enlace seguro para crearla.
  let setPasswordLink: string | undefined;
  if (fromLanding) {
    const { data: link } = await admin.auth.admin.generateLink({
      type: "recovery", email: user.email, options: { redirectTo: `${SITE_URL}/reset-password` },
    });
    setPasswordLink = link?.properties?.action_link;
  }

  const mail = registrationEmail(lang, name, setPasswordLink);
  await sendEmail(contactId, mail.subject, mail.html);
  const adm = adminNewUser({ name, email: user.email, phone, lang, source: fromWeb ? `Sitio web${perfil ? " · " + perfil : ""}` : fromLanding ? "Landing (formulario)" : "Registro en la app" });
  await notifyAdmin(adm.subject, adm.html);
  return { contactId };
}

async function onInterest(interestId: string) {
  const { data: it } = await admin.from("property_interests")
    .select("id, user_id, notes, created_at, property:properties(id, title, address, city, state, zip_code, price, arv, roi, status)")
    .eq("id", interestId).maybeSingle();
  if (!it) return { skipped: "interés no encontrado" };
  const { profile, user } = await ensureProfile(it.user_id);
  const email = profile?.email ?? user?.email;
  if (!email) return { skipped: "sin email" };
  const prop: any = it.property ?? {};
  const name = profile?.full_name ?? user?.user_metadata?.full_name ?? "";
  const phone = profile?.phone ?? user?.user_metadata?.phone ?? null;
  const address = [prop.address, prop.city, prop.state, prop.zip_code].filter(Boolean).join(", ");

  const contactId = await upsertContact({
    email, fullName: name, phone, lang: langOf(profile?.preferred_language), tags: ["inventory-registrado", "inventory-interes"],
  });
  await addNote(contactId, [
    "🏠 Interés en propiedad (Global 360)",
    `Propiedad: ${prop.title ?? "—"}`, `Dirección: ${address || "—"}`,
    `Precio: ${money(prop.price)} · ARV: ${money(prop.arv)} · ROI: ${prop.roi != null ? prop.roi + "%" : "—"}`,
    `Fecha: ${new Date(it.created_at).toLocaleString("es-US", { timeZone: "America/New_York" })}`,
  ].join("\n"));
  await advanceOpportunity(contactId, GHL.stages.interes, `Global 360 · ${name || email}`, Number(prop.price) || undefined);
  const adm = adminInterest({ name, email, phone, title: prop.title, address, price: prop.price, arv: prop.arv, roi: prop.roi, status: prop.status });
  await notifyAdmin(adm.subject, adm.html);
  return { contactId };
}

async function onFinancing(requestId: string) {
  const { data: f } = await admin.from("financing_requests").select("*").eq("id", requestId).maybeSingle();
  if (!f) return { skipped: "solicitud no encontrada" };
  const { profile } = await ensureProfile(f.user_id);
  const lang = langOf(profile?.preferred_language);

  const contactId = await upsertContact({
    email: f.email, fullName: f.full_name, phone: f.phone, lang, tags: ["inventory-registrado", "inventory-financiamiento"],
  });
  await addNote(contactId, [
    "💰 Solicitud de financiamiento (Global 360)",
    `Tipo: ${loanLabel(f.loan_type, "es")} · Monto solicitado: ${money(f.requested_amount)}`,
    `Propiedad: ${[f.property_address, f.city, f.state, f.postal_code].filter(Boolean).join(", ")}`,
    `Precio de compra: ${money(f.purchase_price)} · Reparación: ${money(f.rehab_budget)} · ARV: ${money(f.after_repair_value)} · Valor estimado: ${money(f.estimated_property_value)}`,
    `Notas: ${f.notes || "—"}`,
  ].join("\n"));
  await advanceOpportunity(contactId, GHL.stages.financiamiento, `Global 360 · ${f.full_name}`, Number(f.requested_amount) || undefined);

  const mail = financingClientEmail(lang, f);
  await sendEmail(contactId, mail.subject, mail.html);
  const adm = adminFinancing(f, lang);
  await notifyAdmin(adm.subject, adm.html);
  return { contactId };
}

/** Recordatorios de pago VIP: a las 24 h y a las 72 h (este último también avisa a Adelayne). Lo llama pg_cron cada hora. */
async function onVipReminders() {
  const now = Date.now();
  const { data: orders } = await admin.from("vip_orders").select("*").eq("status", "pendiente").lt("reminders_sent", 2);
  let sent = 0;
  for (const o of orders ?? []) {
    const age = now - new Date(o.created_at).getTime();
    const due = o.reminders_sent === 0 ? age >= 24 * 3600e3 : age >= 72 * 3600e3;
    if (!due) continue;
    const lang: Lang = o.lang === "en" ? "en" : "es";
    const contactId = o.contact_id ?? await upsertContact({ email: o.email, fullName: o.full_name, phone: o.phone, lang });
    const mail = vipPaymentEmail(lang, o.full_name ?? "", o.email, true);
    await sendEmail(contactId, mail.subject, mail.html);
    if (o.phone && o.sms_consent) await sendSms(contactId, vipSms.reminder(lang, o.full_name ?? ""));
    if (o.reminders_sent === 1) {
      const approveUrl = `${VIP.approvePage}?t=${o.approve_token}`;
      const adm = adminVipNew({ name: o.full_name ?? "", email: o.email, phone: o.phone, lang, approveUrl, reminder: true });
      await notifyAdmin(adm.subject, adm.html);
      await notifyAdminSms(vipSms.admin({ name: o.full_name ?? "", email: o.email, phone: o.phone, approveUrl, reminder: true }));
    }
    await admin.from("vip_orders").update({ reminders_sent: o.reminders_sent + 1, contact_id: contactId }).eq("id", o.id);
    sent++;
  }
  return { sent };
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json(405, { error: "method" });
  if (!(await secretOk(req))) return json(401, { error: "unauthorized" });
  let payload: { type?: string; id?: string };
  try { payload = await req.json(); } catch { return json(400, { error: "json" }); }
  const { type, id } = payload;
  if (!type || !id) return json(400, { error: "type/id" });
  try {
    const result = type === "registration" ? await onRegistration(id)
      : type === "interest" ? await onInterest(id)
      : type === "financing" ? await onFinancing(id)
      : type === "vip_reminders" ? await onVipReminders()
      : { skipped: "tipo desconocido" };
    console.log("ghl-events ok", type, id, JSON.stringify(result));
    return json(200, { ok: true, result });
  } catch (e) {
    console.error("ghl-events error", type, id, String(e));
    return json(500, { ok: false, error: String(e) });
  }
});
