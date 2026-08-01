import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-[#ffd6ea] bg-[#fff8fb] text-[#6c5b7c]">
      <div className="shell flex flex-col gap-4 py-8 text-sm md:flex-row md:items-center md:justify-between">
        <p className="font-semibold">Squishy Need You - boutique kawaii anti-stress.</p>
        <nav className="flex flex-wrap gap-4">
          <Link href="/boutique" className="hover:text-[#ff6fb1]">Boutique</Link>
          <Link href="/panier" className="hover:text-[#ff6fb1]">Panier</Link>
          <Link href="/admin-shop" className="hover:text-[#ff6fb1]">Admin</Link>
          <Link href="/mentions-legales" className="hover:text-[#ff6fb1]">Mentions legales</Link>
          <Link href="/confidentialite" className="hover:text-[#ff6fb1]">Confidentialite</Link>
        </nav>
      </div>
    </footer>
  );
}
