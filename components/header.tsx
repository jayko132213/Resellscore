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
      <div className="shell flex h-16 min-w-0 items-center justify-between gap-3">
        <Link href="/" className="flex min-w-0 shrink items-center gap-2.5 font-semibold" aria-label="Accueil ResellScore">
          <img src="/resellscore-icon.svg" alt="" className="h-9 w-9 shrink-0 rounded-lg" />
          <span className="truncate text-base tracking-normal">
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
