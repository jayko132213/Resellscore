"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUp, Crown, KeyRound, LogOut, Menu, ShieldCheck, Star, UserCircle, X } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { normalizePlan, type PlanKey } from "@/lib/plans";

type DemoUser = {
  email: string;
  pseudo?: string;
  avatar?: string;
  avatarZoom?: number;
  plan?: PlanKey;
  isAdmin?: boolean;
};

function isDemoMode() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  return url.includes("example.supabase.co") || key === "demo-key";
}

function cleanUser(user: DemoUser): DemoUser {
  return {
    ...user,
    pseudo: user.pseudo === "VintedScout" ? "" : user.pseudo
  };
}

function planBadge(plan: PlanKey) {
  if (plan === "elite") {
    return {
      ring: "border-accent shadow-[0_0_22px_rgba(74,222,128,0.35)]",
      text: "bg-accent text-ink",
      icon: <Crown size={11} />
    };
  }
  if (plan === "pro") {
    return {
      ring: "border-sky-300 shadow-[0_0_18px_rgba(125,211,252,0.25)]",
      text: "bg-sky-400 text-ink",
      icon: <ShieldCheck size={11} />
    };
  }
  if (plan === "starter") {
    return {
      ring: "border-amber-300 shadow-[0_0_18px_rgba(252,211,77,0.22)]",
      text: "bg-amber-300 text-ink",
      icon: <Star size={11} />
    };
  }
  return {
    ring: "border-stone-300/35",
    text: "bg-stone-300 text-ink",
    icon: null
  };
}

export function AuthNav({ serverSignedIn = false }: { serverSignedIn?: boolean }) {
  const [user, setUser] = useState<DemoUser | null>(null);
  const [signedIn, setSignedIn] = useState(serverSignedIn);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    function loadDemoUser() {
      const stored = localStorage.getItem("resellscore_demo_user");
      if (stored) {
        const parsed = cleanUser(JSON.parse(stored) as DemoUser);
        setUser(parsed);
        setSignedIn(true);
        localStorage.setItem("resellscore_demo_user", JSON.stringify(parsed));
      }
    }

    if (isDemoMode()) {
      loadDemoUser();
      window.addEventListener("resellscore-user-updated", loadDemoUser);
      window.addEventListener("storage", loadDemoUser);
      return () => {
        window.removeEventListener("resellscore-user-updated", loadDemoUser);
        window.removeEventListener("storage", loadDemoUser);
      };
    }

    createSupabaseBrowserClient().auth.getUser().then(({ data }) => {
      setSignedIn(Boolean(data.user));
      setUser(data.user ? { email: data.user.email || "", pseudo: data.user.user_metadata?.pseudo } : null);
      if (data.user) {
        fetch("/api/profile")
          .then((response) => response.ok ? response.json() : null)
          .then((payload) => {
            if (!payload?.profile) return;
            setUser({
              email: payload.user?.email || data.user?.email || "",
              isAdmin: Boolean(payload.user?.isAdmin),
              pseudo: payload.profile.pseudo || "",
              avatar: payload.profile.avatar_url || "",
              plan: payload.plan
            });
          })
          .catch(() => {});
      }
    });
  }, []);

  const displayName = user?.pseudo?.trim() || "";
  const activePlan = normalizePlan(user?.plan);
  const badge = planBadge(activePlan);
  const mainLinks = [
    { href: signedIn ? "/analyze" : "/signup", label: "Analyser", level: "", icon: null, primary: true },
    { href: "/opportunities", label: "Tendances", level: "Elite", icon: <ArrowUp size={11} /> },
    { href: "/pre-achat", label: "Pré-achat", level: "Starter+", icon: <Star size={11} /> },
    { href: "/vente", label: "Vente", level: "Pro+", icon: <ShieldCheck size={11} /> },
    { href: "/pricing", label: "Tarifs", level: "", icon: null }
  ];

  async function signOut() {
    if (isDemoMode()) {
      localStorage.removeItem("resellscore_demo_user");
      window.dispatchEvent(new Event("resellscore-user-updated"));
      window.location.assign("/");
      return;
    }

    await createSupabaseBrowserClient().auth.signOut();
    window.location.assign("/");
  }

  return (
    <div className="relative flex items-center gap-2 sm:gap-3">
      <div className="hidden items-center gap-2 md:flex xl:gap-3">
      <Link href={signedIn ? "/analyze" : "/signup"} className="rounded-md bg-accent px-3 py-2 font-semibold text-ink shadow-[0_0_24px_rgba(74,222,128,0.18)] xl:px-4">
        Analyser
      </Link>
      <Link href="/opportunities" className="rounded-md border border-accent/25 px-3 py-2 font-medium text-accent hover:bg-accent/10 xl:px-4">
        <span className="inline-flex items-center gap-2">
          Tendances
          <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-black uppercase text-ink">
            <ArrowUp size={11} />
            Elite
          </span>
        </span>
      </Link>
      <Link href="/pre-achat" className="rounded-md border border-white/15 px-3 py-2 font-medium text-white hover:bg-white/10 xl:px-4">
        <span className="inline-flex items-center gap-2">
          Pré-achat
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/35 bg-amber-400/15 px-2 py-0.5 text-[10px] font-black uppercase text-amber-200">
            <Star size={11} />
            Starter+
          </span>
        </span>
      </Link>
      <Link href="/vente" className="rounded-md border border-white/15 px-3 py-2 font-medium text-white hover:bg-white/10 xl:px-4">
        <span className="inline-flex items-center gap-2">
          Vente
          <span className="inline-flex items-center gap-1 rounded-full border border-sky-300/35 bg-sky-400/15 px-2 py-0.5 text-[10px] font-black uppercase text-sky-200">
            <ShieldCheck size={11} />
            Pro+
          </span>
        </span>
      </Link>
      <Link href="/pricing" className="rounded-md border border-white/15 px-3 py-2 font-medium text-white hover:bg-white/10 xl:px-4">
        Tarifs
      </Link>
      </div>
      <button
        type="button"
        onClick={() => setMenuOpen((value) => !value)}
        className="inline-flex h-10 items-center gap-2 rounded-md border border-white/15 bg-white/5 px-3 font-semibold text-white hover:bg-white/10 md:hidden"
        aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
        aria-expanded={menuOpen}
      >
        {menuOpen ? <X size={18} /> : <Menu size={18} />}
        <span className="hidden min-[390px]:inline">Menu</span>
      </button>
      {menuOpen && (
        <div className="absolute right-0 top-12 z-50 grid w-[min(92vw,360px)] gap-2 rounded-lg border border-white/10 bg-ink p-3 shadow-glow md:hidden">
          {mainLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className={`flex min-h-12 items-center justify-between gap-3 rounded-md px-4 py-3 font-semibold ${
                item.primary ? "bg-accent text-ink" : "border border-white/10 bg-white/[0.04] text-white"
              }`}
            >
              <span>{item.label}</span>
              {item.level && (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-white/15 bg-white/10 px-2 py-1 text-[10px] font-black uppercase">
                  {item.icon}
                  {item.level}
                </span>
              )}
            </Link>
          ))}
          {user?.isAdmin && (
            <Link
              href="/admin-command"
              onClick={() => setMenuOpen(false)}
              className="flex min-h-12 items-center justify-between gap-3 rounded-md border border-accent/30 bg-accent/10 px-4 py-3 font-bold text-accent"
            >
              <span>Admin</span>
              <KeyRound size={16} />
            </Link>
          )}
          {signedIn && (
            <Link
              href="/profile"
              onClick={() => setMenuOpen(false)}
              className="flex min-h-12 items-center justify-between gap-3 rounded-md border border-white/10 bg-white/[0.04] px-4 py-3 font-semibold text-white"
            >
              <span>Profil</span>
              <UserCircle size={17} />
            </Link>
          )}
          {signedIn && (
            <button
              type="button"
              onClick={signOut}
              className="flex min-h-12 items-center justify-between gap-3 rounded-md border border-white/10 bg-white/[0.04] px-4 py-3 text-left font-semibold text-white"
            >
              <span>Se déconnecter</span>
              <LogOut size={17} />
            </button>
          )}
          {!signedIn && (
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="flex min-h-12 items-center justify-between rounded-md bg-white px-4 py-3 font-bold text-ink"
            >
              Connexion
            </Link>
          )}
        </div>
      )}
      {signedIn ? (
        <>
          {user?.isAdmin && (
            <Link href="/admin-command" className="hidden items-center gap-2 rounded-md border border-accent/30 bg-accent/10 px-3 py-2 font-bold text-accent hover:bg-accent/15 md:inline-flex">
              <KeyRound size={16} />
              Admin
            </Link>
          )}
          <Link href="/profile" className="flex min-h-10 items-center gap-2 rounded-md border border-white/15 bg-white/10 px-2 py-2 font-medium text-white hover:bg-white/15 sm:px-3" aria-label="Profil">
            {user?.avatar ? (
              <span className={`relative h-8 w-8 overflow-visible rounded-full border-2 ${badge.ring}`}>
                {activePlan !== "free" && (
                  <span className={`absolute -right-1 -top-2 z-10 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 ${badge.text}`}>
                    {badge.icon}
                  </span>
                )}
                <img src={user.avatar} alt="" className="h-full w-full object-cover" style={{ transform: `scale(${user.avatarZoom || 1})` }} />
              </span>
            ) : (
              <span className={`relative grid h-8 w-8 place-items-center rounded-full border-2 bg-white/5 ${badge.ring}`}>
                {activePlan !== "free" && (
                  <span className={`absolute -right-1 -top-2 z-10 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 ${badge.text}`}>
                    {badge.icon}
                  </span>
                )}
                <UserCircle size={22} className={activePlan === "free" ? "text-stone-300" : "text-accent"} />
              </span>
            )}
            {displayName && <span className="hidden max-w-24 truncate sm:inline">{displayName}</span>}
          </Link>
          <button
            type="button"
            onClick={signOut}
            className="hidden h-10 w-10 place-items-center rounded-md border border-white/15 bg-white/5 text-white hover:bg-white/10 sm:grid"
            aria-label="Se deconnecter"
            title="Se deconnecter"
          >
            <LogOut size={17} />
          </button>
        </>
      ) : (
        <Link href="/login" className="rounded-md bg-white px-4 py-2 font-semibold text-ink">
          Connexion
        </Link>
      )}
    </div>
  );
}
