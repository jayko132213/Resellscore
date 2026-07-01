import { ArrowRight, Calculator, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { PricingTable } from "@/components/pricing-table";
import { ReviewsSection } from "@/components/reviews-section";
import { EliteFindsSection } from "@/components/elite-finds-section";

export default function HomePage() {
  const steps = [
    { Icon: Sparkles, title: "Envoie l'annonce", text: "Lien Vinted, photo/capture ou description manuelle." },
    { Icon: TrendingUp, title: "Compare le marché", text: "ResellScore estime demande, marge, prix de revente et risque." },
    { Icon: ShieldCheck, title: "Décide vite", text: "Acheter, négocier ou éviter avec une recommandation claire." }
  ];

  return (
    <main>
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(74,222,128,0.16),transparent_34%),radial-gradient(circle_at_80%_10%,rgba(167,139,250,0.12),transparent_28%),#08090d]">
        <div className="shell grid min-h-[calc(100vh-64px)] items-center gap-10 py-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="mb-4 inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-muted">SaaS d'analyse pour revendeurs Vinted et vintage</p>
            <h1 className="max-w-3xl text-5xl font-bold leading-tight md:text-7xl">ResellScore</h1>
            <p className="mt-5 max-w-2xl text-xl leading-8 text-slate-300">Analyse une annonce Vinted en quelques secondes et découvre si elle vaut le coup.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/analyze">Analyser une annonce</ButtonLink>
              <ButtonLink href="/pricing" variant="secondary">Voir les tarifs</ButtonLink>
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-panel p-5 shadow-glow">
            <div className="flex items-start justify-between">
              <div>
                <p className="flex items-center gap-2 text-sm text-muted"><Calculator size={16} className="text-accent" /> Simulateur de décision</p>
                <h2 className="mt-1 text-2xl font-semibold">Acheter, négocier ou éviter</h2>
              </div>
              <span className="rounded-full bg-accent px-3 py-1 text-sm font-bold text-ink">IA</span>
            </div>
            <div className="mt-6 grid gap-3">
              {[
                ["Score global", "8.6 / 10"],
                ["Prix max conseillé", "34 €"],
                ["Revente probable", "72 €"],
                ["Décision", "Négocier"]
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between rounded-md bg-white/[0.04] p-3">
                  <span className="text-muted">{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
            <p className="mt-5 text-sm text-muted">Une interface claire pour transformer une annonce en décision rapide, sans promettre de résultat garanti.</p>
          </div>
        </div>
      </section>

      <section className="shell py-20">
        <h2 className="text-3xl font-bold">Comment ça marche</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {steps.map(({ Icon, title, text }) => (
            <article key={title} className="rounded-lg border border-white/10 bg-panel p-5">
              <Icon className="text-accent" />
              <h3 className="mt-4 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <EliteFindsSection />

      <section className="border-y border-white/10 bg-white/[0.03] py-20">
        <div className="shell">
          <div className="flex items-center justify-between gap-6">
            <h2 className="text-3xl font-bold">Tarifs</h2>
            <ArrowRight className="hidden text-accent md:block" />
          </div>
          <div className="mt-8">
            <PricingTable />
          </div>
        </div>
      </section>

      <section className="shell py-20">
        <h2 className="text-3xl font-bold">FAQ</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {[
            ["ResellScore scrape Vinted ?", "Non. L'utilisateur peut coller un lien à titre informatif, mais l'application n'effectue pas de scraping automatique."],
            ["Les résultats sont garantis ?", "Non. Les scores et marges sont des estimations destinées à aider la décision."],
            ["Puis-je commencer gratuitement ?", "Oui. Le plan gratuit inclut 3 analyses au total."],
            ["Les clés IA sont-elles exposées ?", "Non. Les appels IA passent par une route serveur sécurisée."]
          ].map(([q, a]) => (
            <article key={q} className="rounded-lg border border-white/10 bg-panel p-5">
              <h3 className="font-semibold">{q}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{a}</p>
            </article>
          ))}
        </div>
      </section>

      <ReviewsSection />
    </main>
  );
}
