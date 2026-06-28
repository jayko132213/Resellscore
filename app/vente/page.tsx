import { BadgeEuro, Camera, ClipboardCheck } from "lucide-react";
import { PlanGate } from "@/components/plan-gate";
import { SaleListingWorkflow } from "@/components/sale-listing-workflow";

export default function VentePage() {
  return (
    <main className="shell py-10">
      <div className="max-w-4xl">
        <p className="inline-flex rounded-full border border-sky-300/25 bg-sky-400/10 px-3 py-1 text-sm font-semibold text-sky-200">Pro+</p>
        <h1 className="mt-4 text-4xl font-bold">Vente</h1>
        <p className="mt-3 max-w-3xl text-muted">
          Quand tu as reçu le produit, ajoute tes vraies photos et les infos réelles. Vente prépare l'annonce complète prête à poster.
        </p>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {[
          { Icon: Camera, title: "Photos", text: "Importe les photos et récupère l'ordre idéal." },
          { Icon: BadgeEuro, title: "Prix", text: "Prix conseillé, prix ambitieux et prix rapide." },
          { Icon: ClipboardCheck, title: "Annonce", text: "Titre, description, points forts, points faibles et checklist." }
        ].map(({ Icon, title, text }) => (
          <article key={title} className="rounded-lg border border-white/10 bg-panel p-4">
            <Icon className="text-accent" />
            <h2 className="mt-3 font-semibold">{title}</h2>
            <p className="mt-1 text-sm leading-6 text-muted">{text}</p>
          </article>
        ))}
      </div>

      <PlanGate minPlan="pro" feature="Vente">
        <SaleListingWorkflow />
      </PlanGate>
    </main>
  );
}
