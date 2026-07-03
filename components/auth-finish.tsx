"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

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

export function AuthFinish() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Connexion Google en cours...");

  useEffect(() => {
    let cancelled = false;

    async function finishLogin() {
      const code = searchParams.get("code");
      const next = searchParams.get("next") || "/analyze";
      if (!code) {
        router.replace("/login?error=google_callback_missing&reason=missing_code");
        return;
      }

      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (cancelled) return;
      if (error) {
        router.replace(`/login?error=google_session_failed&reason=${encodeURIComponent(error.message)}`);
        return;
      }

      setMessage("Session en cours d'enregistrement...");
      const synced = await syncServerSession(data.session);

      if (cancelled) return;
      if (!synced) {
        router.replace("/login?error=google_session_failed&reason=session_sync_failed");
        return;
      }

      router.replace(next.startsWith("/") ? next : "/analyze");
    }

    finishLogin();
    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  return (
    <main className="shell grid min-h-[60vh] place-items-center py-16">
      <div className="w-full max-w-md rounded-lg border border-accent/20 bg-panel p-6 text-center shadow-glow">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-accent/10 text-accent">
          <Loader2 size={28} className="animate-spin" />
        </div>
        <h1 className="mt-5 text-2xl font-black text-white">Connexion</h1>
        <p className="mt-2 text-sm leading-6 text-muted">{message}</p>
      </div>
    </main>
  );
}
