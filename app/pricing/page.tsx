import { PricingTable } from "@/components/pricing-table";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasRealSupabaseConfig } from "@/lib/env";

export default async function PricingPage() {
  let signedIn = false;

  if (hasRealSupabaseConfig()) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    signedIn = Boolean(user);
  }

  return (
    <main className="shell py-14">
      <div className="max-w-2xl">
        <h1 className="text-4xl font-bold">Tarifs</h1>
        <p className="mt-3 text-muted">Des quotas clairs : Gratuit pour tester, Starter pour commencer, Pro pour revendre sérieusement, Elite pour analyser sans limite.</p>
      </div>
      <div className="mt-8">
        <PricingTable signedIn={signedIn} />
      </div>
    </main>
  );
}
