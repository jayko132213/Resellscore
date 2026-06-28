import { NextResponse } from "next/server";
import { z } from "zod";
import { runListingAnalysis } from "@/lib/ai";
import { simpleRateLimit } from "@/lib/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getUsageState } from "@/lib/usage";
import { enforceProfileExpiry } from "@/lib/subscription";

const schema = z.object({
  title: z.string().min(3).max(160),
  description: z.string().min(10).max(5000),
  sellerPrice: z.number().positive().max(10000),
  brand: z.string().max(80).optional().nullable(),
  size: z.string().max(40).optional().nullable(),
  condition: z.string().max(80).optional().nullable(),
  vintedUrl: z.string().url().optional().nullable().or(z.literal("")).refine((value) => {
    if (!value) return true;
    try {
      const host = new URL(value).hostname.toLowerCase();
      return host === "vinted.fr" || host.endsWith(".vinted.fr") || host === "vinted.com" || host.endsWith(".vinted.com");
    } catch {
      return false;
    }
  }, "Le lien doit venir de Vinted."),
  photoUrls: z.array(z.string().url()).max(8).default([])
});

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });

  const limited = simpleRateLimit(`analyze:${user.id}`, 10, 60_000);
  if (!limited.allowed) return NextResponse.json({ error: "Trop de requêtes. Réessaie dans une minute." }, { status: 429 });

  const json = await request.json();
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Données invalides." }, { status: 400 });

  const { data: profile } = await supabase.from("profiles").select("plan, subscription_status, manual_expires_at").eq("id", user.id).single();
  const activePlan = await enforceProfileExpiry(supabase, user.id, profile);
  const usage = await getUsageState(supabase, user.id, activePlan);
  if (!usage.canAnalyze) return NextResponse.json({ error: "Quota d'analyse atteint." }, { status: 402 });

  const input = parsed.data;
  const result = await runListingAnalysis({
    title: input.title,
    description: input.description,
    sellerPrice: input.sellerPrice,
    brand: input.brand || undefined,
    size: input.size || undefined,
    condition: input.condition || undefined,
    vintedUrl: input.vintedUrl || undefined,
    photoCount: input.photoUrls.length
  });

  const admin = createSupabaseAdminClient();
  const { data: analysis, error } = await admin
    .from("analyses")
    .insert({
      user_id: user.id,
      title: input.title,
      description: input.description,
      seller_price: input.sellerPrice,
      brand: input.brand,
      size: input.size,
      condition: input.condition,
      vinted_url: input.vintedUrl || null,
      photo_urls: input.photoUrls,
      result
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: "Sauvegarde impossible." }, { status: 500 });

  await admin.from("usage_logs").insert({ user_id: user.id, analysis_id: analysis.id, plan: activePlan });
  return NextResponse.json({ result, analysisId: analysis.id });
}
