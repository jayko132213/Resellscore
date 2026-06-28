import Link from "next/link";
import { Plus } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getUsageState } from "@/lib/usage";
import { plans } from "@/lib/plans";
import type { AnalysisRow, Profile } from "@/lib/types";
import { euros } from "@/lib/utils";
import { hasRealSupabaseConfig } from "@/lib/env";
import { enforceProfileExpiry } from "@/lib/subscription";

export default async function DashboardPage() {
  if (!hasRealSupabaseConfig()) {
    return (
      <main className="shell py-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-4xl font-bold">Dashboard</h1>
            <p className="mt-2 text-muted">Plan Gratuit · 3 analyse(s) restante(s)</p>
          </div>
          <Link href="/analyze" className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-accent px-5 font-semibold text-ink">
            <Plus size={18} />
            Nouvelle analyse
          </Link>
        </div>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <Card label="Plan actuel" value="Gratuit" />
          <Card label="Quota" value="3 analyses au total" />
          <Card label="Restant" value="3" />
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-semibold">Historique</h2>
          <p className="mt-4 rounded-lg border border-white/10 bg-panel p-5 text-muted">Tes analyses apparaîtront ici quand le site sera connecté à Supabase.</p>
        </section>
      </main>
    );
  }

  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single<Profile>();
  const plan = await enforceProfileExpiry(supabase, user.id, profile);
  const usage = await getUsageState(supabase, user.id, plan);
  const { data: analyses } = await supabase
    .from("analyses")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(12)
    .returns<AnalysisRow[]>();

  return (
    <main className="shell py-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-bold">Dashboard</h1>
          <p className="mt-2 text-muted">Plan {plans[plan].name} · {usage.remaining} analyse(s) restante(s)</p>
        </div>
        <Link href="/analyze" className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-accent px-5 font-semibold text-ink">
          <Plus size={18} />
          Nouvelle analyse
        </Link>
      </div>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        <Card label="Plan actuel" value={plans[plan].name} />
        <Card label="Quota" value={plans[plan].limitLabel} />
        <Card label="Restant" value={`${usage.remaining}`} />
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold">Historique</h2>
        <div className="mt-4 grid gap-3">
          {(analyses ?? []).length === 0 && <p className="rounded-lg border border-white/10 bg-panel p-5 text-muted">Aucune analyse sauvegardée pour le moment.</p>}
          {(analyses ?? []).map((analysis) => (
            <Link key={analysis.id} href={`/analyze?id=${analysis.id}`} className="rounded-lg border border-white/10 bg-panel p-4 transition hover:border-accent/60">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="font-semibold">{analysis.title}</h3>
                  <p className="text-sm text-muted">{analysis.brand || "Marque non précisée"} · Prix vendeur {euros(analysis.seller_price)}</p>
                </div>
                <strong className="text-accent">{analysis.result.globalScore}/10</strong>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-panel p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}
