"use client";

import { useMemo, useState } from "react";
import { Check, Copy, FileText } from "lucide-react";
import { plans, type PlanKey } from "@/lib/plans";

export function ManualPaymentRequest({ plan, contactEmail }: { plan: Exclude<PlanKey, "free">; contactEmail: string }) {
  const [copied, setCopied] = useState(false);
  const [accountEmail, setAccountEmail] = useState("");
  const [paypalEmail, setPaypalEmail] = useState("");
  const [customerName, setCustomerName] = useState("");
  const message = useMemo(() => [
    "Bonjour,",
    "",
    `Je souhaite recevoir une facture PayPal pour activer ResellScore ${plans[plan].name}.`,
    `Email du compte ResellScore : ${accountEmail || "[email du compte]"}`,
    `Email PayPal : ${paypalEmail || "[email PayPal]"}`,
    `Nom / pseudo : ${customerName || "[nom ou pseudo]"}`,
    `Plan : ${plans[plan].name}`,
    `Prix : ${plans[plan].price}`,
    "",
    "Je comprends que l'abonnement est active manuellement apres paiement de la facture, sous 24 a 48h maximum."
  ].join("\n"), [accountEmail, customerName, paypalEmail, plan]);

  async function copyMessage() {
    await navigator.clipboard.writeText(message);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <aside className="rounded-lg border border-white/10 bg-panel p-6 shadow-glow">
      <div className="flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-md bg-accent/15 text-accent">
          <FileText size={18} />
        </span>
        <h2 className="text-xl font-bold">Facture PayPal</h2>
      </div>
      <p className="mt-2 text-sm leading-6 text-muted">
        Le client remplit ces infos, copie le message, puis tu lui envoies une facture PayPal propre.
      </p>

      <div className="mt-5 grid gap-3">
        <label className="grid gap-2 text-sm text-muted">
          Email du compte ResellScore
          <input
            value={accountEmail}
            onChange={(event) => setAccountEmail(event.target.value)}
            type="email"
            placeholder="client@email.com"
            className="rounded-md border border-white/10 bg-white/5 px-3 py-3 text-white outline-none focus:border-accent"
          />
        </label>
        <label className="grid gap-2 text-sm text-muted">
          Email PayPal pour la facture
          <input
            value={paypalEmail}
            onChange={(event) => setPaypalEmail(event.target.value)}
            type="email"
            placeholder="paypal@email.com"
            className="rounded-md border border-white/10 bg-white/5 px-3 py-3 text-white outline-none focus:border-accent"
          />
        </label>
        <label className="grid gap-2 text-sm text-muted">
          Nom ou pseudo
          <input
            value={customerName}
            onChange={(event) => setCustomerName(event.target.value)}
            type="text"
            placeholder="ex: Jayko"
            className="rounded-md border border-white/10 bg-white/5 px-3 py-3 text-white outline-none focus:border-accent"
          />
        </label>
      </div>

      <pre className="mt-4 whitespace-pre-wrap rounded-md border border-white/10 bg-white/[0.04] p-4 text-sm leading-6 text-slate-200">
        {message}
      </pre>

      <button
        type="button"
        onClick={copyMessage}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-accent px-4 py-3 text-sm font-black text-ink transition hover:bg-accent/90"
      >
        {copied ? <Check size={17} /> : <Copy size={17} />}
        {copied ? "Message copie" : "Copier pour demander la facture"}
      </button>

      <div className="mt-4 rounded-md border border-white/10 bg-white/[0.04] p-3 text-xs leading-5 text-muted">
        <p>Contact facture : {contactEmail}</p>
        <p className="mt-1">L'acces est active apres paiement de la facture PayPal, sous 24 a 48h maximum.</p>
      </div>
    </aside>
  );
}
