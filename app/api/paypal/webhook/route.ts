import { NextResponse } from "next/server";
import { verifyPaypalWebhook } from "@/lib/paypal";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { PlanKey } from "@/lib/plans";

function parseCustomId(customId?: string) {
  if (!customId) return null;
  const [userId, plan] = customId.split(":");
  if (!userId || !["starter", "pro", "elite"].includes(plan)) return null;
  return { userId, plan: plan as Exclude<PlanKey, "free"> };
}

export async function POST(request: Request) {
  const body = await request.json();
  const valid = await verifyPaypalWebhook(request.headers, body);
  if (!valid) return NextResponse.json({ error: "Signature PayPal invalide." }, { status: 401 });

  const eventType = body.event_type as string;
  const resource = body.resource ?? {};
  const subscriptionId = resource.id || resource.billing_agreement_id;
  const custom = parseCustomId(resource.custom_id);
  const supabase = createSupabaseAdminClient();

  if (custom && subscriptionId) {
    await supabase.from("subscriptions").upsert({
      user_id: custom.userId,
      provider: "paypal",
      plan: custom.plan,
      status: resource.status?.toLowerCase() || "pending",
      paypal_subscription_id: subscriptionId,
      raw_event: body
    }, { onConflict: "paypal_subscription_id" });
  }

  if (custom && ["BILLING.SUBSCRIPTION.ACTIVATED", "BILLING.SUBSCRIPTION.CREATED"].includes(eventType)) {
    await supabase.from("profiles").update({
      plan: custom.plan,
      subscription_status: "active",
      paypal_subscription_id: subscriptionId,
      manual_expires_at: null
    }).eq("id", custom.userId);
  }

  if (custom && [
    "BILLING.SUBSCRIPTION.CANCELLED",
    "BILLING.SUBSCRIPTION.EXPIRED",
    "BILLING.SUBSCRIPTION.SUSPENDED",
    "BILLING.SUBSCRIPTION.PAYMENT.FAILED"
  ].includes(eventType)) {
    await supabase.from("profiles").update({
      plan: "free",
      subscription_status: eventType.includes("PAYMENT.FAILED") ? "past_due" : "inactive",
      paypal_subscription_id: subscriptionId,
      manual_expires_at: null
    }).eq("id", custom.userId);
  }

  return NextResponse.json({ received: true });
}
