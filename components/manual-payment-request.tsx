"use client";

import { useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";
import { plans, type PlanKey } from "@/lib/plans";

export function ManualPaymentRequest({ plan, contactEmail }: { plan: Exclude<PlanKey, "free">; contactEmail: string }) {
  const [copied, setCopied] = useState(false);
  const message = useMemo(() => [
    "Bonjour,",
    "",
    `Je veux activer ResellScore ${plans[plan].name}.`,
    "Email du compte : [mon email]",
    `Plan : ${plans[plan].name}`,
    `Prix : ${plans[plan].price}`,
    "Date de paiement : [date]",
    "",
    "Preuve de paiement jointe."
  ].join("\n"), [plan]);

  async function copyMessage() {
    await navigator.clipboard.writeText(message);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <aside className="rounded-lg border border-white/10 bg-panel p-6 shadow-glow">
      <h2 className="text-xl font-bold">Demande d'activation</h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        Copie ce message, puis envoie-le avec ta preuve de paiement. Pas besoin d'ouvrir une appli mail bizarre.
      </p>

      <pre className="mt-4 whitespace-pre-wrap rounded-md border border-white/10 bg-white/[0.04] p-4 text-sm leading-6 text-slate-200">
        {message}
      </pre>

      <button
        type="button"
        onClick={copyMessage}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-accent px-4 py-3 text-sm font-black text-ink transition hover:bg-accent/90"
      >
        {copied ? <Check size={17} /> : <Copy size={17} />}
        {copied ? "Message copie" : "Copier le message"}
      </button>

      <div className="mt-4 rounded-md border border-white/10 bg-white/[0.04] p-3 text-xs leading-5 text-muted">
        <p>Contact : {contactEmail}</p>
        <p className="mt-1">L'acces est active apres verification du paiement, sous 48h maximum.</p>
      </div>
    </aside>
  );
}
