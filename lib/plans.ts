export type PlanKey = "free" | "starter" | "pro" | "elite";

export const plans: Record<PlanKey, {
  name: string;
  price: string;
  limitLabel: string;
  dailyLimit: number | null;
  totalLimit?: number;
  paypalEnv?: string;
  highlights: string[];
}> = {
  free: {
    name: "Gratuit",
    price: "0 €",
    limitLabel: "3 analyses au total",
    dailyLimit: null,
    totalLimit: 3,
    highlights: ["Score IA complet", "Historique sauvegardé", "Idéal pour tester"]
  },
  starter: {
    name: "Starter",
    price: "9,99 €/mois",
    limitLabel: "10 analyses par jour",
    dailyLimit: 10,
    paypalEnv: "PAYPAL_PLAN_STARTER_ID",
    highlights: ["10 analyses/jour", "Résultats sauvegardés", "Conseils de négociation"]
  },
  pro: {
    name: "Pro",
    price: "14,99 €/mois",
    limitLabel: "50 analyses par jour",
    dailyLimit: 50,
    paypalEnv: "PAYPAL_PLAN_PRO_ID",
    highlights: ["50 analyses/jour", "Workflow revendeur régulier", "Priorité aux scores marge/risque"]
  },
  elite: {
    name: "Elite",
    price: "23,99 €/mois",
    limitLabel: "Analyses illimitées",
    dailyLimit: null,
    paypalEnv: "PAYPAL_PLAN_ELITE_ID",
    highlights: ["Analyses illimitées", "Pour sourcing intensif", "Opportunités premium"]
  }
};

export function normalizePlan(plan?: string | null): PlanKey {
  return plan === "starter" || plan === "pro" || plan === "elite" ? plan : "free";
}

export function scoreLabel(score: number) {
  if (score >= 9) return { label: "Excellent achat", color: "text-emerald-300", bg: "bg-emerald-400/15" };
  if (score >= 8) return { label: "Très bonne affaire", color: "text-lime-300", bg: "bg-lime-400/15" };
  if (score >= 6) return { label: "Correct, à négocier", color: "text-amber-300", bg: "bg-amber-400/15" };
  if (score >= 4) return { label: "Risqué", color: "text-orange-300", bg: "bg-orange-400/15" };
  return { label: "À éviter", color: "text-rose-300", bg: "bg-rose-400/15" };
}
