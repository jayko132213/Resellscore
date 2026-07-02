"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUp, Crown, KeyRound, LogOut, MessageSquare, MoreHorizontal, Settings, ShieldCheck, Star, UserCircle, X } from "lucide-react";
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

type HeaderDevice = "iphone" | "samsung" | "android" | "pc";

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

function detectHeaderDevice(): HeaderDevice {
  if (typeof navigator === "undefined") return "pc";
  const forcedDevice = localStorage.getItem("resellscore_device_type");
  if (forcedDevice === "iphone" || forcedDevice === "samsung" || forcedDevice === "android" || forcedDevice === "pc") {
    return forcedDevice;
  }

  const userAgent = navigator.userAgent.toLowerCase();
  const platform = navigator.platform?.toLowerCase() || "";
  const touchDevice = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;

  if (/iphone|ipod/.test(userAgent) || (platform === "macintel" && touchDevice)) return "iphone";
  if (/samsung|sm-|gt-|galaxy/.test(userAgent)) return "samsung";
  if (/android|mobile|windows phone/.test(userAgent) || touchDevice) return "android";
  return "pc";
}

export function AuthNav({ serverSignedIn = false }: { serverSignedIn?: boolean }) {
  const [user, setUser] = useState<DemoUser | null>(null);
  const [signedIn, setSignedIn] = useState(serverSignedIn);
  const [menuOpen, setMenuOpen] = useState(false);
  const [headerDevice, setHeaderDevice] = useState<HeaderDevice>("pc");
  const [smallViewport, setSmallViewport] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    function refreshDevice() {
      setHeaderDevice(detectHeaderDevice());
    }

    function refreshViewport() {
      setSmallViewport(window.innerWidth < 1100);
    }

    refreshDevice();
    refreshViewport();
    setShowGuide(localStorage.getItem("resellscore_nav_guide_done") !== "true");
    window.addEventListener("resellscore-device-updated", refreshDevice);
    window.addEventListener("storage", refreshDevice);
    window.addEventListener("resize", refreshViewport);
    window.addEventListener("orientationchange", refreshViewport);

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
        window.removeEventListener("resellscore-device-updated", refreshDevice);
        window.removeEventListener("storage", loadDemoUser);
        window.removeEventListener("storage", refreshDevice);
        window.removeEventListener("resize", refreshViewport);
        window.removeEventListener("orientationchange", refreshViewport);
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

    return () => {
      window.removeEventListener("resellscore-device-updated", refreshDevice);
      window.removeEventListener("storage", refreshDevice);
      window.removeEventListener("resize", refreshViewport);
      window.removeEventListener("orientationchange", refreshViewport);
    };
  }, []);

  const displayName = user?.pseudo?.trim() || "";
  const activePlan = normalizePlan(user?.plan);
  const badge = planBadge(activePlan);
  const compactHeader = headerDevice !== "pc" || smallViewport;
  const mainLinks = [
    { href: signedIn ? "/analyze" : "/signup", label: "Analyser", level: "", icon: null, primary: true },
    { href: "/opportunities", label: "Tendances", level: "Elite", icon: <ArrowUp size={11} /> },
    { href: "/pre-achat", label: "Pre-achat", level: "Starter+", icon: <Star size={11} /> },
    { href: "/vente", label: "Vente", level: "Pro+", icon: <ShieldCheck size={11} /> },
    { href: "/pricing", label: "Tarifs", level: "", icon: null },
    { href: "/avis", label: "Avis", level: "", icon: <MessageSquare size={15} /> },
    { href: "/parametres", label: "Paramètres", level: "", icon: <Settings size={15} /> }
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

  function closeGuide() {
    localStorage.setItem("resellscore_nav_guide_done", "true");
    setShowGuide(false);
  }

  return (
    <div className="relative flex min-w-0 items-center gap-1.5 sm:gap-3">
      <button
        type="button"
        onClick={() => setMenuOpen((value) => !value)}
        className={
          compactHeader
            ? "inline-grid h-10 w-10 shrink-0 place-items-center rounded-full border border-accent/35 bg-accent/10 text-accent shadow-[0_0_18px_rgba(74,222,128,0.12)] sm:h-11 sm:w-11"
            : "inline-grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/15 bg-white/5 text-white shadow-[0_0_18px_rgba(255,255,255,0.05)] hover:bg-white/10"
        }
        aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
        aria-expanded={menuOpen}
      >
        {menuOpen ? <X size={19} /> : <MoreHorizontal size={22} />}
      </button>

      {showGuide && !menuOpen && (
        <div className="fixed inset-x-3 top-16 z-50 rounded-lg border border-accent/30 bg-ink p-3 shadow-glow sm:left-auto sm:right-6 sm:top-20 sm:w-[340px]">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-sm font-black text-white">Petit tuto</p>
            <button type="button" onClick={closeGuide} className="grid h-7 w-7 place-items-center rounded-full border border-white/10 bg-white/5 text-muted">
              <X size={14} />
            </button>
          </div>
          <p className="text-sm leading-5 text-muted">
            Clique sur le bouton <span className="font-black text-accent">...</span> pour ouvrir le menu. Dedans tu as Analyser, Tarifs, Tendances, Pre-achat, Vente, Avis, Paramètres, Profil et Deconnexion.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setMenuOpen(true);
                closeGuide();
              }}
              className="rounded-md bg-accent px-3 py-2 text-sm font-black text-ink"
            >
              Voir le menu
            </button>
            <button type="button" onClick={closeGuide} className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm font-bold text-white">
              J'ai compris
            </button>
          </div>
        </div>
      )}

      {menuOpen && (
        <div className="fixed inset-x-2 top-16 z-50 grid max-h-[calc(100dvh-76px)] gap-1.5 overflow-y-auto rounded-md border border-white/10 bg-ink p-2 shadow-glow sm:inset-x-4 sm:top-20 sm:max-h-[calc(100dvh-96px)] sm:gap-2 sm:rounded-lg sm:p-3 md:left-auto md:right-6 md:w-[360px]">
          <p className="px-2 pb-1 text-[11px] font-bold uppercase tracking-wide text-muted sm:text-xs">Navigation</p>
          {mainLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className={`flex min-h-10 items-center justify-between gap-2 rounded-md px-3 py-2.5 text-sm font-semibold sm:min-h-12 sm:gap-3 sm:px-4 sm:py-3 sm:text-base ${
                item.primary ? "bg-accent text-ink" : "border border-white/10 bg-white/[0.04] text-white"
              }`}
            >
              <span className="inline-flex items-center gap-2">
                {!item.level && item.icon}
                {item.label}
              </span>
              {item.level && (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-white/15 bg-white/10 px-1.5 py-0.5 text-[9px] font-black uppercase sm:px-2 sm:py-1 sm:text-[10px]">
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
              className="flex min-h-10 items-center justify-between gap-2 rounded-md border border-accent/30 bg-accent/10 px-3 py-2.5 text-sm font-bold text-accent sm:min-h-12 sm:gap-3 sm:px-4 sm:py-3 sm:text-base"
            >
              <span>Admin</span>
              <KeyRound size={16} />
            </Link>
          )}
          <div className="my-1 h-px bg-white/10" />
          {signedIn && (
            <Link
              href="/profile"
              onClick={() => setMenuOpen(false)}
              className="flex min-h-10 items-center justify-between gap-2 rounded-md border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm font-semibold text-white sm:min-h-12 sm:gap-3 sm:px-4 sm:py-3 sm:text-base"
            >
              <span>Profil</span>
              <UserCircle size={17} />
            </Link>
          )}
          {signedIn && (
            <button
              type="button"
              onClick={signOut}
              className="flex min-h-10 items-center justify-between gap-2 rounded-md border border-white/10 bg-white/[0.04] px-3 py-2.5 text-left text-sm font-semibold text-white sm:min-h-12 sm:gap-3 sm:px-4 sm:py-3 sm:text-base"
            >
              <span>Se deconnecter</span>
              <LogOut size={17} />
            </button>
          )}
          {!signedIn && (
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="flex min-h-10 items-center justify-between rounded-md bg-white px-3 py-2.5 text-sm font-bold text-ink sm:min-h-12 sm:px-4 sm:py-3 sm:text-base"
            >
              Connexion
            </Link>
          )}
        </div>
      )}

    </div>
  );
}
