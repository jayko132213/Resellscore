"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Button } from "./ui/button";

function isDemoMode() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  return url.includes("example.supabase.co") || key === "demo-key";
}

function saveDemoUser(email: string, pseudo?: string) {
  localStorage.setItem("resellscore_demo_user", JSON.stringify({
    email,
    pseudo: pseudo || "",
    createdAt: new Date().toISOString()
  }));
  window.dispatchEvent(new Event("resellscore-user-updated"));
}

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const googleEnabled = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true";

  async function signInWithGoogle() {
    if (!googleEnabled) {
      setError("Connexion Google pas encore active. Utilise email + mot de passe pour l'instant.");
      return;
    }

    setError("");
    setLoading(true);

    if (isDemoMode()) {
      saveDemoUser("google-demo@resellscore.app");
      setLoading(false);
      router.push("/analyze");
      router.refresh();
      return;
    }

    const supabase = createSupabaseBrowserClient();
    const origin = window.location.origin;
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/analyze`
      }
    });
    setLoading(false);
    if (authError) setError(authError.message);
  }

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setError("");

    const email = String(formData.get("email"));
    const password = String(formData.get("password"));
    const pseudo = String(formData.get("pseudo") || "");

    if (isDemoMode()) {
      saveDemoUser(email, pseudo);
      setLoading(false);
      router.push(mode === "signup" ? "/analyze" : "/dashboard");
      router.refresh();
      return;
    }

    const supabase = createSupabaseBrowserClient();

    if (mode === "signup" && pseudo.trim()) {
      const check = await fetch("/api/pseudo/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pseudo })
      });
      const result = await check.json().catch(() => ({}));
      if (!check.ok || result.available === false) {
        setLoading(false);
        setError(result.error || "Ce pseudo est deja pris.");
        return;
      }
    }

    const action = mode === "login"
      ? supabase.auth.signInWithPassword({ email, password })
      : supabase.auth.signUp({ email, password, options: { data: { pseudo } } });
    const { error: authError } = await action;
    setLoading(false);

    if (authError) {
      setError(authError.message === "Invalid login credentials" ? "Email ou mot de passe incorrect." : authError.message);
      return;
    }

    if (mode === "signup" && pseudo.trim()) {
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pseudo })
      }).catch(() => {});
    }

    router.push(mode === "signup" ? "/analyze" : "/dashboard");
    router.refresh();
  }

  return (
    <div className="mx-auto mt-10 grid max-w-md gap-4 rounded-lg border border-white/10 bg-panel p-6">
      <Button type="button" variant="secondary" onClick={signInWithGoogle} disabled={loading || !googleEnabled} className="w-full gap-2">
        <span className="grid h-5 w-5 place-items-center rounded-full bg-white text-xs font-bold text-ink">G</span>
        {googleEnabled ? "Continuer avec Google" : "Google bientot disponible"}
      </Button>
      {!googleEnabled && (
        <p className="rounded-md border border-amber-300/20 bg-amber-400/10 p-3 text-xs leading-5 text-amber-100">
          Pour l'instant, cree ton compte avec email et mot de passe. Google sera active apres configuration du provider dans Supabase.
        </p>
      )}

      <div className="flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-white/10" />
        ou avec email
        <span className="h-px flex-1 bg-white/10" />
      </div>

      <form action={onSubmit} className="grid gap-4">
        {mode === "signup" && (
          <div>
            <label className="text-sm text-muted">Pseudo</label>
            <input name="pseudo" type="text" placeholder="ex: VintageFlow" className="mt-2 w-full rounded-md border border-white/10 bg-white/5 px-3 py-3 outline-none focus:border-accent" />
          </div>
        )}
        <div>
          <label className="text-sm text-muted">Email</label>
          <input name="email" type="email" required className="mt-2 w-full rounded-md border border-white/10 bg-white/5 px-3 py-3 outline-none focus:border-accent" />
        </div>
        <div>
          <label className="text-sm text-muted">Mot de passe</label>
          <input name="password" type="password" required minLength={8} className="mt-2 w-full rounded-md border border-white/10 bg-white/5 px-3 py-3 outline-none focus:border-accent" />
        </div>
        {error && <p className="rounded-md bg-rose-500/10 p-3 text-sm text-rose-200">{error}</p>}
        <Button disabled={loading} className="gap-2">
          <Mail size={17} />
          {loading ? "Chargement..." : mode === "login" ? "Se connecter" : "Créer un compte"}
        </Button>
      </form>
    </div>
  );
}
