import Link from "next/link";
import { ArrowUp, ShieldCheck, Star } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasRealSupabaseConfig } from "@/lib/env";
import { AuthNav } from "./auth-nav";

export async function Header() {
  let signedIn = false;

  if (hasRealSupabaseConfig()) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    signedIn = Boolean(user);
  }

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-ink/80 backdrop-blur">
      <div className="shell flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 font-semibold" aria-label="Accueil ResellScore">
          <img src="/resellscore-icon.svg" alt="" className="h-9 w-9 rounded-lg" />
          <span className="text-base tracking-normal">
            Resell<span className="text-accent">Score</span>
          </span>
        </Link>
        <nav className="text-sm">
          <AuthNav serverSignedIn={signedIn} />
        </nav>
      </div>
      <nav className="border-t border-white/10 lg:hidden" aria-label="Navigation mobile">
        <div className="shell flex gap-2 overflow-x-auto py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <MobileLink href={signedIn ? "/analyze" : "/signup"} label="Analyser" active />
          <MobileLink href="/opportunities" label="Tendances" badge="Elite" icon={<ArrowUp size={11} />} />
          <MobileLink href="/pre-achat" label="Pré-achat" badge="Starter+" icon={<Star size={11} />} />
          <MobileLink href="/vente" label="Vente" badge="Pro+" icon={<ShieldCheck size={11} />} />
          <MobileLink href="/pricing" label="Tarifs" />
        </div>
      </nav>
    </header>
  );
}

function MobileLink({ href, label, badge, icon, active = false }: { href: string; label: string; badge?: string; icon?: React.ReactNode; active?: boolean }) {
  return (
    <Link
      href={href}
      className={`flex min-h-11 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-bold ${
        active ? "bg-accent text-ink" : "border border-white/10 bg-white/[0.04] text-white"
      }`}
    >
      <span>{label}</span>
      {badge && (
        <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-[10px] font-black uppercase">
          {icon}
          {badge}
        </span>
      )}
    </Link>
  );
}
