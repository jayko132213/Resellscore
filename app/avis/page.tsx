import { MessageSquare, Star } from "lucide-react";
import { ReviewsSection } from "@/components/reviews-section";

export default function AvisPage() {
  return (
    <main>
      <section className="shell py-10">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-xs font-black text-accent">
            <MessageSquare size={14} />
            Retours utilisateurs
          </div>
          <h1 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">Avis ResellScore</h1>
          <p className="mt-3 max-w-2xl leading-7 text-muted">
            Une page simple pour rassurer les nouveaux utilisateurs et montrer que le site sert vraiment à décider plus vite.
          </p>
        </div>
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {["Analyse plus claire", "Meilleure négociation", "Moins d'achats risqués"].map((label) => (
            <div key={label} className="rounded-md border border-white/10 bg-panel p-4">
              <Star size={16} className="text-accent" />
              <p className="mt-2 text-sm font-black text-white">{label}</p>
            </div>
          ))}
        </div>
      </section>
      <ReviewsSection />
    </main>
  );
}
