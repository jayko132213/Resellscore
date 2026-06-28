"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ExternalLink, KeyRound, Sparkles } from "lucide-react";

type AiStatus = {
  aiEnabled: boolean;
  provider: "openai" | "gemini" | "fallback";
};

export function AiSetupCard() {
  const [status, setStatus] = useState<AiStatus | null>(null);

  useEffect(() => {
    fetch("/api/ai/status", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => setStatus({ aiEnabled: Boolean(data.aiEnabled), provider: data.provider || "fallback" }))
      .catch(() => setStatus({ aiEnabled: false, provider: "fallback" }));
  }, []);

  const enabled = Boolean(status?.aiEnabled);
  const providerLabel = status?.provider === "openai" ? "OpenAI" : status?.provider === "gemini" ? "Gemini" : "IA";

  return (
    <section className={`rounded-lg border p-4 ${enabled ? "border-accent/25 bg-accent/[0.06]" : "border-amber-300/25 bg-amber-400/[0.08]"}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black uppercase ${enabled ? "bg-accent text-ink" : "bg-amber-300 text-ink"}`}>
            {enabled ? <CheckCircle2 size={14} /> : <KeyRound size={14} />}
            {enabled ? `${providerLabel} actif` : "Cle IA manquante"}
          </p>
          <h2 className="mt-3 flex items-center gap-2 text-xl font-bold text-white">
            <Sparkles size={19} className={enabled ? "text-accent" : "text-amber-200"} />
            Analyse IA avancee
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            {enabled
              ? `Le site peut utiliser ${providerLabel} pour lire les photos, les captures et les descriptions.`
              : "Google bloque avec la verification d'age, donc l'option simple maintenant c'est OpenAI."}
          </p>
        </div>
        <Link
          href="https://platform.openai.com/api-keys"
          target="_blank"
          className="inline-flex items-center gap-2 rounded-md border border-white/15 bg-white/10 px-3 py-2 text-sm font-bold text-white hover:bg-white/15"
        >
          Cle OpenAI
          <ExternalLink size={15} />
        </Link>
      </div>

      {!enabled && (
        <div className="mt-4 rounded-md border border-white/10 bg-black/20 p-3">
          <p className="text-sm font-semibold text-white">Quand tu as la cle OpenAI, colle-la dans le fichier du site :</p>
          <code className="mt-2 block rounded-md bg-ink px-3 py-2 text-sm text-accent">OPENAI_API_KEY=ta_cle_ici</code>
          <p className="mt-2 text-xs leading-5 text-muted">
            Gemini reste compatible aussi, mais OpenAI evite le blocage Google AI Studio.
          </p>
        </div>
      )}
    </section>
  );
}
