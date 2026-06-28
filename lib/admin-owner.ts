import { createSupabaseServerClient } from "./supabase/server";

export function isDemoMode() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  return url.includes("example.supabase.co") || key === "demo-key";
}

export async function getAdminAccess() {
  const ownerEmail = process.env.ADMIN_OWNER_EMAIL?.toLowerCase();
  if (!ownerEmail) return { allowed: false, demo: isDemoMode(), error: "Panel admin non configure." };

  if (isDemoMode()) return { allowed: true, demo: true, ownerEmail };

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userEmail = user?.email?.toLowerCase();

  if (!userEmail || userEmail !== ownerEmail) {
    return { allowed: false, demo: false, error: "Reserve au proprietaire du site." };
  }

  return { allowed: true, demo: false };
}
