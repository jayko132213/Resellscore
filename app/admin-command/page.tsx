import { ShieldCheck } from "lucide-react";
import { getAdminAccess } from "@/lib/admin-owner";
import { AdminPanel } from "@/components/admin-panel";

export default async function AdminCommandPage() {
  const access = await getAdminAccess();

  if (!access.allowed) {
    return (
      <main className="shell py-10">
        <div className="max-w-xl rounded-lg border border-rose-400/25 bg-rose-500/10 p-6 shadow-glow">
          <p className="inline-flex items-center gap-2 rounded-full border border-rose-300/25 bg-rose-500/10 px-3 py-1 text-sm font-semibold text-rose-100">
            <ShieldCheck size={15} />
            Acces refuse
          </p>
          <h1 className="mt-4 text-3xl font-bold">Panel proprietaire</h1>
          <p className="mt-3 text-sm leading-6 text-rose-100">
            Ce panel est reserve au compte proprietaire du site. Meme avec l'URL, personne ne peut l'utiliser sans etre connecte avec l'email admin.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="shell py-10">
      <AdminPanel />
    </main>
  );
}
