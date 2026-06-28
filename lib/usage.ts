import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizePlan, plans } from "./plans";

export async function getUsageState(supabase: SupabaseClient, userId: string, planValue?: string | null) {
  const plan = normalizePlan(planValue);
  const config = plans[plan];

  if (plan === "free") {
    const { count, error } = await supabase
      .from("usage_logs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);

    if (error) throw error;
    const used = count ?? 0;
    const remaining = Math.max((config.totalLimit ?? 3) - used, 0);
    return { plan, used, remaining, limitLabel: config.limitLabel, canAnalyze: remaining > 0 };
  }

  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const { count, error } = await supabase
    .from("usage_logs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", start.toISOString());

  if (error) throw error;
  if (config.dailyLimit === null) {
    return { plan, used: count ?? 0, remaining: Number.POSITIVE_INFINITY, limitLabel: config.limitLabel, canAnalyze: true };
  }
  const dailyLimit = config.dailyLimit ?? 0;
  const used = count ?? 0;
  const remaining = Math.max(dailyLimit - used, 0);
  return { plan, used, remaining, limitLabel: config.limitLabel, canAnalyze: remaining > 0 };
}
