import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { enforceProfileExpiry } from "@/lib/subscription";
import { plans } from "@/lib/plans";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ signedIn: false, plan: "free", planName: plans.free.name });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, subscription_status, manual_expires_at")
    .eq("id", user.id)
    .single();

  const plan = await enforceProfileExpiry(supabase, user.id, profile);

  return NextResponse.json({
    signedIn: true,
    plan,
    planName: plans[plan].name,
    expiresAt: profile?.manual_expires_at || null
  });
}
