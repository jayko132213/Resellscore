import type { ReactNode } from "react";

export default function ConditionsPage() {
  return (
    <main className="shell py-12">
      <div className="max-w-3xl">
        <h1 className="text-4xl font-bold">Conditions d'utilisation</h1>
        <div className="mt-8 space-y-6 text-sm leading-7 text-slate-200">
          <Section title="Objet">
            <p>ResellScore aide les utilisateurs a analyser des annonces, estimer un potentiel de revente, preparer un pre-achat et creer une annonce de vente.</p>
          </Section>

          <Section title="Pas de garantie de benefice">
            <p>Les scores, prix et marges sont des estimations. ResellScore ne garantit pas qu'un produit sera vendu, rentable, authentique ou conforme a l'annonce du vendeur.</p>
          </Section>

          <Section title="Abonnements">
            <p>Les plans disponibles sont Gratuit, Starter, Pro et Elite. Les limites et fonctionnalites sont affichees sur la page Tarifs.</p>
            <p>En paiement manuel, l'acces peut prendre jusqu'a 48h apres verification du paiement.</p>
            <p>La periode d'abonnement commence a la date du paiement. Exemple : paiement le 27 juin, fin le 27 juillet, meme si l'activation est faite plus tard.</p>
          </Section>

          <Section title="Expiration manuelle">
            <p>Pour un abonnement manuel, le proprietaire du site ajoute une date de fin. Quand cette date est depassee, le compte repasse automatiquement en Gratuit.</p>
          </Section>

          <Section title="Utilisation interdite">
            <p>Il est interdit d'utiliser ResellScore pour frauder, tromper un acheteur, contourner les regles d'une plateforme, vendre des produits interdits ou diffuser de fausses informations.</p>
          </Section>

          <Section title="Contact">
            <p>Pour une question sur le service ou un abonnement : jayko9045@gmail.com</p>
          </Section>
        </div>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-white/10 bg-panel p-5">
      <h2 className="text-xl font-bold text-white">{title}</h2>
      <div className="mt-3 space-y-3 text-muted">{children}</div>
    </section>
  );
}
