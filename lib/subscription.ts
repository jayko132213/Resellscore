import { normalizePlan, type PlanKey } from "./plans";

type ProfileLike = {
  plan?: string | null;
  subscription_status?: string | null;
  manual_expires_at?: string | null;
};

export function isExpired(expiresAt?: string | null) {
  if (expiresAt?.startsWith("9999-")) return false;
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() <= Date.now();
}

export function getProfilePlan(profile?: ProfileLike | null): PlanKey {
  if (!profile || profile.subscription_status !== "active") return "free";
  if (isExpired(profile.manual_expires_at)) return "free";
  return normalizePlan(profile.plan);
}

export async function enforceProfileExpiry(
  supabase: { from: (table: string) => any },
  userId: string,
  profile?: ProfileLike | null
) {
  if (!profile || profile.subscription_status !== "active" || !isExpired(profile.manual_expires_at)) {
    return getProfilePlan(profile);
  }

  await supabase.from("profiles").update({
    plan: "free",
    subscription_status: "inactive",
    paypal_subscription_id: null,
    manual_expires_at: null,
    updated_at: new Date().toISOString()
  }).eq("id", userId);

  return "free" as PlanKey;
}
