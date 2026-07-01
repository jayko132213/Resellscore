"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Camera, CreditCard, Crown, KeyRound, LogOut, Save, ShieldCheck, Star, Upload } from "lucide-react";
import { Button } from "./ui/button";
import { plans, normalizePlan, type PlanKey } from "@/lib/plans";
import { AiSetupCard } from "./ai-setup-card";

type DemoUser = {
  email: string;
  pseudo?: string;
  avatar?: string;
  avatarZoom?: number;
  plan?: PlanKey;
  isAdmin?: boolean;
  subscriptionStatus?: "inactive" | "active" | "past_due" | "cancelled";
  subscriptionStartedAt?: string;
  subscriptionRenewalAt?: string;
};

function cleanUser(user: DemoUser): DemoUser {
  return {
    ...user,
    pseudo: user.pseudo === "VintedScout" ? "" : user.pseudo
  };
}

function isDemoMode() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  return url.includes("example.supabase.co") || key === "demo-key";
}

function planVisual(plan: PlanKey) {
  if (plan === "elite") {
    return {
      ring: "border-accent shadow-[0_0_34px_rgba(74,222,128,0.42)]",
      avatarBg: "bg-accent/15 text-accent",
      badge: "bg-accent text-ink",
      label: "Elite",
      icon: <Crown size={16} />
    };
  }
  if (plan === "pro") {
    return {
      ring: "border-sky-300 shadow-[0_0_28px_rgba(125,211,252,0.32)]",
      avatarBg: "bg-sky-400/15 text-sky-200",
      badge: "bg-sky-400 text-ink",
      label: "Pro",
      icon: <ShieldCheck size={16} />
    };
  }
  if (plan === "starter") {
    return {
      ring: "border-amber-300 shadow-[0_0_26px_rgba(252,211,77,0.28)]",
      avatarBg: "bg-amber-400/15 text-amber-200",
      badge: "bg-amber-300 text-ink",
      label: "Starter",
      icon: <Star size={16} />
    };
  }
  return {
    ring: "border-stone-300/35",
    avatarBg: "bg-stone-400/10 text-stone-300",
    badge: "bg-stone-300 text-ink",
    label: "Gratuit",
    icon: null
  };
}

export function ProfileEditor() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [user, setUser] = useState<DemoUser>({ email: "demo@resellscore.app", pseudo: "" });
  const [pseudo, setPseudo] = useState("");
  const [avatar, setAvatar] = useState("");
  const [zoom, setZoom] = useState(1);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(true);
  const currentPlan = normalizePlan(user.plan);
  const visual = planVisual(currentPlan);
  const isPaidPlan = currentPlan !== "free";
  const renewalDate = user.subscriptionRenewalAt ? new Date(user.subscriptionRenewalAt) : null;
  const daysRemaining = renewalDate ? Math.max(0, Math.ceil((renewalDate.getTime() - Date.now()) / 86_400_000)) : 0;
  const subscriptionStatus = isPaidPlan ? user.subscriptionStatus || "active" : "inactive";

  useEffect(() => {
    if (!isDemoMode()) {
      fetch("/api/profile")
        .then((response) => response.ok ? response.json() : null)
        .then((payload) => {
          if (!payload?.profile) return;

          const next = cleanUser({
            email: payload.user?.email || payload.profile.email || "",
            isAdmin: Boolean(payload.user?.isAdmin),
            pseudo: payload.profile.pseudo || "",
            avatar: payload.profile.avatar_url || "",
            plan: payload.plan,
            subscriptionStatus: payload.profile.subscription_status,
            subscriptionRenewalAt: payload.profile.manual_expires_at || undefined
          });

          setUser(next);
          setPseudo(next.pseudo || "");
          setAvatar(next.avatar || "");
          localStorage.setItem("resellscore_demo_user", JSON.stringify(next));
          window.dispatchEvent(new Event("resellscore-user-updated"));
        })
        .catch(() => setError("Impossible de charger le profil. Reconnecte-toi."))
        .finally(() => setLoadingProfile(false));
      return;
    }

    const stored = localStorage.getItem("resellscore_demo_user");
    if (!stored) {
      setLoadingProfile(false);
      return;
    }

    const parsed = cleanUser(JSON.parse(stored) as DemoUser);
    setUser(parsed);
    setPseudo(parsed.pseudo || "");
    setAvatar(parsed.avatar || "");
    setZoom(parsed.avatarZoom || 1);
    setLoadingProfile(false);
  }, []);

  function choosePhoto() {
    fileInputRef.current?.click();
  }

  function onPhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setAvatar(String(reader.result));
      setZoom(1);
    };
    reader.readAsDataURL(file);
  }

  async function onSubmit() {
    setError("");

    if (!isDemoMode()) {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pseudo: pseudo.trim(),
          avatarUrl: avatar,
          avatarZoom: zoom
        })
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(payload.error || "Impossible de sauvegarder le profil.");
        return;
      }

      const next = cleanUser({
        ...user,
        pseudo: payload.profile?.pseudo || pseudo.trim(),
        avatar: payload.profile?.avatar_url || avatar,
        avatarZoom: zoom,
        plan: payload.plan || user.plan
      });

      localStorage.setItem("resellscore_demo_user", JSON.stringify(next));
      setUser(next);
      setSaved(true);
      window.dispatchEvent(new Event("resellscore-user-updated"));
      setTimeout(() => setSaved(false), 1800);
      return;
    }

    const next = cleanUser({
      ...user,
      pseudo: pseudo.trim(),
      avatar,
      avatarZoom: zoom
    });

    localStorage.setItem("resellscore_demo_user", JSON.stringify(next));
    setUser(next);
    setSaved(true);
    window.dispatchEvent(new Event("resellscore-user-updated"));
    setTimeout(() => setSaved(false), 1800);
  }

  async function signOut() {
    if (isDemoMode()) {
      localStorage.removeItem("resellscore_demo_user");
      window.dispatchEvent(new Event("resellscore-user-updated"));
      window.location.assign("/");
      return;
    }

    const { createSupabaseBrowserClient } = await import("@/lib/supabase/browser");
    await createSupabaseBrowserClient().auth.signOut();
    localStorage.removeItem("resellscore_demo_user");
    window.location.assign("/");
  }

  async function changeDemoPlan(plan: PlanKey) {
    const now = new Date();
    const renewal = new Date(now);
    renewal.setDate(renewal.getDate() + 30);

    if (!isDemoMode()) {
      const response = await fetch("/api/profile/test-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan })
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(payload.error || "Impossible de changer le plan.");
        return;
      }

      const next = cleanUser({
        ...user,
        plan,
        subscriptionStatus: plan === "free" ? "inactive" : "active",
        subscriptionRenewalAt: payload.expiresAt || undefined
      });

      localStorage.setItem("resellscore_demo_user", JSON.stringify(next));
      setUser(next);
      window.dispatchEvent(new Event("resellscore-user-updated"));
      return;
    }

    const next = cleanUser({
      ...user,
      plan,
      subscriptionStatus: plan === "free" ? "inactive" : "active",
      subscriptionStartedAt: plan === "free" ? undefined : user.subscriptionStartedAt || now.toISOString(),
      subscriptionRenewalAt: plan === "free" ? undefined : renewal.toISOString()
    });

    localStorage.setItem("resellscore_demo_user", JSON.stringify(next));
    setUser(next);
    window.dispatchEvent(new Event("resellscore-user-updated"));
  }

  return (
    <form action={onSubmit} className="mt-8 grid max-w-xl gap-5 rounded-lg border border-white/10 bg-panel p-5">
      <AiSetupCard />
      {loadingProfile && <p className="rounded-md border border-white/10 bg-white/5 p-3 text-sm text-muted">Chargement du profil...</p>}

      <section className="rounded-lg border border-accent/20 bg-accent/[0.05] p-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-sm font-bold text-accent">
              <CreditCard size={16} />
              Abonnement
            </p>
            <h2 className="mt-2 text-2xl font-bold text-white">{plans[currentPlan].name}</h2>
            <p className="mt-1 text-sm text-muted">{plans[currentPlan].limitLabel}</p>
          </div>
          <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-bold text-white">
            {subscriptionStatus === "active" ? "Actif" : "Gratuit"}
          </span>
        </div>

        {user.isAdmin && (
          <Link href="/admin-command" className="mt-4 inline-flex items-center gap-2 rounded-md border border-accent/30 bg-accent px-4 py-2 text-sm font-black text-ink transition hover:bg-accent/90">
            <KeyRound size={16} />
            Ouvrir le panel admin
          </Link>
        )}

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <SubscriptionMetric label="Jours restants" value={isPaidPlan ? `${daysRemaining || 30} jours` : "Aucun abonnement"} />
          <SubscriptionMetric
            label="Prochain prélèvement"
            value={isPaidPlan && renewalDate ? renewalDate.toLocaleDateString("fr-FR") : "Aucun"}
          />
        </div>

        <div className="mt-4 border-t border-white/10 pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            {user.isAdmin || isDemoMode() ? "Changer le plan en test" : "Plan gere par le proprietaire"}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(["free", "starter", "pro", "elite"] as PlanKey[]).map((plan) => (
              <button
                key={plan}
                type="button"
                disabled={!user.isAdmin && !isDemoMode()}
                onClick={() => changeDemoPlan(plan)}
                className={`rounded-md border px-3 py-2 text-sm font-bold transition ${
                  currentPlan === plan
                    ? "border-accent bg-accent text-ink"
                    : "border-white/10 bg-white/5 text-white hover:bg-white/10"
                } ${!user.isAdmin && !isDemoMode() ? "cursor-not-allowed opacity-50" : ""}`}
              >
                {plans[plan].name}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={choosePhoto}
          className={`group relative h-24 w-24 rounded-full border-2 ${visual.ring} ${visual.avatarBg}`}
          aria-label="Choisir une photo de profil"
        >
          <span className={`absolute -right-2 -top-2 z-10 inline-flex min-h-7 items-center gap-1 rounded-full px-2 text-xs font-black uppercase ${visual.badge}`}>
            {visual.icon}
            {visual.label}
          </span>
          {avatar ? (
            <span className="block h-full w-full overflow-hidden rounded-full">
              <img
                src={avatar}
                alt=""
                className="h-full w-full object-cover transition"
                style={{ transform: `scale(${zoom})` }}
              />
            </span>
          ) : (
            <span className="grid h-full w-full place-items-center">
              <Camera size={34} />
            </span>
          )}
          <span className="absolute inset-0 grid place-items-center bg-black/45 text-white opacity-0 transition group-hover:opacity-100">
            <Upload size={22} />
          </span>
        </button>

        <div>
          <p className="font-semibold">{pseudo || "Pseudo"}</p>
          <p className="text-sm text-muted">{user.email}</p>
          <button type="button" onClick={choosePhoto} className="mt-2 text-sm font-medium text-accent">
            Choisir une photo
          </button>
        </div>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" className="sr-only" onChange={onPhotoChange} />

      {avatar && (
        <label className="grid gap-2">
          <span className="text-sm text-muted">Ajuster la photo</span>
          <input
            type="range"
            min="1"
            max="1.8"
            step="0.05"
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
            className="accent-emerald-400"
          />
        </label>
      )}

      <label className="grid gap-2">
        <span className="text-sm text-muted">Pseudo</span>
        <input
          value={pseudo}
          onChange={(event) => setPseudo(event.target.value)}
          placeholder="Pseudo"
          className="rounded-md border border-white/10 bg-white/5 px-3 py-3 outline-none placeholder:text-slate-500 focus:border-accent"
        />
      </label>

      {saved && <p className="rounded-md bg-accent/10 p-3 text-sm text-accent">Profil sauvegardé.</p>}
      {error && <p className="rounded-md bg-rose-500/10 p-3 text-sm text-rose-200">{error}</p>}
      <Button className="gap-2">
        <Save size={17} />
        Sauvegarder
      </Button>
      <button
        type="button"
        onClick={signOut}
        className="inline-flex items-center justify-center gap-2 rounded-md border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/10"
      >
        <LogOut size={17} />
        Se deconnecter
      </button>
    </form>
  );
}

function SubscriptionMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.04] p-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 font-bold text-white">{value}</p>
    </div>
  );
}
