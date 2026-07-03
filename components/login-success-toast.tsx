"use client";

import { useEffect, useState } from "react";

export function LoginSuccessToast() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const url = new URL(window.location.href);
    const connected = url.searchParams.get("connected");
    if (!connected) return;

    setVisible(true);
    url.searchParams.delete("connected");
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);

    const timeout = window.setTimeout(() => setVisible(false), 4200);
    return () => window.clearTimeout(timeout);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-3 top-20 z-[70] mx-auto max-w-sm rounded-lg border border-accent/35 bg-ink/95 p-4 shadow-[0_0_42px_rgba(74,222,128,0.22)] backdrop-blur md:right-6 md:left-auto md:mx-0">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent text-xl font-black text-ink shadow-[0_0_28px_rgba(74,222,128,0.35)]">
          ✓
        </div>
        <div>
          <p className="font-black text-white">Connexion réussie</p>
          <p className="mt-1 text-sm leading-5 text-muted">Ton compte est connecté. Tu peux lancer une analyse.</p>
        </div>
      </div>
    </div>
  );
}
