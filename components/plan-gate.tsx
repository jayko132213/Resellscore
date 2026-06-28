"use client";

import { useEffect, useState } from "react";
import { Crown, Lock, ShieldCheck, Star } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { plans, normalizePlan, type PlanKey } from "@/lib/plans";

const rank: Record<PlanKey, number> = {
  free: 0,
  starter: 1,
  pro: 2,
  elite: 3
};

type DemoUser = {
  plan?: string;
};

function iconFor(plan: PlanKey) {
  if (plan === "elite") return <Crown size={28} />;
  if (plan === "pro") return <ShieldCheck size={28} />;
  if (plan === "starter") return <Star size={28} />;
  return <Lock size={28} />;
}

export function PlanGate({ minPlan, feature, children }: { minPlan: Exclude<PlanKey, "free">; feature: string; children: React.ReactNode }) {
  const [plan, setPlan] = useState<PlanKey>("free");
  const allowed = rank[plan] >= rank[minPlan];

  useEffect(() => {
    function loadPlan() {
      const stored = localStorage.getItem("resellscore_demo_user");
      if (!stored) {
        setPlan("free");
      } else {
        const user = JSON.parse(stored) as DemoUser;
        setPlan(normalizePlan(user.plan));
      }

      fetch("/api/me/plan", { cache: "no-store" })
        .then((response) => response.ok ? response.json() : null)
        .then((data: { plan?: string } | null) => {
          if (data?.plan) setPlan(normalizePlan(data.plan));
        })
        .catch(() => {});
    }

    loadPlan();
    window.addEventListener("resellscore-user-updated", loadPlan);
    window.addEventListener("storage", loadPlan);
    return () => {
      window.removeEventListener("resellscore-user-updated", loadPlan);
      window.removeEventListener("storage", loadPlan);
    };
  }, []);

  if (allowed) return <>{children}</>;

  return (
    <section className="mt-8 rounded-lg border border-accent/20 bg-panel p-8 text-center shadow-glow">
      <div className="mx-auto grid h-20 w-20 place-items-center rounded-full border border-accent/25 bg-accent/10 text-accent">
        {iconFor(minPlan)}
      </div>
      <p className="mt-5 inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm font-bold text-muted">
        Ton plan actuel : {plans[plan].name}
      </p>
      <h2 className="mt-4 text-3xl font-bold">{feature} est réservé à {plans[minPlan].name}+</h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted">
        Passe en {plans[minPlan].name} ou plus pour débloquer cette partie. Analyse reste accessible à tous les comptes.
      </p>
      <div className="mt-6">
        <ButtonLink href="/pricing">Voir les tarifs</ButtonLink>
      </div>
    </section>
  );
}
