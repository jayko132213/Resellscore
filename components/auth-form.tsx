"use client";

import { type FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Mail } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Button } from "./ui/button";

type DeviceChoice = "auto" | "iphone" | "samsung" | "pc";
type DeviceType = "iphone" | "samsung" | "android" | "pc";

function isDemoMode() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  return url.includes("example.supabase.co") || key === "demo-key";
}

function resolveDevice(choice: DeviceChoice): { type: DeviceType; label: string } {
  if (choice === "iphone") return { type: "iphone", label: "iPhone" };
  if (choice === "samsung") return { type: "samsung", label: "Samsung" };
  if (choice === "pc") return { type: "pc", label: "PC" };

  const userAgent = navigator.userAgent.toLowerCase();
  const platform = navigator.platform?.toLowerCase() || "";
  const touchDevice = window.matchMedia("(pointer: coarse)").matches;

  if (/iphone|ipod/.test(userAgent) || (platform === "macintel" && touchDevice)) return { type: "iphone", label: "iPhone" };
  if (/samsung|sm-|gt-|galaxy/.test(userAgent)) return { type: "samsung", label: "Samsung" };
  if (/android|mobile|windows phone/.test(userAgent) || touchDevice) return { type: "android", label: "Android" };
  return { type: "pc", label: "PC" };
}

function saveDeviceChoice(choice: DeviceChoice) {
  const device = resolveDevice(choice);
  localStorage.setItem("resellscore_device_choice", choice);
  localStorage.setItem("resellscore_device_type", device.type);
  localStorage.setItem("resellscore_device_label", device.label);
  window.dispatchEvent(new Event("resellscore-device-updated"));
  return device;
}

function saveDemoUser(email: string, pseudo = "", deviceChoice: DeviceChoice = "auto") {
  const device = saveDeviceChoice(deviceChoice);
  localStorage.setItem("resellscore_demo_user", JSON.stringify({
    email,
    pseudo,
    lastDevice: device.type,
    lastDeviceLabel: device.label,
    createdAt: new Date().toISOString()
  }));
  window.dispatchEvent(new Event("resellscore-user-updated"));
}

async function syncServerSession(session?: { access_token: string; refresh_token: string } | null) {
  if (!session?.access_token || !session.refresh_token) return false;

  const response = await fetch("/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      access_token: session.access_token,
      refresh_token: session.refresh_token
    })
  });

  return response.ok;
}

function getFriendlyAuthError(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes("provider") || lower.includes("oauth")) {
    return "Google n'est pas encore configure dans Supabase. Active le provider Google dans Supabase, puis ajoute le Client ID et le Secret Google.";
  }
  if (message === "Invalid login credentials") {
    return "Email ou mot de passe incorrect. Si tu as cree le compte dans Supabase, remets exactement le meme mot de passe dans Auth > Users.";
  }
  if (lower.includes("rate limit") || lower.includes("email rate")) {
    return "Supabase bloque les emails quelques minutes. Attends un peu avant de reessayer.";
  }
  if (lower.includes("already registered") || lower.includes("already been registered")) {
    return "Ce compte existe deja. Va sur Connexion au lieu de Creer un compte.";
  }
  if (lower.includes("email not confirmed")) {
    return "Le compte existe mais l'email n'est pas confirme. Dans Supabase > Auth > Users, confirme-le.";
  }
  return message;
}

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [callbackError, setCallbackError] = useState(false);
  const [deviceChoice, setDeviceChoice] = useState<DeviceChoice>("auto");

  useEffect(() => {
    setCallbackError(new URLSearchParams(window.location.search).has("error"));
    const stored = localStorage.getItem("resellscore_device_choice");
    if (stored === "auto" || stored === "iphone" || stored === "samsung" || stored === "pc") {
      setDeviceChoice(stored);
    }
  }, []);

  async function saveDeviceOnSupabase(choice: DeviceChoice) {
    const device = saveDeviceChoice(choice);
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.updateUser({
      data: {
        deviceChoice: choice,
        lastDevice: device.type,
        lastDeviceLabel: device.label,
        lastDeviceAt: new Date().toISOString()
      }
    }).catch(() => {});
    return device;
  }

  async function signInWithGoogle() {
    setError("");
    setLoading(true);
    saveDeviceChoice(deviceChoice);

    if (isDemoMode()) {
      saveDemoUser("google-demo@resellscore.app", "", deviceChoice);
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
        redirectTo: `${origin}/auth/callback?next=/analyze`
      }
    });
    setLoading(false);
    if (authError) setError(getFriendlyAuthError(authError.message));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email"));
    const password = String(formData.get("password"));
    const pseudo = String(formData.get("pseudo") || "");
    const selectedDevice = String(formData.get("device") || "auto") as DeviceChoice;
    const device = saveDeviceChoice(selectedDevice);

    if (isDemoMode()) {
      saveDemoUser(email, pseudo, selectedDevice);
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

    const cleanEmail = email.trim().toLowerCase();
    const cleanPseudo = pseudo.trim();
    const authResponse = mode === "login"
      ? await supabase.auth.signInWithPassword({ email: cleanEmail, password })
      : await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            pseudo: cleanPseudo,
            deviceChoice: selectedDevice,
            lastDevice: device.type,
            lastDeviceLabel: device.label
          }
        }
      });
    const { data, error: authError } = authResponse;

    if (authError) {
      setLoading(false);
      setError(getFriendlyAuthError(authError.message));
      return;
    }

    if (mode === "signup" && !data.session) {
      setLoading(false);
      setError("Compte cree, mais Supabase demande encore une confirmation email. Desactive Confirm email pour les tests.");
      return;
    }

    const synced = await syncServerSession(data.session);
    await saveDeviceOnSupabase(selectedDevice);

    if (mode === "signup" && cleanPseudo) {
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pseudo: cleanPseudo })
      }).catch(() => {});
    }

    if (!synced) {
      setLoading(false);
      setError("Connexion creee, mais le site n'a pas reussi a garder la session. Recharge la page et reessaie.");
      return;
    }

    setLoading(false);
    window.location.assign(mode === "signup" ? "/analyze" : "/dashboard");
  }

  return (
    <div className="mx-auto mt-10 grid max-w-md gap-4 rounded-lg border border-white/10 bg-panel p-6">
      <Button type="button" variant="secondary" onClick={signInWithGoogle} disabled={loading} className="w-full gap-2">
        <span className="grid h-5 w-5 place-items-center rounded-full bg-white text-xs font-bold text-ink">G</span>
        {loading ? "Connexion..." : "Continuer avec Google"}
      </Button>
      {callbackError && (
        <p className="rounded-md border border-rose-300/20 bg-rose-400/10 p-3 text-xs leading-5 text-rose-100">
          Connexion Google incomplete. Verifie que Supabase a bien l'URL de redirection et que le provider Google est active.
        </p>
      )}

      <div className="flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-white/10" />
        ou avec email
        <span className="h-px flex-1 bg-white/10" />
      </div>

      <form onSubmit={onSubmit} className="grid gap-4">
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
        <div>
          <label className="text-sm text-muted">Interface a utiliser</label>
          <select
            name="device"
            value={deviceChoice}
            onChange={(event) => {
              const value = event.target.value as DeviceChoice;
              setDeviceChoice(value);
              saveDeviceChoice(value);
            }}
            className="mt-2 w-full rounded-md border border-white/10 bg-white/5 px-3 py-3 outline-none focus:border-accent"
          >
            <option value="auto" className="bg-ink">Detecter automatiquement</option>
            <option value="iphone" className="bg-ink">iPhone</option>
            <option value="samsung" className="bg-ink">Samsung</option>
            <option value="pc" className="bg-ink">PC</option>
          </select>
          <p className="mt-2 text-xs leading-5 text-muted">
            Si l'iPhone bug, choisis iPhone ici et le site force l'interface mobile propre.
          </p>
        </div>
        {error && <p className="rounded-md bg-rose-500/10 p-3 text-sm text-rose-200">{error}</p>}
        <Button disabled={loading} className="gap-2">
          <Mail size={17} />
          {loading ? "Chargement..." : mode === "login" ? "Se connecter" : "Creer un compte"}
        </Button>
      </form>
    </div>
  );
}
