import type { ReactNode } from "react";

export default function ConfidentialitePage() {
  return (
    <main className="shell py-12">
      <div className="max-w-3xl">
        <h1 className="text-4xl font-bold">Politique de confidentialite</h1>
        <div className="mt-8 space-y-6 text-sm leading-7 text-slate-200">
          <Section title="Donnees collectees">
            <p>ResellScore peut collecter l'email du compte, le pseudo, les analyses effectuees, les informations d'abonnement et les messages envoyes pour l'activation manuelle.</p>
          </Section>

          <Section title="Utilisation">
            <p>Ces donnees servent a faire fonctionner le compte, appliquer les quotas, fournir les analyses, gerer les abonnements et proteger le service.</p>
          </Section>

          <Section title="IA et analyses">
            <p>Les informations envoyees dans une analyse peuvent etre transmises au fournisseur d'IA configure afin de produire le score, les conseils et les estimations.</p>
          </Section>

          <Section title="Paiement manuel">
            <p>En cas de paiement manuel, l'utilisateur envoie une preuve de paiement et son email de compte. Ces informations servent uniquement a activer ou prolonger l'abonnement.</p>
          </Section>

          <Section title="Conservation">
            <p>Les donnees sont conservees tant que le compte est actif ou tant qu'elles sont utiles au fonctionnement du service. Une demande de suppression peut etre envoyee a jayko9045@gmail.com.</p>
          </Section>

          <Section title="Contact">
            <p>Pour toute demande concernant les donnees personnelles : jayko9045@gmail.com</p>
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
