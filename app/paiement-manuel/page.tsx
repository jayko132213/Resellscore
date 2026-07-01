import Link from "next/link";
import type { ReactNode } from "react";
import { Clock, FileText, Mail, ShieldCheck } from "lucide-react";
import { plans, type PlanKey } from "@/lib/plans";
import { cn } from "@/lib/utils";
import { ManualPaymentRequest } from "@/components/manual-payment-request";

const paidPlans: PlanKey[] = ["starter", "pro", "elite"];

function getPlan(value?: string): Exclude<PlanKey, "free"> {
  return value === "starter" || value === "pro" || value === "elite" ? value : "starter";
}

export default async function ManualPaymentPage({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const params = await searchParams;
  const selectedPlan = getPlan(params.plan);
  const contactEmail = process.env.ADMIN_OWNER_EMAIL || "jayko9045@gmail.com";

  return (
    <main className="shell py-12">
      <div className="max-w-3xl">
        <p className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-sm font-bold text-accent">
          <Clock size={15} />
          Facture PayPal
        </p>
        <h1 className="mt-4 text-4xl font-bold">Recevoir une facture PayPal</h1>
        <p className="mt-3 text-muted">
          Choisis ton abonnement, envoie les infos de facture, puis l'acces est active par le proprietaire apres paiement.
        </p>
      </div>

      <section className="mt-8 grid gap-4 lg:grid-cols-[1fr_0.8fr]">
        <div className="rounded-lg border border-white/10 bg-panel p-6 shadow-glow">
          <h2 className="text-2xl font-bold">Choisir l'abonnement</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {paidPlans.map((plan) => (
              <Link
                key={plan}
                href={`/paiement-manuel?plan=${plan}`}
                className={cn(
                  "rounded-lg border p-4 transition",
                  selectedPlan === plan
                    ? "border-accent bg-accent/10 shadow-[0_0_22px_rgba(74,222,128,0.16)]"
                    : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
                )}
              >
                <p className="font-bold text-white">{plans[plan].name}</p>
                <p className="mt-2 text-xl font-black text-accent">{plans[plan].price}</p>
                <p className="mt-2 text-xs leading-5 text-muted">{plans[plan].limitLabel}</p>
              </Link>
            ))}
          </div>

          <div className="mt-6 rounded-lg border border-accent/20 bg-accent/[0.06] p-5">
            <p className="text-sm font-bold text-accent">Plan selectionne</p>
            <h3 className="mt-2 text-3xl font-black">{plans[selectedPlan].name}</h3>
            <p className="mt-1 text-2xl font-bold text-white">{plans[selectedPlan].price}</p>
            <p className="mt-3 text-sm leading-6 text-muted">
              L'abonnement commence a la date du paiement PayPal. Exemple : paiement le 27 juin, activation le 29 juin, fin d'abonnement le 27 juillet.
            </p>
          </div>

          <div className="mt-6 grid gap-3">
            <Step icon={<FileText size={18} />} title="1. Demande de facture">
              Le client indique son email ResellScore, son email PayPal et le plan choisi.
            </Step>
            <Step icon={<Mail size={18} />} title="2. Facture PayPal">
              Tu envoies une facture PayPal au client avec le montant du plan.
            </Step>
            <Step icon={<ShieldCheck size={18} />} title="3. Activation">
              Apres paiement, tu actives Starter, Pro ou Elite depuis ton panel admin.
            </Step>
            <Step icon={<Clock size={18} />} title="4. Delai">
              Activation sous 24 a 48h maximum. Le mois commence a la date du paiement, pas a la date d'activation.
            </Step>
          </div>
        </div>

        <ManualPaymentRequest plan={selectedPlan} contactEmail={contactEmail} />
      </section>
    </main>
  );
}

function Step({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="flex gap-3 rounded-md border border-white/10 bg-white/[0.04] p-4">
      <span className="mt-0.5 text-accent">{icon}</span>
      <div>
        <p className="font-bold text-white">{title}</p>
        <p className="mt-1 text-sm leading-6 text-muted">{children}</p>
      </div>
    </div>
  );
}
