import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminAccess } from "@/lib/admin-owner";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const lifetimeExpiresAt = "9999-12-31T23:59:59.999Z";

const schema = z.object({
  action: z.enum(["grant-plan", "grant-lifetime", "grant-elite", "revoke-elite"]),
  email: z.string().email(),
  plan: z.enum(["starter", "pro", "elite"]).optional(),
  expiresAt: z.string().datetime().optional()
});

export async function GET() {
  const owner = await getAdminAccess();
  if (!owner.allowed) return NextResponse.json({ allowed: false, error: owner.error }, { status: 403 });
  return NextResponse.json({ allowed: true, demo: owner.demo });
}

export async function POST(request: Request) {
  const owner = await getAdminAccess();
  if (!owner.allowed) return NextResponse.json({ error: owner.error }, { status: 403 });

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Email ou action invalide." }, { status: 400 });

  const email = parsed.data.email.toLowerCase();

  const plan = parsed.data.action === "grant-elite" || parsed.data.action === "grant-lifetime" ? "elite" : parsed.data.plan;
  const isLifetime = parsed.data.action === "grant-lifetime";
  const isGrant = parsed.data.action === "grant-plan" || parsed.data.action === "grant-elite" || isLifetime;

  if (isGrant && !plan) {
    return NextResponse.json({ error: "Choisis un abonnement." }, { status: 400 });
  }

  if (isGrant && !isLifetime && !parsed.data.expiresAt) {
    return NextResponse.json({ error: "Choisis une date de fin." }, { status: 400 });
  }

  if (isGrant && !isLifetime && parsed.data.expiresAt && new Date(parsed.data.expiresAt).getTime() <= Date.now()) {
    return NextResponse.json({ error: "La date de fin doit etre dans le futur." }, { status: 400 });
  }

  if (owner.demo) {
    return NextResponse.json({
      message: isGrant
        ? isLifetime
          ? `${email} est maintenant Elite a vie en demo.`
          : `${email} est maintenant ${plan} en demo jusqu'au ${new Date(parsed.data.expiresAt || "").toLocaleDateString("fr-FR")}.`
        : `${email} est repasse en Gratuit en demo.`,
      demo: true
    });
  }

  const admin = createSupabaseAdminClient();
  const update = isGrant
    ? {
        plan,
        subscription_status: "active",
        manual_expires_at: isLifetime ? lifetimeExpiresAt : parsed.data.expiresAt,
        paypal_subscription_id: null,
        updated_at: new Date().toISOString()
      }
    : { plan: "free", subscription_status: "inactive", paypal_subscription_id: null, manual_expires_at: null, updated_at: new Date().toISOString() };

  const { error } = await admin.from("profiles").update(update).eq("email", email);
  if (error) return NextResponse.json({ error: "Impossible de modifier ce compte." }, { status: 500 });

  return NextResponse.json({
    message: isGrant
      ? isLifetime
        ? `${email} est maintenant Elite a vie.`
        : `${email} est maintenant ${plan} jusqu'au ${new Date(parsed.data.expiresAt || "").toLocaleDateString("fr-FR")}.`
      : `${email} est repasse en Gratuit.`
  });
}
