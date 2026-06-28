import { NextResponse } from "next/server";
import { z } from "zod";
import { getPaypalAccessToken, getPaypalPlanId, isPaypalConfigured } from "@/lib/paypal";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const schema = z.object({
  plan: z.enum(["starter", "pro", "elite"])
});

const paypalBaseUrl = process.env.NODE_ENV === "production"
  ? "https://api-m.paypal.com"
  : "https://api-m.sandbox.paypal.com";

export async function POST(request: Request) {
  if (process.env.PAYMENT_MODE === "manual") {
    return NextResponse.json({ error: "Paiement manuel actif. Les abonnements automatiques PayPal sont desactives." }, { status: 503 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });

  if (!isPaypalConfigured()) {
    return NextResponse.json({ error: "PayPal n'est pas configuré." }, { status: 503 });
  }

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Plan invalide." }, { status: 400 });

  const planId = getPaypalPlanId(parsed.data.plan);
  if (!planId) return NextResponse.json({ error: "ID de plan PayPal manquant." }, { status: 500 });

  const token = await getPaypalAccessToken();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const response = await fetch(`${paypalBaseUrl}/v1/billing/subscriptions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Prefer: "return=representation"
    },
    body: JSON.stringify({
      plan_id: planId,
      custom_id: `${user.id}:${parsed.data.plan}`,
      application_context: {
        brand_name: "ResellScore",
        locale: "fr-FR",
        user_action: "SUBSCRIBE_NOW",
        return_url: `${siteUrl}/dashboard`,
        cancel_url: `${siteUrl}/pricing`
      }
    })
  });

  const json = await response.json();
  if (!response.ok) return NextResponse.json({ error: "Création PayPal impossible.", details: json }, { status: 502 });

  const approveUrl = json.links?.find((link: { rel: string; href: string }) => link.rel === "approve")?.href;
  return NextResponse.json({ approveUrl, subscriptionId: json.id });
}
