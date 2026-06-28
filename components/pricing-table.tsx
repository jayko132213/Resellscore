import { Check, Crown, Minus, X } from "lucide-react";
import { plans, type PlanKey } from "@/lib/plans";
import { cn } from "@/lib/utils";
import { ButtonLink } from "./ui/button";
import { PaypalSubscribeButton } from "./paypal-subscribe-button";

type FeatureValue = string | boolean;

const planOrder: PlanKey[] = ["free", "starter", "pro", "elite"];

const comparisonRows: { label: string; values: Record<PlanKey, FeatureValue> }[] = [
  {
    label: "Nombre d'analyses",
    values: {
      free: "3 au total",
      starter: "10 / jour",
      pro: "50 / jour",
      elite: "Illimité"
    }
  },
  {
    label: "Profil idéal",
    values: {
      free: "Test",
      starter: "Débutant",
      pro: "Revendeur",
      elite: "Sourcing intensif"
    }
  },
  {
    label: "Score IA complet",
    values: { free: true, starter: true, pro: true, elite: true }
  },
  {
    label: "Prix d'achat maximum conseillé",
    values: { free: true, starter: true, pro: true, elite: true }
  },
  {
    label: "Prix de revente bas / moyen / haut",
    values: { free: true, starter: true, pro: true, elite: true }
  },
  {
    label: "Historique sauvegardé",
    values: { free: "3 résultats", starter: "10/jour", pro: "50/jour", elite: "Illimité" }
  },
  {
    label: "Conseils de négociation",
    values: { free: false, starter: true, pro: true, elite: true }
  },
  {
    label: "Titre optimisé pour revendre",
    values: { free: false, starter: true, pro: true, elite: true }
  },
  {
    label: "Description optimisée",
    values: { free: false, starter: "Simple", pro: "Avancée", elite: "Avancée" }
  },
  {
    label: "Pré-achat Starter+",
    values: { free: false, starter: "Rapide", pro: "Complet", elite: "Expert" }
  },
  {
    label: "Outil Vente Pro+",
    values: { free: false, starter: false, pro: "Complet", elite: "Complet +" }
  },
  {
    label: "Tendances Elite",
    values: { free: false, starter: false, pro: false, elite: true }
  },
  {
    label: "Priorité marge et risque",
    values: { free: false, starter: false, pro: true, elite: true }
  },
  {
    label: "Workflow revendeur régulier",
    values: { free: false, starter: false, pro: true, elite: true }
  },
  {
    label: "Sourcing intensif",
    values: { free: false, starter: false, pro: false, elite: true }
  },
  {
    label: "Usage équipe / gros volume",
    values: { free: false, starter: false, pro: false, elite: true }
  }
];

export function PricingTable({ signedIn = false }: { signedIn?: boolean }) {
  const paypalReady = Boolean(
    process.env.PAYMENT_MODE !== "manual" &&
    process.env.PAYPAL_CLIENT_ID &&
    process.env.PAYPAL_CLIENT_SECRET &&
    process.env.PAYPAL_PLAN_STARTER_ID &&
    process.env.PAYPAL_PLAN_PRO_ID &&
    process.env.PAYPAL_PLAN_ELITE_ID
  );

  return (
    <div className="overflow-hidden rounded-lg border border-white/10 bg-panel shadow-glow">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] border-collapse text-left">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.03]">
              <th className="w-64 px-5 py-5 text-sm font-medium text-muted">Comparer les offres</th>
              {planOrder.map((key) => (
                <th
                  key={key}
                  className={cn(
                    "w-44 border-l border-white/10 px-4 py-5 align-top",
                    key === "elite" && "bg-accent/[0.08]"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-white">{plans[key].name}</span>
                    {key === "elite" && <Crown size={17} className="text-accent" />}
                  </div>
                  <p className="mt-2 text-2xl font-bold text-white">{plans[key].price}</p>
                  <p className="mt-2 min-h-10 text-xs leading-5 text-muted">{plans[key].limitLabel}</p>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {comparisonRows.map((row) => (
              <tr key={row.label} className="border-b border-white/10 last:border-b-0">
                <th className="px-5 py-4 text-sm font-medium text-slate-200">
                  <span className="flex flex-wrap items-center gap-2">
                    {row.label}
                    {row.label.includes("Elite") && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-black uppercase text-ink">
                        <Crown size={11} />
                        Elite
                      </span>
                    )}
                    {row.label.includes("Pro+") && (
                      <span className="inline-flex rounded-full border border-sky-300/35 bg-sky-400/15 px-2 py-0.5 text-[10px] font-black uppercase text-sky-200">
                        Pro+
                      </span>
                    )}
                    {row.label.includes("Starter+") && (
                      <span className="inline-flex rounded-full border border-amber-300/35 bg-amber-400/15 px-2 py-0.5 text-[10px] font-black uppercase text-amber-200">
                        Starter+
                      </span>
                    )}
                  </span>
                </th>
                {planOrder.map((key) => (
                  <td
                    key={`${row.label}-${key}`}
                    className={cn(
                      "border-l border-white/10 px-4 py-4 text-center text-sm",
                      key === "elite" && "bg-accent/[0.05]"
                    )}
                  >
                    <FeatureValue value={row.values[key]} strong={key === "elite"} />
                  </td>
                ))}
              </tr>
            ))}
            <tr className="bg-white/[0.03]">
              <th className="px-5 py-5 text-sm font-medium text-muted">Action</th>
              {planOrder.map((key) => (
                <td key={`${key}-action`} className={cn("border-l border-white/10 px-4 py-5", key === "elite" && "bg-accent/[0.08]")}>
                  {key === "free" ? (
                    <ButtonLink href={signedIn ? "/analyze" : "/signup"}>Essayer</ButtonLink>
                  ) : paypalReady ? (
                    <PaypalSubscribeButton plan={key} disabled={!signedIn} />
                  ) : (
                    <ButtonLink href={`/paiement-manuel?plan=${key}`} variant="secondary">Payer manuellement</ButtonLink>
                  )}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FeatureValue({ value, strong = false }: { value: FeatureValue; strong?: boolean }) {
  if (value === true) {
    return (
      <span className={cn("inline-flex h-7 w-7 items-center justify-center rounded-full bg-accent text-ink", strong && "shadow-[0_0_24px_rgba(74,222,128,0.35)]")}>
        <Check size={17} strokeWidth={3} />
      </span>
    );
  }

  if (value === false) {
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/5 text-slate-500">
        <X size={16} />
      </span>
    );
  }

  if (value === "Limité") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-3 py-1 text-xs font-semibold text-muted">
        <Minus size={14} />
        {value}
      </span>
    );
  }

  const isQuota = typeof value === "string" && (
    value.includes("total") ||
    value.includes("/ jour") ||
    value.includes("/jour") ||
    value.includes("Illimité")
  );

  return (
    <span
      className={cn(
        "inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-100",
        isQuota && "border border-white/15 px-4 py-2 text-sm",
        strong && "bg-accent text-ink"
      )}
    >
      {value}
    </span>
  );
}
