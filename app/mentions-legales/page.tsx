import type { ReactNode } from "react";

export default function MentionsLegalesPage() {
  return (
    <main className="shell py-12">
      <LegalPage title="Mentions legales">
        <Section title="Editeur du site">
          <p>ResellScore est un service en ligne d'aide a l'analyse d'annonces, au pre-achat et a la revente.</p>
          <p>Contact : jayko9045@gmail.com</p>
        </Section>

        <Section title="Hebergement">
          <p>Le site est prevu pour etre heberge par Vercel Inc.</p>
          <p>Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, Etats-Unis.</p>
        </Section>

        <Section title="Responsabilite">
          <p>
            ResellScore donne des estimations et conseils d'aide a la decision. Les resultats ne garantissent pas un benefice,
            une vente, une marge ou l'authenticite d'un produit. L'utilisateur reste responsable de ses achats, ventes,
            negociations et verifications.
          </p>
        </Section>

        <Section title="Propriete intellectuelle">
          <p>
            Le nom ResellScore, l'interface, les textes et les elements du site ne peuvent pas etre copies ou reutilises sans autorisation.
          </p>
        </Section>
      </LegalPage>
    </main>
  );
}

function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="max-w-3xl">
      <h1 className="text-4xl font-bold">{title}</h1>
      <div className="mt-8 space-y-6 text-sm leading-7 text-slate-200">{children}</div>
    </div>
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
