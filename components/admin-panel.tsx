"use client";

import { useState } from "react";
import { Crown, UserMinus, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PlanKey } from "@/lib/plans";

const paidPlans: Exclude<PlanKey, "free">[] = ["starter", "pro", "elite"];

function defaultExpiryDate() {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  return date.toISOString().slice(0, 10);
}

export function AdminPanel() {
  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState<Exclude<PlanKey, "free">>("elite");
  const [expiresAt, setExpiresAt] = useState(defaultExpiryDate);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function updatePlan(action: "grant-plan" | "revoke-elite") {
    setLoading(true);
    setMessage("");

    try {
      const endDate = new Date(`${expiresAt}T23:59:59.000`);
      const response = await fetch("/api/admin/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          email,
          plan,
          expiresAt: endDate.toISOString()
        })
      });
      const json = await response.json();
      setMessage(json.message || json.error || "Action terminee.");
    } catch {
      setMessage("Impossible de modifier ce compte.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl rounded-lg border border-white/10 bg-panel p-6 shadow-glow">
      <p className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-sm font-semibold text-accent">
        <Crown size={15} />
        Panel proprietaire
      </p>
      <h1 className="mt-4 text-3xl font-bold">Acces manuel</h1>
      <p className="mt-3 text-sm leading-6 text-muted">
        Active Starter, Pro ou Elite avec une date de fin. Quand la date est depassee, le site repasse automatiquement le compte en Gratuit.
      </p>

      <div className="mt-6 grid gap-4">
        <label className="grid gap-2">
          <span className="text-sm text-muted">Email du compte</span>
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            placeholder="collab@example.com"
            className="rounded-md border border-white/10 bg-white/5 px-3 py-3 outline-none focus:border-accent"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm text-muted">Abonnement</span>
            <select
              value={plan}
              onChange={(event) => setPlan(event.target.value as Exclude<PlanKey, "free">)}
              className="rounded-md border border-white/10 bg-white/5 px-3 py-3 outline-none focus:border-accent"
            >
              {paidPlans.map((item) => (
                <option key={item} value={item} className="bg-ink">
                  {item === "starter" ? "Starter" : item === "pro" ? "Pro" : "Elite"}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-sm text-muted">Date de fin</span>
            <input
              value={expiresAt}
              onChange={(event) => setExpiresAt(event.target.value)}
              type="date"
              className="rounded-md border border-white/10 bg-white/5 px-3 py-3 outline-none focus:border-accent"
            />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Button type="button" onClick={() => updatePlan("grant-plan")} disabled={loading || !email || !expiresAt}>
            <span className="inline-flex items-center gap-2">
              <UserPlus size={18} />
              Activer jusqu'a la date
            </span>
          </Button>
          <button
            type="button"
            onClick={() => updatePlan("revoke-elite")}
            disabled={loading || !email}
            className="rounded-md border border-white/15 bg-white/5 px-4 py-3 font-bold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="inline-flex items-center gap-2">
              <UserMinus size={18} />
              Retirer Elite
            </span>
          </button>
        </div>

        {message && (
          <p className="rounded-md border border-accent/20 bg-accent/10 p-3 text-sm font-semibold text-accent">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
