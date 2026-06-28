import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const schema = z.object({ plan: z.enum(["starter", "pro", "elite"]) });

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Simulation désactivée en production." }, { status: 403 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Plan invalide." }, { status: 400 });

  const admin = createSupabaseAdminClient();
  await admin.from("profiles").update({
    plan: parsed.data.plan,
    subscription_status: "active",
    paypal_subscription_id: `dev_${user.id}_${parsed.data.plan}`,
    manual_expires_at: null
  }).eq("id", user.id);

  return NextResponse.json({ ok: true });
}
