export type SignupWebhookPayload = {
  email: string;
  fullName: string;
  phone: string;
};

/**
 * Notifies LeadConnector (or any compatible URL) after a successful signup.
 * Fails quietly so registration is never blocked. Configure VITE_SIGNUP_WEBHOOK_URL to enable it.
 */
export function notifySignupWebhook(payload: SignupWebhookPayload): void {
  const url =
    typeof import.meta.env.VITE_SIGNUP_WEBHOOK_URL === "string"
      ? import.meta.env.VITE_SIGNUP_WEBHOOK_URL.trim()
      : "";

  if (!url) return;

  const body = {
    email: payload.email,
    fullName: payload.fullName,
    full_name: payload.fullName,
    phone: payload.phone,
    source: "inventory_signup",
  };

  void fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
    .then(async (res) => {
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.warn("Signup webhook response:", res.status, text);
      }
    })
    .catch((err) => {
      console.warn("Signup webhook request failed:", err);
    });
}
