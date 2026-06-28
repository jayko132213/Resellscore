import type { PlanKey } from "./plans";

const paypalBaseUrl = process.env.NODE_ENV === "production"
  ? "https://api-m.paypal.com"
  : "https://api-m.sandbox.paypal.com";

export function getPaypalPlanId(plan: Exclude<PlanKey, "free">) {
  const env = {
    starter: process.env.PAYPAL_PLAN_STARTER_ID,
    pro: process.env.PAYPAL_PLAN_PRO_ID,
    elite: process.env.PAYPAL_PLAN_ELITE_ID
  }[plan];

  return env;
}

export function isPaypalConfigured() {
  return Boolean(
    process.env.PAYPAL_CLIENT_ID &&
    process.env.PAYPAL_CLIENT_SECRET &&
    process.env.PAYPAL_PLAN_STARTER_ID &&
    process.env.PAYPAL_PLAN_PRO_ID &&
    process.env.PAYPAL_PLAN_ELITE_ID
  );
}

export async function getPaypalAccessToken() {
  if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
    throw new Error("PayPal credentials are missing.");
  }

  const credentials = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString("base64");
  const response = await fetch(`${paypalBaseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials"
  });

  if (!response.ok) {
    throw new Error("Unable to authenticate with PayPal.");
  }

  const json = await response.json();
  return json.access_token as string;
}

export async function verifyPaypalWebhook(headers: Headers, body: unknown) {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) return false;

  const token = await getPaypalAccessToken();
  const response = await fetch(`${paypalBaseUrl}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      auth_algo: headers.get("paypal-auth-algo"),
      cert_url: headers.get("paypal-cert-url"),
      transmission_id: headers.get("paypal-transmission-id"),
      transmission_sig: headers.get("paypal-transmission-sig"),
      transmission_time: headers.get("paypal-transmission-time"),
      webhook_id: webhookId,
      webhook_event: body
    })
  });

  if (!response.ok) return false;
  const json = await response.json();
  return json.verification_status === "SUCCESS";
}
