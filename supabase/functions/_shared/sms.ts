// Plantillas SMS del paquete VIP (cliente en su idioma; avisos a Adelayne en español).
// Los SMS salen por el número de la subcuenta en GHL y solo se envían cuando el secreto
// VIP_SMS_ENABLED = "true" (activarlo cuando el registro A2P esté aprobado). Mientras tanto
// todo sigue funcionando por correo y estos mensajes no se envían.
import type { Lang } from "./ghl.ts";
import { SITE_URL, VIP } from "./emails.ts";

export const smsEnabled = () => (Deno.env.get("VIP_SMS_ENABLED") ?? "").toLowerCase() === "true";

const WA = `wa.me/${VIP.whatsapp}`;
const first = (name: string) => (name || "").trim().split(/\s+/)[0] || "";

export const vipSms = {
  /** Al registrarse: instrucciones de pago. */
  payment(lang: Lang, name: string) {
    const n = first(name);
    return lang === "en"
      ? `Global 360 by Buy Cash 2day: ${n ? n + ", y" : "Y"}our VIP account is created. Pay $${VIP.amount} with Zelle to ${VIP.zelleEmail} and send your receipt on WhatsApp: ${WA}. We'll let you know when your access is active. Reply STOP to opt out.`
      : `Global 360 by Buy Cash 2day: ${n ? n + ", t" : "T"}u cuenta VIP está creada. Paga $${VIP.amount} por Zelle a ${VIP.zelleEmail} y envía tu comprobante por WhatsApp: ${WA}. Te avisamos cuando tu acceso esté activo. Responde STOP para no recibir mensajes.`;
  },
  /** Recordatorio a las 24 h y 72 h. */
  reminder(lang: Lang, name: string) {
    const n = first(name);
    return lang === "en"
      ? `Global 360 by Buy Cash 2day: ${n ? n + ", y" : "Y"}our VIP access is waiting. Complete your $${VIP.amount} Zelle payment to ${VIP.zelleEmail} and send the receipt: ${WA}`
      : `Global 360 by Buy Cash 2day: ${n ? n + ", t" : "T"}u acceso VIP te espera. Completa tu pago de $${VIP.amount} por Zelle a ${VIP.zelleEmail} y envía el comprobante: ${WA}`;
  },
  /** Pago confirmado. */
  approved(lang: Lang, name: string, email: string) {
    const n = first(name);
    return lang === "en"
      ? `Global 360 by Buy Cash 2day: Payment confirmed${n ? ", " + n : ""}! Your VIP access is active for 12 months. Sign in at ${SITE_URL}/login · User: ${email} · Password: the one you created when you signed up. Forgot it? ${SITE_URL}/forgot-password`
      : `Global 360 by Buy Cash 2day: ¡Pago confirmado${n ? ", " + n : ""}! Tu acceso VIP está activo por 12 meses. Ingresa en ${SITE_URL}/login · Usuario: ${email} · Contraseña: la que creaste al registrarte. ¿La olvidaste? ${SITE_URL}/forgot-password`;
  },
  /** Pago no confirmado. */
  rejected(lang: Lang) {
    return lang === "en"
      ? `Global 360 by Buy Cash 2day: We couldn't confirm your VIP payment. Write to us on WhatsApp with your receipt: ${WA}`
      : `Global 360 by Buy Cash 2day: No pudimos confirmar tu pago VIP. Escríbenos por WhatsApp con tu comprobante: ${WA}`;
  },
  /** Aviso a Adelayne: nuevo registro (o recordatorio a las 72 h) con el enlace para aprobar. */
  admin(o: { name: string; email: string; phone?: string | null; approveUrl: string; reminder?: boolean }) {
    const who = `${o.name || o.email}${o.phone ? " (" + o.phone + ")" : ""}`;
    return o.reminder
      ? `Global 360 by Buy Cash 2day · Pago VIP aún pendiente: ${who}. Si ya viste su comprobante, aprueba aquí: ${o.approveUrl}`
      : `Global 360 by Buy Cash 2day · Nuevo registro VIP $${VIP.amount}: ${who}. Pago Zelle pendiente. Al ver su comprobante, aprueba aquí: ${o.approveUrl}`;
  },
};
