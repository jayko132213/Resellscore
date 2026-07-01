import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getAdminAccess } from "@/lib/admin-owner";

const schema = z.object({ plan: z.enum(["free", "starter", "pro", "elite"]) });

export async function POST(request: Request) {
  const owner = await getAdminAccess();
  if (!owner.allowed) return NextResponse.json({ error: owner.error }, { status: 403 });

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Plan invalide." }, { status: 400 });

  const admin = createSupabaseAdminClient();
  const plan = parsed.data.plan;
  const renewal = new Date();
  renewal.setDate(renewal.getDate() + 30);

  const update = plan === "free"
    ? {
        plan: "free",
        subscription_status: "inactive",
        paypal_subscription_id: null,
        manual_expires_at: null,
        updated_at: new Date().toISOString()
      }
    : {
        plan,
        subscription_status: "active",
        paypal_subscription_id: null,
        manual_expires_at: renewal.toISOString(),
        updated_at: new Date().toISOString()
      };

  const { data: profile, error } = await admin
    .from("profiles")
    .upsert({ id: user.id, email: user.email, ...update }, { onConflict: "id" })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: "Impossible de changer le plan." }, { status: 500 });
  }

  return NextResponse.json({
    profile,
    plan,
    expiresAt: profile?.manual_expires_at || null
  });
}
