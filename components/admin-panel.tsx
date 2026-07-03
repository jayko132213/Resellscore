"use client";

import { useEffect, useState } from "react";
import { Crown, Infinity, Monitor, RefreshCw, Search, Smartphone, TabletSmartphone, UserMinus, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PlanKey } from "@/lib/plans";
import { euros } from "@/lib/utils";

const paidPlans: Exclude<PlanKey, "free">[] = ["starter", "pro", "elite"];

type AdminUser = {
  id: string;
  email: string;
  pseudo: string;
  avatarUrl: string;
  plan: PlanKey;
  status: string;
  lastDevice: "iphone" | "samsung" | "android" | "pc" | "mobile" | "desktop" | "unknown";
  lastDeviceLabel: string;
  lastDeviceAt?: string | null;
  manualExpiresAt?: string | null;
  createdAt: string;
  lastSignInAt?: string | null;
  analysesCount: number;
  recentAnalyses: {
    id: string;
    title: string;
    brand: string | null;
    sellerPrice: number;
    score: number;
    decision: string;
    resalePrice: number;
    url: string;
    createdAt: string;
  }[];
};

function defaultExpiryDate() {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  return date.toISOString().slice(0, 10);
}

function isLifetimeDate(value?: string | null) {
  return Boolean(value?.startsWith("9999-"));
}

export function AdminPanel() {
  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState<Exclude<PlanKey, "free">>("elite");
  const [expiresAt, setExpiresAt] = useState(defaultExpiryDate);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState("");
  const [filter, setFilter] = useState("");

  async function loadUsers() {
    setUsersLoading(true);
    setUsersError("");

    try {
      const response = await fetch("/api/admin/users", { cache: "no-store" });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "Impossible de charger les utilisateurs.");
      setUsers(json.users || []);
    } catch (error) {
      setUsersError(error instanceof Error ? error.message : "Impossible de charger les utilisateurs.");
    } finally {
      setUsersLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function updatePlan(action: "grant-plan" | "grant-lifetime" | "revoke-elite") {
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
          plan: action === "grant-lifetime" ? "elite" : plan,
          expiresAt: action === "grant-lifetime" ? undefined : endDate.toISOString()
        })
      });
      const json = await response.json();
      setMessage(json.message || json.error || "Action terminee.");
      if (response.ok) loadUsers();
    } catch {
      setMessage("Impossible de modifier ce compte.");
    } finally {
      setLoading(false);
    }
  }

  const visibleUsers = users.filter((user) => {
    const text = `${user.email} ${user.pseudo} ${user.plan}`.toLowerCase();
    return text.includes(filter.trim().toLowerCase());
  });

  function deviceIcon(device: AdminUser["lastDevice"]) {
    if (device === "iphone") return <Smartphone size={14} />;
    if (device === "samsung" || device === "android" || device === "mobile") return <TabletSmartphone size={14} />;
    return <Monitor size={14} />;
  }

  return (
    <div className="grid gap-6">
      <section className="max-w-2xl rounded-lg border border-white/10 bg-panel p-6 shadow-glow">
        <p className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-sm font-semibold text-accent">
          <Crown size={15} />
          Panel proprietaire
        </p>
        <h1 className="mt-4 text-3xl font-bold">Acces manuel</h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          Active Starter, Pro ou Elite avec une date de fin. Tu peux aussi donner Elite a vie pour les collabs ou ton compte perso.
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

          <div className="grid gap-3 sm:grid-cols-3">
            <Button type="button" onClick={() => updatePlan("grant-plan")} disabled={loading || !email || !expiresAt}>
              <span className="inline-flex items-center gap-2">
                <UserPlus size={18} />
                Activer jusqu'a la date
              </span>
            </Button>
            <button
              type="button"
              onClick={() => updatePlan("grant-lifetime")}
              disabled={loading || !email}
              className="rounded-md border border-accent/30 bg-accent/10 px-4 py-3 font-bold text-accent transition hover:bg-accent hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="inline-flex items-center gap-2">
                <Infinity size={18} />
                Elite a vie
              </span>
            </button>
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
      </section>

      <section className="rounded-lg border border-white/10 bg-panel p-6 shadow-glow">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-accent">Utilisateurs</p>
            <h2 className="mt-1 text-2xl font-bold">Comptes et analyses</h2>
            <p className="mt-2 text-sm text-muted">Visible uniquement par ton email admin.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative">
              <Search size={16} className="pointer-events-none absolute left-3 top-3.5 text-muted" />
              <input
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                placeholder="Chercher email, pseudo, plan"
                className="w-full rounded-md border border-white/10 bg-white/5 py-3 pl-9 pr-3 outline-none focus:border-accent sm:w-72"
              />
            </label>
            <button
              type="button"
              onClick={loadUsers}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-white/15 bg-white/5 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/10"
            >
              <RefreshCw size={16} />
              Actualiser
            </button>
          </div>
        </div>

        {usersLoading && <p className="mt-6 rounded-md border border-white/10 bg-white/5 p-4 text-sm text-muted">Chargement des utilisateurs...</p>}
        {usersError && <p className="mt-6 rounded-md border border-rose-400/25 bg-rose-500/10 p-4 text-sm text-rose-100">{usersError}</p>}

        <div className="mt-6 grid gap-4">
          {!usersLoading && visibleUsers.length === 0 && (
            <p className="rounded-md border border-white/10 bg-white/5 p-4 text-sm text-muted">Aucun utilisateur trouve.</p>
          )}

          {visibleUsers.map((user) => (
            <article key={user.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full border border-white/15 bg-white/10 font-bold text-accent">
                    {user.avatarUrl ? <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" /> : (user.pseudo || user.email || "?").slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{user.pseudo || "Sans pseudo"}</h3>
                    <p className="text-sm text-muted">{user.email}</p>
                    <button type="button" onClick={() => setEmail(user.email)} className="mt-1 text-xs font-semibold text-accent">
                      Utiliser cet email
                    </button>
                  </div>
                </div>

                <div className="grid gap-2 text-sm sm:grid-cols-5 lg:min-w-[620px]">
                  <MiniStat label="Plan" value={user.plan} />
                  <MiniStat label="Statut" value={isLifetimeDate(user.manualExpiresAt) ? "a vie" : user.status} />
                  <MiniStat
                    label="Appareil"
                    value={user.lastDeviceLabel || "Inconnu"}
                    icon={deviceIcon(user.lastDevice)}
                  />
                  <MiniStat label="Analyses" value={`${user.analysesCount}`} />
                  <MiniStat label="Connexion" value={user.lastSignInAt ? new Date(user.lastSignInAt).toLocaleDateString("fr-FR") : "Jamais"} />
                </div>
              </div>

              <div className="mt-4 border-t border-white/10 pt-4">
                <p className="text-xs font-bold uppercase tracking-wide text-muted">Dernieres recherches</p>
                {user.recentAnalyses.length === 0 ? (
                  <p className="mt-2 text-sm text-muted">Aucune analyse pour le moment.</p>
                ) : (
                  <div className="mt-3 grid gap-2">
                    {user.recentAnalyses.map((analysis) => (
                      <div key={analysis.id} className="rounded-md border border-white/10 bg-black/10 p-3">
                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="font-semibold text-white">{analysis.title}</p>
                            <p className="text-xs text-muted">
                              {analysis.brand || "Marque non precisee"} · Achat {euros(analysis.sellerPrice)} · Revente {analysis.resalePrice ? euros(analysis.resalePrice) : "?"}
                            </p>
                          </div>
                          <p className="text-sm font-bold text-accent">
                            {analysis.score ? `${analysis.score}/10` : "Sans score"} {analysis.decision ? `· ${analysis.decision}` : ""}
                          </p>
                        </div>
                        {analysis.url && (
                          <a href={analysis.url} target="_blank" rel="noreferrer" className="mt-2 inline-block break-all text-xs font-semibold text-accent">
                            {analysis.url}
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function MiniStat({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.04] p-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 flex items-center gap-2 truncate font-bold text-white">{icon}{value}</p>
    </div>
  );
}
