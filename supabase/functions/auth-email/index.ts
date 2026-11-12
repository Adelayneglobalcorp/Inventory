// Send Email Hook de Supabase Auth: reemplaza los correos genéricos de Supabase
// (recuperación de contraseña, invitación, cambio de correo, enlace mágico, confirmación)
// por correos con el diseño de Inventory enviados desde GoHighLevel.
// Configuración: Authentication → Hooks → Send Email → HTTPS → esta función.
// El secreto que genera Supabase va en SEND_EMAIL_HOOK_SECRET (formato "v1,whsec_...").
import { Webhook } from "npm:standardwebhooks@1.0.0";
import { sendEmail, upsertContact, type Lang } from "../_shared/ghl.ts";
import { authActionEmail, SITE_URL } from "../_shared/emails.ts";

type HookPayload = {
  user: { id: string; email: string; user_metadata?: Record<string, unknown> };
  email_data: {
    token: string; token_hash: string; redirect_to: string; email_action_type: string;
    site_url: string; token_new?: string; token_hash_new?: string;
  };
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

function langOf(meta: Record<string, unknown> = {}): Lang {
  const s = String(meta.language ?? meta.preferred_language ?? "").toLowerCase();
  return s.startsWith("en") ? "en" : "es";
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json(405, { error: "method" });
  const raw = await req.text();
  const secret = (Deno.env.get("SEND_EMAIL_HOOK_SECRET") ?? "").replace(/^v1,whsec_/, "");
  let payload: HookPayload;
  try {
    payload = new Webhook(secret).verify(raw, Object.fromEntries(req.headers)) as HookPayload;
  } catch (e) {
    console.error("auth-email firma inválida", String(e));
    return json(401, { error: { http_code: 401, message: "invalid signature" } });
  }

  const { user, email_data } = payload;
  const action = email_data.email_action_type;
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const redirectTo = email_data.redirect_to || (action === "recovery" || action === "invite" ? `${SITE_URL}/reset-password` : SITE_URL);
  const verifyType = action === "email_change" ? "email_change" : action;
  const tokenHash = action === "email_change" && email_data.token_hash_new ? email_data.token_hash_new : email_data.token_hash;
  const link = `${supabaseUrl}/auth/v1/verify?token=${encodeURIComponent(tokenHash)}&type=${encodeURIComponent(verifyType)}&redirect_to=${encodeURIComponent(redirectTo)}`;

  try {
    const meta = user.user_metadata ?? {};
    const lang = langOf(meta);
    const contactId = await upsertContact({
      email: user.email, fullName: (meta.full_name as string) ?? null, phone: (meta.phone as string) ?? null, lang,
      tags: action === "recovery" ? ["inventory-recuperacion-contrasena"] : [],
    });
    const mail = authActionEmail(lang, action, link, (meta.full_name as string) ?? "");
    await sendEmail(contactId, mail.subject, mail.html);
    console.log("auth-email enviado", action, user.id);
    return json(200, {});
  } catch (e) {
    console.error("auth-email error", action, String(e));
    // Devolver error hace que Supabase informe el fallo al usuario en vez de fingir que se envió.
    return json(500, { error: { http_code: 500, message: "No se pudo enviar el correo. Intenta de nuevo en unos minutos." } });
  }
});
