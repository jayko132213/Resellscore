import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-white/10 bg-white/[0.02]">
      <div className="shell flex flex-col gap-4 py-8 text-sm text-muted md:flex-row md:items-center md:justify-between">
        <p>ResellScore - outil d'aide a l'analyse et a la revente.</p>
        <nav className="flex flex-wrap gap-4">
          <Link href="/mentions-legales" className="hover:text-white">Mentions legales</Link>
          <Link href="/confidentialite" className="hover:text-white">Confidentialite</Link>
          <Link href="/conditions" className="hover:text-white">Conditions</Link>
          <Link href="/paiement-manuel" className="hover:text-white">Paiement manuel</Link>
        </nav>
      </div>
    </footer>
  );
}
