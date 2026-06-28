import { redirect } from "next/navigation";
import { AnalyzeForm } from "@/components/analyze-form";
import { requireUser } from "@/lib/auth";
import { getUsageState } from "@/lib/usage";
import type { AnalysisRow, Profile } from "@/lib/types";
import { hasRealSupabaseConfig } from "@/lib/env";
import { enforceProfileExpiry } from "@/lib/subscription";

export default async function AnalyzePage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  if (!hasRealSupabaseConfig()) {
    return (
      <main className="shell py-10">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-bold">Nouvelle analyse</h1>
          <p className="mt-2 text-muted">Ajoute un lien Vinted, une photo produit ou une capture d'écran de l'annonce.</p>
        </div>
        <AnalyzeForm initialResult={null} canAnalyze demoMode />
      </main>
    );
  }

  const { id } = await searchParams;
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single<Profile>();
  const plan = await enforceProfileExpiry(supabase, user.id, profile);
  const usage = await getUsageState(supabase, user.id, plan);

  let selected: AnalysisRow | null = null;
  if (id) {
    const { data } = await supabase.from("analyses").select("*").eq("id", id).eq("user_id", user.id).single<AnalysisRow>();
    selected = data;
    if (!selected) redirect("/dashboard");
  }

  return (
    <main className="shell py-10">
      <div className="max-w-3xl">
        <h1 className="text-4xl font-bold">Nouvelle analyse</h1>
        <p className="mt-2 text-muted">{usage.remaining} analyse(s) restante(s). Les liens Vinted sont acceptés comme contexte, sans scraping automatique.</p>
      </div>
      <AnalyzeForm initialResult={selected?.result ?? null} canAnalyze={usage.canAnalyze} />
    </main>
  );
}
