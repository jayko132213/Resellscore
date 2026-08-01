import Link from "next/link";
import { Candy, LayoutDashboard, Sparkles } from "lucide-react";
import { CartCount } from "@/components/squishy-cart";

export async function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-[#ffd6ea] bg-white/82 text-[#281c3d] shadow-[0_12px_40px_rgba(255,111,177,0.12)] backdrop-blur">
      <div className="shell flex h-16 items-center justify-between gap-3">
        <Link href="/" className="flex min-w-0 items-center gap-3" aria-label="Accueil Squishy Need You">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#ff6fb1] text-white shadow-[0_14px_28px_rgba(255,111,177,0.28)]">
            <Candy size={25} />
          </span>
          <span className="truncate text-base font-black sm:text-xl">
            Squishy <span className="text-[#ff6fb1]">Need</span> You
          </span>
        </Link>

        <nav className="flex min-w-0 items-center gap-2">
          <Link href="/boutique" className="hidden h-10 items-center gap-2 rounded-full bg-[#fff4bf] px-4 text-sm font-black text-[#281c3d] sm:inline-flex">
            <Sparkles size={16} />
            Boutique
          </Link>
          <Link href="/admin-shop" className="hidden h-10 items-center gap-2 rounded-full border border-[#ffd6ea] bg-white px-4 text-sm font-black text-[#281c3d] md:inline-flex">
            <LayoutDashboard size={16} />
            Admin
          </Link>
          <CartCount />
        </nav>
      </div>
    </header>
  );
}
