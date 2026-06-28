import { Circle, Star } from "lucide-react";
import { scoreLabel } from "@/lib/plans";
import { cn, euros } from "@/lib/utils";
import type { AnalysisResult } from "@/lib/types";

function scoreTone(score: number) {
  if (score >= 9) return { dot: "text-emerald-300 fill-emerald-300", ring: "border-emerald-300/40 bg-emerald-400/10" };
  if (score >= 8) return { dot: "text-green-400 fill-green-400", ring: "border-green-400/40 bg-green-400/10" };
  if (score >= 6) return { dot: "text-amber-300 fill-amber-300", ring: "border-amber-300/40 bg-amber-400/10" };
  if (score >= 4) return { dot: "text-orange-400 fill-orange-400", ring: "border-orange-400/40 bg-orange-400/10" };
  return { dot: "text-rose-400 fill-rose-400", ring: "border-rose-400/40 bg-rose-400/10" };
}

export function ScoreCard({ result }: { result: AnalysisResult }) {
  const label = scoreLabel(result.globalScore);
  const tone = scoreTone(result.globalScore);
  const rows = [
    ["Prix", result.priceScore],
    ["État", result.conditionScore],
    ["Demande", result.demandScore],
    ["Revente", result.resalePotentialScore],
    ["Marge", result.marginScore],
    ["Risque", result.riskScore]
  ] as const;

  return (
    <section className="rounded-lg border border-white/10 bg-panel p-5 shadow-glow">
      <div className={cn("mb-5 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold", tone.ring, label.color)}>
        <Circle size={10} className={tone.dot} />
        {label.label}
      </div>
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-muted">Score principal</p>
          <div className="mt-2 flex items-end gap-3">
            <strong className="text-6xl leading-none">{result.globalScore.toFixed(1)}</strong>
            <span className="pb-2 text-xl text-muted">/10</span>
          </div>
          <p className="mt-3 max-w-md text-sm leading-6 text-muted">{result.summary}</p>
        </div>
        <div className="grid min-w-64 gap-2">
          {rows.map(([name, value]) => (
            <div key={name} className="flex items-center justify-between gap-4 rounded-md bg-white/[0.04] px-3 py-2">
              <span className="text-sm text-muted">{name}</span>
              <span className="flex items-center gap-1 font-semibold">
                <Star size={15} className="fill-accent text-accent" />
                {value}/10
              </span>
            </div>
          ))}
        </div>
      </div>

      {result.market && (
        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <Metric label="Marque détectée" value={result.market.detectedBrand} />
          <Metric label="Catégorie" value={result.market.detectedCategory} />
          <Metric label="Prix neuf estimé" value={euros(result.market.retailPriceEstimate)} />
          <Metric label="Prix Vinted moyen" value={euros(result.market.vintedComparablePrice)} />
        </div>
      )}

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        <Metric label="Prix max achat" value={euros(result.maxBuyPrice)} />
        <Metric label="Prix revente" value={euros(result.recommendedResalePrice)} />
        <Metric label="Marge estimée" value={euros(result.estimatedMargin)} />
        <Metric label="Décision" value={result.decision} />
      </div>

      {result.market && (
        <div className="mt-5 rounded-md border border-white/10 bg-white/[0.03] p-4">
          <p className="text-sm font-semibold text-white">Demande {result.market.demandLevel}</p>
          <p className="mt-2 text-sm leading-6 text-muted">{result.market.conditionImpact}</p>
        </div>
      )}

      {result.listingWarnings && result.listingWarnings.length > 0 && (
        <div className="mt-5 rounded-md border border-rose-400/30 bg-rose-500/10 p-4">
          <p className="text-sm font-semibold text-rose-100">Alertes lues dans le texte de l'annonce</p>
          <ul className="mt-3 grid gap-2 text-sm text-rose-100">
            {result.listingWarnings.map((warning) => (
              <li key={`${warning.label}-${warning.reason}`}>
                <strong>{warning.label}</strong> : {warning.reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.basis && (
        <div className="mt-5 rounded-md border border-white/10 bg-white/[0.03] p-4">
          <p className="text-sm font-semibold text-white">Score basé sur {result.basis.comparableListings} annonces comparables</p>
          <p className="mt-2 text-sm leading-6 text-muted">
            Critères utilisés : {result.basis.sources.join(", ")}. Confiance : {result.basis.confidence}.
          </p>
        </div>
      )}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.03] p-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}
