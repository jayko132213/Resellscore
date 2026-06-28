import { ArrowRightLeft, ClipboardCheck, MessageSquareText, ShieldCheck } from "lucide-react";
import { PlanGate } from "@/components/plan-gate";
import { PrePurchaseWorkflow } from "@/components/pre-purchase-workflow";

export default async function PreAchatPage({ searchParams }: { searchParams: Promise<{ item?: string }> }) {
  const { item } = await searchParams;

  return (
    <main className="shell py-10">
      <div className="max-w-4xl">
        <p className="inline-flex rounded-full border border-amber-300/25 bg-amber-400/10 px-3 py-1 text-sm font-semibold text-amber-200">Starter+</p>
        <h1 className="mt-4 text-4xl font-bold">Pré-achat</h1>
        <p className="mt-3 max-w-3xl text-muted">
          Prépare ton achat avant de payer : questions vendeur, niveau de précision, score, puis annonce de revente prête à poster.
        </p>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {[
          { Icon: MessageSquareText, title: "Questions vendeur", text: "Rapide, complet ou expert selon le niveau de précision." },
          { Icon: ShieldCheck, title: "Décision d'achat", text: "Score, risques et marge selon les réponses obtenues." },
          { Icon: ClipboardCheck, title: "Annonce revente", text: "Titre, description, prix et checklist prêts à utiliser." }
        ].map(({ Icon, title, text }) => (
          <article key={title} className="rounded-lg border border-white/10 bg-panel p-4">
            <Icon className="text-accent" />
            <h2 className="mt-3 font-semibold">{title}</h2>
            <p className="mt-1 text-sm leading-6 text-muted">{text}</p>
          </article>
        ))}
      </div>

      <div className="mt-8 rounded-lg border border-white/10 bg-white/[0.03] p-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-slate-200">
          <ArrowRightLeft size={17} className="text-accent" />
          Flow : Analyse l'annonce, sécurise l'achat, puis prépare la revente avant même de recevoir le produit.
        </p>
      </div>

      <PlanGate minPlan="starter" feature="Pré-achat">
        <PrePurchaseWorkflow initialItem={item || ""} />
      </PlanGate>
    </main>
  );
}
