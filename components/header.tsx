import Link from "next/link";
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
    </header>
  );
}
