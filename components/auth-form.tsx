"use client";

import { type FormEvent, type ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Monitor, MoreHorizontal, Smartphone, TabletSmartphone } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Button } from "./ui/button";

type DeviceChoice = "auto" | "iphone" | "samsung" | "pc";
type DeviceType = "iphone" | "samsung" | "android" | "pc";

const deviceOptions: {
  value: Exclude<DeviceChoice, "auto">;
  label: string;
  detail: string;
  icon: ReactNode;
}[] = [
  { value: "iphone", label: "iPhone", detail: "Petit format avec menu 3 points", icon: <Smartphone size={22} /> },
  { value: "samsung", label: "Samsung", detail: "Petit format avec menu 3 points", icon: <TabletSmartphone size={22} /> },
  { value: "pc", label: "PC", detail: "Grand format avec barre complete", icon: <Monitor size={22} /> }
];

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
    return "Email ou mot de passe incorrect. Si le compte a ete cree avec Google, connecte-toi avec Google. Sinon clique sur Mot de passe oublie pour le remettre proprement.";
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
  const [deviceChoice, setDeviceChoice] = useState<DeviceChoice>("iphone");
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    const hasCallbackError = new URLSearchParams(window.location.search).has("error");
    setCallbackError(hasCallbackError);
    if (hasCallbackError && !isDemoMode()) {
      createSupabaseBrowserClient().auth.getUser().then(({ data }) => {
        if (data.user) {
          router.replace("/analyze?connected=google");
        }
      }).catch(() => {});
    }
    const stored = localStorage.getItem("resellscore_device_choice");
    if (stored === "iphone" || stored === "samsung" || stored === "pc") {
      setDeviceChoice(stored);
    } else if (stored === "auto") {
      setDeviceChoice(resolveDevice("auto").type === "pc" ? "pc" : "iphone");
    }
  }, [router]);

  const callbackUrl = typeof window === "undefined" ? "" : `${window.location.origin}/auth/callback`;

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
        redirectTo: `${origin}/auth/callback?next=/analyze`,
        queryParams: {
          prompt: "select_account"
        }
      }
    });
    setLoading(false);
    if (authError) setError(getFriendlyAuthError(authError.message));
  }

  async function resetPassword() {
    setError("");
    setResetSent(false);

    const emailInput = document.querySelector<HTMLInputElement>('input[name="email"]');
    const cleanEmail = emailInput?.value.trim().toLowerCase() || "";
    if (!cleanEmail) {
      setError("Mets ton email, puis clique sur Mot de passe oublie.");
      return;
    }

    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    const origin = window.location.origin;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: `${origin}/auth/callback?next=/profile`
    });
    setLoading(false);

    if (resetError) {
      setError(getFriendlyAuthError(resetError.message));
      return;
    }
    setResetSent(true);
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
    <div className="mx-auto mt-6 grid max-w-md gap-4 rounded-lg border border-white/10 bg-panel p-4 sm:mt-10 sm:p-6">
      <Button type="button" variant="secondary" onClick={signInWithGoogle} disabled={loading} className="w-full gap-2">
        <span className="grid h-5 w-5 place-items-center rounded-full bg-white text-xs font-bold text-ink">G</span>
        {loading ? "Connexion..." : "Continuer avec Google"}
      </Button>
      {callbackError && (
        <p className="rounded-md border border-rose-300/20 bg-rose-400/10 p-3 text-xs leading-5 text-rose-100">
          Connexion Google incomplete. Dans Supabase, ajoute exactement cette URL dans les redirections autorisees : <span className="font-black text-white">{callbackUrl}</span>. Verifie aussi que le provider Google est active.
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
            <input name="pseudo" type="text" autoComplete="nickname" placeholder="ex: VintageFlow" className="mt-2 w-full rounded-md border border-white/10 bg-white/5 px-3 py-3 text-base outline-none focus:border-accent" />
          </div>
        )}
        <div>
          <label className="text-sm text-muted">Email</label>
          <input name="email" type="email" required autoComplete="email" inputMode="email" className="mt-2 w-full rounded-md border border-white/10 bg-white/5 px-3 py-3 text-base outline-none focus:border-accent" />
        </div>
        <div>
          <div className="flex items-center justify-between gap-3">
            <label className="text-sm text-muted">Mot de passe</label>
            {mode === "login" && (
              <button type="button" onClick={resetPassword} disabled={loading} className="text-xs font-bold text-accent hover:underline">
                Mot de passe oublie
              </button>
            )}
          </div>
          <input name="password" type="password" required minLength={8} autoComplete={mode === "login" ? "current-password" : "new-password"} className="mt-2 w-full rounded-md border border-white/10 bg-white/5 px-3 py-3 text-base outline-none focus:border-accent" />
        </div>
        <div>
          <label className="text-sm text-muted">Choisis ton interface</label>
          <input type="hidden" name="device" value={deviceChoice} />
          <div className="mt-2 grid grid-cols-3 gap-1.5 sm:gap-2">
            {deviceOptions.map((option) => {
              const active = deviceChoice === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setDeviceChoice(option.value);
                    saveDeviceChoice(option.value);
                  }}
                  className={`grid min-h-20 place-items-center gap-1.5 rounded-md border p-2 text-center transition sm:min-h-28 sm:gap-2 sm:p-3 ${
                    active ? "border-accent bg-accent/10 text-accent" : "border-white/10 bg-white/[0.04] text-white hover:border-white/25"
                  }`}
                >
                  <span className="grid h-8 w-8 place-items-center rounded-full border border-current/30 sm:h-10 sm:w-10">
                    {option.icon}
                  </span>
                  <span className="text-xs font-black sm:text-sm">{option.label}</span>
                  <span className="hidden text-[10px] leading-4 text-muted sm:block">{option.detail}</span>
                  {option.value !== "pc" && (
                    <span className="hidden items-center gap-1 rounded-full border border-white/10 px-2 py-1 text-[10px] font-bold sm:inline-flex">
                      <MoreHorizontal size={13} />
                      Menu
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
        {error && <p className="rounded-md bg-rose-500/10 p-3 text-sm text-rose-200">{error}</p>}
        {resetSent && <p className="rounded-md bg-accent/10 p-3 text-sm text-accent">Email envoye. Ouvre le lien Supabase pour remettre ton mot de passe.</p>}
        <Button disabled={loading} className="gap-2">
          <Mail size={17} />
          {loading ? "Chargement..." : mode === "login" ? "Se connecter" : "Creer un compte"}
        </Button>
      </form>
    </div>
  );
}
