// Plantillas de correo de Global 360 (ES/EN). Diseño claro, tablas y estilos en línea,
// botón "bulletproof" (relleno en la celda) para que se vea igual en Gmail, Outlook y móvil.
import type { Lang } from "./ghl.ts";

export const SITE_URL = (Deno.env.get("SITE_URL") ?? "https://inventoryapp.buycash2day.com").replace(/\/$/, "");
const LOGO = "https://files.leadconnectorhq.com/file/6af63a7b9b3d448d8097c581/global-360-fondos-claros.png";

const C = { navy: "#0b1730", gold: "#d9ad4f", goldDark: "#b8862d", text: "#4a5468", muted: "#8a93a6", soft: "#f6f7fa", line: "#e6e9f0" };
const FONT = "Arial,Helvetica,sans-serif";

export function esc(v: unknown): string {
  return String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

export function money(v: unknown, lang: Lang = "es"): string {
  const n = Number(v);
  if (v === null || v === undefined || v === "" || !Number.isFinite(n)) return "—";
  return new Intl.NumberFormat(lang === "en" ? "en-US" : "es-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

export function button(label: string, href: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;"><tr>
<td align="center" bgcolor="${C.gold}" style="background-color:${C.gold};border-radius:8px;padding:16px 36px;">
<a href="${esc(href)}" target="_blank" style="font-family:${FONT};font-size:14px;font-weight:bold;letter-spacing:1.2px;text-transform:uppercase;color:${C.navy};text-decoration:none;display:inline-block;"><span style="color:${C.navy};text-decoration:none;">${esc(label)}&nbsp;&rarr;</span></a>
</td></tr></table>`;
}

function steps(items: { title: string; text: string }[], heading: string): string {
  const rows = items.map((s, i) => `<tr>
<td width="46" valign="top" style="padding:0 0 18px 0;"><div style="width:30px;height:30px;line-height:30px;border-radius:15px;border:1px solid ${C.gold};color:#f3d488;font-weight:bold;font-size:13px;text-align:center;font-family:${FONT};">0${i + 1}</div></td>
<td valign="top" style="padding:0 0 18px 0;font-family:${FONT};font-size:14px;line-height:1.6;color:#c9d0dc;"><strong style="color:#ffffff;">${esc(s.title)}</strong> ${esc(s.text)}</td></tr>`).join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${C.navy};border-radius:14px;"><tr><td style="padding:26px 26px 8px 26px;">
<p style="margin:0 0 18px 0;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:${C.gold};font-weight:bold;font-family:${FONT};">${esc(heading)}</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${rows}</table></td></tr></table>`;
}

function dataTable(rows: [string, string][]): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid ${C.line};border-radius:12px;background-color:${C.soft};">
${rows.map(([k, v], i) => `<tr><td style="padding:11px 16px;font-family:${FONT};font-size:13px;color:${C.muted};${i ? `border-top:1px solid ${C.line};` : ""}" width="42%">${esc(k)}</td><td style="padding:11px 16px;font-family:${FONT};font-size:14px;color:${C.navy};font-weight:bold;${i ? `border-top:1px solid ${C.line};` : ""}">${esc(v)}</td></tr>`).join("")}
</table>`;
}

function layout(o: { lang: Lang; preheader: string; eyebrow: string; title: string; body: string; footerNote: string; banner?: boolean }): string {
  const team = o.lang === "en" ? "The Global 360 team" : "El equipo de Global 360";
  return `<div style="margin:0;padding:0;background-color:#eef1f6;">
<span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;">${esc(o.preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#eef1f6" style="background-color:#eef1f6;"><tr><td align="center" style="padding:28px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background-color:#ffffff;border-radius:16px;overflow:hidden;">
<tr><td align="center" style="padding:30px 24px 22px 24px;background-color:#ffffff;"><a href="${SITE_URL}" target="_blank"><img src="${LOGO}" width="${o.banner === false ? 120 : 160}" alt="Global 360 by Adelayne Global Corp" style="display:block;width:${o.banner === false ? 120 : 160}px;height:auto;border:0;"></a></td></tr>
<tr><td style="height:4px;line-height:4px;font-size:0;background-color:${C.gold};">&nbsp;</td></tr>
<tr><td style="padding:36px 40px 8px 40px;font-family:${FONT};">
<p style="margin:0 0 10px 0;font-size:12px;letter-spacing:2.5px;text-transform:uppercase;color:${C.goldDark};font-weight:bold;">${esc(o.eyebrow)}</p>
<h1 style="margin:0 0 18px 0;font-size:26px;line-height:1.25;color:${C.navy};font-weight:bold;">${esc(o.title)}</h1>
${o.body}
</td></tr>
<tr><td style="padding:22px 40px 36px 40px;font-family:${FONT};">
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td valign="middle" style="padding:0 14px 0 0;"><img src="${LOGO}" width="64" alt="Global 360" style="display:block;width:64px;height:auto;border:0;"></td>
<td style="border-left:3px solid ${C.gold};padding:2px 0 2px 14px;font-family:${FONT};"><p style="margin:0;font-size:15px;line-height:1.5;color:${C.navy};font-weight:bold;">${team}</p><p style="margin:0;font-size:13px;line-height:1.5;color:${C.muted};">by Adelayne Global Corp</p></td>
</tr></table></td></tr>
<tr><td align="center" style="padding:20px 30px;background-color:${C.navy};font-family:${FONT};font-size:12px;line-height:1.7;color:${C.muted};">${esc(o.footerNote)}<br>Global 360 by Adelayne Global Corp &middot; Fort Lauderdale, FL &middot; <a href="mailto:info@buycash2day.com" style="color:${C.gold};text-decoration:none;">info@buycash2day.com</a></td></tr>
</table></td></tr></table></div>`;
}

const p = (t: string) => `<p style="margin:0 0 16px 0;font-size:16px;line-height:1.7;color:${C.text};">${t}</p>`;
const spacer = (h = 26) => `<div style="height:${h}px;line-height:${h}px;font-size:0;">&nbsp;</div>`;

// ---------- Correos al cliente ----------

/** Confirmación de registro. Si `setPasswordLink` existe (registro desde el landing), el primer paso es crear la contraseña. */
export function registrationEmail(lang: Lang, name: string, setPasswordLink?: string) {
  const first = esc((name || "").split(" ")[0] || (lang === "en" ? "investor" : "inversionista"));
  if (lang === "en") {
    const s = setPasswordLink
      ? [
        { title: "Create your password.", text: "Use the button below; the link is personal and secure." },
        { title: "Sign in to the portal.", text: "Access off-market listings, the calculator, the project manager and financing." },
        { title: "Explore for 7 days.", text: "Your evaluation period has no cost." },
      ]
      : [
        { title: "Sign in to the portal.", text: "Use the email and password you just created." },
        { title: "Explore the tools.", text: "Off-market listings, investment calculator, project manager and financing support." },
        { title: "Evaluate for 7 days.", text: "Your evaluation period has no cost." },
      ];
    return {
      subject: `Welcome to Global 360, ${(name || "").split(" ")[0] || "investor"} — your access is ready`,
      html: layout({
        lang, preheader: "Your Global 360 account is active. Sign in now.", eyebrow: "Registration confirmed",
        title: `Welcome to Global 360, ${first}`,
        body: p("Your account is active and you have <strong style=\"color:#0b1730;\">immediate access</strong> to the private portal for off-market Fix &amp; Flip opportunities.") +
          spacer(8) + steps(s, "Next steps") + spacer() +
          button(setPasswordLink ? "Create my password" : "Sign in to Global 360", setPasswordLink ?? `${SITE_URL}/login`) + spacer(20) +
          p("If you have any questions, simply reply to this email. We are happy to help."),
        footerNote: "You are receiving this email because you registered for Global 360.",
      }),
    };
  }
  const s = setPasswordLink
    ? [
      { title: "Crea tu contraseña.", text: "Usa el botón de abajo; el enlace es personal y seguro." },
      { title: "Ingresa al portal.", text: "Accede al inventario off-market, la calculadora, el project manager y el financiamiento." },
      { title: "Explora durante 7 días.", text: "Tu periodo de evaluación no tiene ningún costo." },
    ]
    : [
      { title: "Ingresa al portal.", text: "Usa el correo y la contraseña que acabas de crear." },
      { title: "Explora las herramientas.", text: "Inventario off-market, calculadora de inversión, project manager y acompañamiento en financiamiento." },
      { title: "Evalúa durante 7 días.", text: "Tu periodo de evaluación no tiene ningún costo." },
    ];
  return {
    subject: `Bienvenido a Global 360, ${(name || "").split(" ")[0] || "inversionista"}: tu acceso está listo`,
    html: layout({
      lang, preheader: "Tu cuenta de Global 360 está activa. Ingresa ahora.", eyebrow: "Registro confirmado",
      title: `Bienvenido a Global 360, ${first}`,
      body: p("Tu cuenta está activa y ya tienes <strong style=\"color:#0b1730;\">acceso inmediato</strong> al portal privado de oportunidades Fix &amp; Flip fuera del mercado.") +
        spacer(8) + steps(s, "Próximos pasos") + spacer() +
        button(setPasswordLink ? "Crear mi contraseña" : "Ingresar a Global 360", setPasswordLink ?? `${SITE_URL}/login`) + spacer(20) +
        p("Si tienes alguna pregunta, simplemente responde a este correo. Será un gusto ayudarte."),
      footerNote: "Recibes este correo porque te registraste en Global 360.",
    }),
  };
}

/** Recuperación de contraseña y demás correos de Auth (link generado por Supabase). */
export function authActionEmail(lang: Lang, action: string, link: string, name?: string) {
  const first = esc((name || "").split(" ")[0]);
  const en = lang === "en";
  const kind = action === "recovery" ? "recovery" : action === "invite" ? "invite" : action === "email_change" ? "email_change" : action === "magiclink" ? "magiclink" : "signup";
  const copy = {
    recovery: en
      ? { subject: "Reset your Global 360 password", eyebrow: "Password recovery", title: "Reset your password", text: "We received a request to reset the password for your Global 360 account. Use the button below to choose a new one. The link expires in 1 hour.", cta: "Reset my password", note: "If you did not request this, you can ignore this email; your password will not change." }
      : { subject: "Restablece tu contraseña de Global 360", eyebrow: "Recuperación de contraseña", title: "Restablece tu contraseña", text: "Recibimos una solicitud para restablecer la contraseña de tu cuenta de Global 360. Usa el botón para elegir una nueva. El enlace vence en 1 hora.", cta: "Restablecer mi contraseña", note: "Si no solicitaste este cambio, ignora este correo; tu contraseña no cambiará." },
    invite: en
      ? { subject: "Your access to Global 360 is ready", eyebrow: "Invitation", title: "Create your password", text: "Your access to Global 360 is ready. Create your password to sign in to the portal.", cta: "Create my password", note: "This link is personal; please do not share it." }
      : { subject: "Tu acceso a Global 360 está listo", eyebrow: "Invitación", title: "Crea tu contraseña", text: "Tu acceso a Global 360 está listo. Crea tu contraseña para ingresar al portal.", cta: "Crear mi contraseña", note: "Este enlace es personal; no lo compartas." },
    email_change: en
      ? { subject: "Confirm your new email for Global 360", eyebrow: "Email change", title: "Confirm your new email", text: "Confirm the email change for your Global 360 account.", cta: "Confirm email", note: "If you did not request this change, contact us." }
      : { subject: "Confirma tu nuevo correo en Global 360", eyebrow: "Cambio de correo", title: "Confirma tu nuevo correo", text: "Confirma el cambio de correo de tu cuenta de Global 360.", cta: "Confirmar correo", note: "Si no solicitaste este cambio, escríbenos." },
    magiclink: en
      ? { subject: "Your Global 360 sign-in link", eyebrow: "Sign in", title: "Your sign-in link", text: "Use the button to sign in to Global 360. The link expires in 1 hour.", cta: "Sign in", note: "If you did not request this, ignore this email." }
      : { subject: "Tu enlace para ingresar a Global 360", eyebrow: "Ingreso", title: "Tu enlace de acceso", text: "Usa el botón para ingresar a Global 360. El enlace vence en 1 hora.", cta: "Ingresar", note: "Si no lo solicitaste, ignora este correo." },
    signup: en
      ? { subject: "Confirm your Global 360 account", eyebrow: "Confirm your email", title: "Confirm your account", text: "Confirm your email to activate your Global 360 account.", cta: "Confirm my account", note: "If you did not create this account, ignore this email." }
      : { subject: "Confirma tu cuenta de Global 360", eyebrow: "Confirma tu correo", title: "Confirma tu cuenta", text: "Confirma tu correo para activar tu cuenta de Global 360.", cta: "Confirmar mi cuenta", note: "Si no creaste esta cuenta, ignora este correo." },
  }[kind];
  return {
    subject: copy.subject,
    html: layout({
      lang, banner: false, preheader: copy.text, eyebrow: copy.eyebrow,
      title: first ? `${copy.title}, ${first}` : copy.title,
      body: p(copy.text) + spacer(10) + button(copy.cta, link) + spacer(22) +
        `<p style="margin:0;font-size:13px;line-height:1.6;color:${C.muted};">${esc(copy.note)}</p>`,
      footerNote: en ? "Security email from your Global 360 account." : "Correo de seguridad de tu cuenta de Global 360.",
    }),
  };
}

export type Financing = {
  loan_type: string; full_name: string; email: string; phone: string; property_address: string; city: string; state: string;
  postal_code?: string | null; requested_amount: number; purchase_price?: number | null; rehab_budget?: number | null;
  after_repair_value?: number | null; estimated_property_value?: number | null; notes?: string | null; created_at?: string;
};

export function loanLabel(t: string, lang: Lang) {
  if (t === "hard_money") return "Hard Money";
  if (t === "dscr") return "DSCR";
  return t || (lang === "en" ? "Not specified" : "Sin especificar");
}

function financingRows(f: Financing, lang: Lang): [string, string][] {
  const en = lang === "en";
  return [
    [en ? "Loan type" : "Tipo de préstamo", loanLabel(f.loan_type, lang)],
    [en ? "Requested amount" : "Monto solicitado", money(f.requested_amount, lang)],
    [en ? "Property" : "Propiedad", [f.property_address, f.city, f.state, f.postal_code].filter(Boolean).join(", ")],
    [en ? "Purchase price" : "Precio de compra", money(f.purchase_price, lang)],
    [en ? "Rehab budget" : "Presupuesto de reparación", money(f.rehab_budget, lang)],
    ["ARV", money(f.after_repair_value, lang)],
    [en ? "Estimated value" : "Valor estimado", money(f.estimated_property_value, lang)],
  ];
}

export function financingClientEmail(lang: Lang, f: Financing) {
  const en = lang === "en";
  const first = esc((f.full_name || "").split(" ")[0]);
  return {
    subject: en ? "We received your financing request — Global 360" : "Recibimos tu solicitud de financiamiento — Global 360",
    html: layout({
      lang, preheader: en ? "Our team will review your request and contact you." : "Nuestro equipo revisará tu solicitud y te contactará.",
      eyebrow: en ? "Financing request" : "Solicitud de financiamiento",
      title: en ? `Thank you, ${first}` : `Gracias, ${first}`,
      body: p(en
        ? "We received your financing request. Our team will review it and contact you shortly with the next steps."
        : "Recibimos tu solicitud de financiamiento. Nuestro equipo la revisará y te contactará en breve con los siguientes pasos.") +
        p(`<strong style="color:#0b1730;">${en ? "Summary of your request" : "Resumen de tu solicitud"}</strong>`) +
        dataTable(financingRows(f, lang)) + spacer() +
        button(en ? "View my request" : "Ver mi solicitud", `${SITE_URL}/financing`) + spacer(20) +
        p(en ? "If you need to add information, simply reply to this email." : "Si necesitas agregar información, simplemente responde a este correo."),
      footerNote: en ? "You are receiving this email because you submitted a financing request in Global 360." : "Recibes este correo porque enviaste una solicitud de financiamiento en Global 360.",
    }),
  };
}

// ---------- Avisos internos (siempre en español, para Adelayne) ----------

function internal(title: string, intro: string, rows: [string, string][], cta?: { label: string; href: string }) {
  return layout({
    lang: "es", banner: false, preheader: intro, eyebrow: "Aviso interno · Global 360", title,
    body: p(intro) + dataTable(rows) + (cta ? spacer(24) + button(cta.label, cta.href) : ""),
    footerNote: "Notificación automática de la plataforma Global 360.",
  });
}

export function adminNewUser(u: { name: string; email: string; phone?: string | null; lang: Lang; source: string }) {
  return {
    subject: `Tienes un nuevo registrado en tu plataforma: ${u.name || u.email}`,
    html: internal("Nuevo registrado en Global 360", "Tienes un nuevo registrado en tu plataforma.", [
      ["Nombre", u.name || "—"], ["Correo", u.email], ["Teléfono", u.phone || "—"],
      ["Idioma", u.lang === "en" ? "English" : "Español"], ["Origen", u.source],
    ], { label: "Ver usuarios", href: `${SITE_URL}/admin` }),
  };
}

export function adminInterest(i: { name: string; email: string; phone?: string | null; title: string; address: string; price?: number | null; arv?: number | null; roi?: number | null; status?: string | null }) {
  return {
    subject: `${i.name || i.email} tiene interés en ${i.title || i.address}`,
    html: internal("Nuevo interés en una propiedad", `${esc(i.name || i.email)} mostró interés en una propiedad del inventario.`, [
      ["Inversionista", i.name || "—"], ["Correo", i.email], ["Teléfono", i.phone || "—"],
      ["Propiedad", i.title || "—"], ["Dirección", i.address || "—"], ["Precio", money(i.price)], ["ARV", money(i.arv)],
      ["ROI", i.roi != null ? `${i.roi}%` : "—"], ["Estado de la propiedad", i.status || "—"],
    ], { label: "Ver intereses", href: `${SITE_URL}/admin` }),
  };
}

export function adminFinancing(f: Financing, lang: Lang) {
  return {
    subject: `Nueva solicitud de financiamiento: ${f.full_name} — ${money(f.requested_amount)}`,
    html: internal("Nueva solicitud de financiamiento", "Hay una persona interesada en financiamiento. Estos son todos los datos que envió:", [
      ["Nombre", f.full_name], ["Correo", f.email], ["Teléfono", f.phone],
      ["Idioma", lang === "en" ? "English" : "Español"],
      ...financingRows(f, "es"), ["Notas", f.notes || "—"],
    ], { label: "Ver solicitudes", href: `${SITE_URL}/admin` }),
  };
}
