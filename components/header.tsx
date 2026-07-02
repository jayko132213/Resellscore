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
      <div className="shell flex h-14 min-w-0 items-center justify-between gap-2 sm:h-16 sm:gap-3">
        <Link href="/" className="flex min-w-0 shrink items-center gap-2 font-semibold sm:gap-2.5" aria-label="Accueil ResellScore">
          <img src="/resellscore-icon.svg" alt="" className="h-8 w-8 shrink-0 rounded-lg sm:h-9 sm:w-9" />
          <span className="truncate text-sm tracking-normal sm:text-base">
            Resell<span className="text-accent">Score</span>
          </span>
        </Link>
        <nav className="shrink-0 text-sm">
          <AuthNav serverSignedIn={signedIn} />
        </nav>
      </div>
    </header>
  );
}
