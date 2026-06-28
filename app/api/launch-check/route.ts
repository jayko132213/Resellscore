import { NextResponse } from "next/server";

function isSet(value?: string) {
  return Boolean(value && value.trim().length > 0);
}

function isRealSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  return isSet(url) && isSet(key) && !url.includes("example.supabase.co") && key !== "demo-key";
}

export async function GET() {
  const manualPayment = process.env.PAYMENT_MODE === "manual";
  const checks = {
    siteUrl: isSet(process.env.NEXT_PUBLIC_SITE_URL),
    supabase: isRealSupabase() && isSet(process.env.SUPABASE_SERVICE_ROLE_KEY),
    openai: isSet(process.env.OPENAI_API_KEY),
    payment: manualPayment || [
      process.env.PAYPAL_CLIENT_ID,
      process.env.PAYPAL_CLIENT_SECRET,
      process.env.PAYPAL_PLAN_STARTER_ID,
      process.env.PAYPAL_PLAN_PRO_ID,
      process.env.PAYPAL_PLAN_ELITE_ID,
      process.env.PAYPAL_WEBHOOK_ID
    ].every(isSet),
    admin: isSet(process.env.ADMIN_OWNER_EMAIL)
  };

  const ready = Object.values(checks).every(Boolean);

  return NextResponse.json({
    ready,
    paymentMode: manualPayment ? "manual" : "paypal",
    checks,
    message: ready
      ? "ResellScore est pret pour un lancement public."
      : "Il manque encore des variables avant lancement public."
  });
}
