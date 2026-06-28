"use client";

import { useEffect, useState } from "react";
import { ArrowUp, Lock } from "lucide-react";
import { ButtonLink } from "./ui/button";

type DemoUser = { plan?: string };

export function EliteFindsSection() {
  const [isElite, setIsElite] = useState(false);

  useEffect(() => {
    function loadPlan() {
      const stored = localStorage.getItem("resellscore_demo_user");
      if (!stored) {
        setIsElite(false);
        return;
      }
      const user = JSON.parse(stored) as DemoUser;
      setIsElite(user.plan === "elite");
    }

    loadPlan();
    window.addEventListener("resellscore-user-updated", loadPlan);
    window.addEventListener("storage", loadPlan);
    return () => {
      window.removeEventListener("resellscore-user-updated", loadPlan);
      window.removeEventListener("storage", loadPlan);
    };
  }, []);

  return (
    <section className="border-y border-white/10 bg-white/[0.03] py-20">
      <div className="shell">
        <div className="rounded-lg border border-accent/20 bg-panel p-6 shadow-glow md:p-8">
          <p className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-sm font-semibold text-accent">
            {isElite ? <ArrowUp size={14} /> : <Lock size={14} />}
            {isElite ? "Elite actif" : "Reserve Elite"}
          </p>
          <h2 className="mt-4 text-3xl font-bold">Tendances revente en hausse</h2>
          <p className="mt-3 max-w-2xl text-muted">
            {isElite
              ? "Ton acces Elite est actif. Va voir les niches, saisons, budgets, risques et angles de vente."
              : "Les tendances premium ne sont pas visibles sans Elite. Debloque l'acces pour voir quoi chercher et quand revendre."}
          </p>
          <div className="mt-6">
            <ButtonLink href={isElite ? "/opportunities" : "/pricing"}>
              {isElite ? "Voir les tendances" : "Debloquer Elite"}
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
