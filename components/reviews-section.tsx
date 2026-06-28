const reviews = [
  {
    name: "Nina L.",
    handle: "nina.archive",
    text: "Le score marge/risque rend le tri beaucoup plus rapide. Je vois direct quand une pièce vaut une négociation.",
    rating: "9/10"
  },
  {
    name: "Malo R.",
    handle: "malo_resell",
    text: "J'aime surtout le prix max conseillé. Ça évite d'acheter trop haut juste parce que la pièce est stylée.",
    rating: "8.5/10"
  },
  {
    name: "Yanis V.",
    handle: "yard.vintage",
    text: "L'interface est claire : lien Vinted quand j'ai l'annonce, manuel quand je chine hors plateforme.",
    rating: "8/10"
  }
];

export function ReviewsSection() {
  return (
    <section className="shell py-20">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-3xl font-bold">Avis</h2>
          <p className="mt-2 text-muted">Exemples d'avis en attendant les premiers retours clients réels.</p>
        </div>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {reviews.map((review) => (
          <article key={review.handle} className="rounded-lg border border-white/10 bg-panel p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-full bg-accent/15 font-bold text-accent">
                  {review.name.slice(0, 1)}
                </div>
                <div>
                  <h3 className="font-semibold">{review.name}</h3>
                  <p className="text-xs text-muted">@{review.handle}</p>
                </div>
              </div>
              <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-bold text-ink">{review.rating}</span>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-300">{review.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
