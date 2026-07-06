"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowUp, CheckCircle2, Crown, ExternalLink, Loader2, Lock, Search, ShieldCheck, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { normalizePlan } from "@/lib/plans";

type SortKey = "margin" | "season" | "safe";
type BudgetKey = "all" | "small" | "middle" | "high";
type DemoUser = { plan?: string };

type LiveOpportunity = {
  id: string;
  title: string;
  category: string;
  score: number;
  buy: number;
  listingPrice: number;
  retail: number;
  resale: number;
  margin: number;
  marginRate: number;
  demand: number;
  popularity: number;
  link: string;
  signal: string;
  reason: string;
  risk: string;
  condition: string;
  sellerSignal: string;
  spottedAt: string;
};

type Trend = {
  id: string;
  title: string;
  category: string;
  season: string;
  budget: string;
  buyMin: number;
  buyMax: number;
  resale: string;
  marginScore: number;
  seasonScore: number;
  safetyScore: number;
  demand: string;
  whyNow: string;
  searchIdeas: string[];
  checks: string[];
  avoid: string;
  saleAngle: string;
};

const sortFilters: { key: SortKey; label: string }[] = [
  { key: "margin", label: "Marge forte" },
  { key: "season", label: "En hausse maintenant" },
  { key: "safe", label: "Plus safe" }
];

const budgetFilters: { key: BudgetKey; label: string; min: number; max: number }[] = [
  { key: "all", label: "Tous budgets", min: 0, max: Number.POSITIVE_INFINITY },
  { key: "small", label: "0-30 EUR", min: 0, max: 30 },
  { key: "middle", label: "30-120 EUR", min: 30, max: 120 },
  { key: "high", label: "120 EUR+", min: 120, max: Number.POSITIVE_INFINITY }
];

const trends: Trend[] = [
  {
    id: "summer-nike-shorts",
    title: "Shorts Nike, Adidas et Umbro colores",
    category: "Ete / sportwear",
    season: "Tres bon de juin a aout",
    budget: "10-25 EUR",
    buyMin: 10,
    buyMax: 25,
    resale: "24-45 EUR",
    marginScore: 7.8,
    seasonScore: 9.2,
    safetyScore: 8.5,
    demand: "Demande haute si couleur forte, taille M/L et logo visible.",
    whyNow: "En ete, les shorts propres et colores partent mieux, surtout avec photos portees ou fond lumineux.",
    searchIdeas: ["short Nike vert", "short Adidas vintage", "short Umbro nylon", "short football retro"],
    checks: ["Verifier elastique", "Demander mesure taille", "Regarder taches entrejambe", "Logo pas craquele"],
    avoid: "Evite les shorts sans marque a plus de 12 EUR ou les tailles trop petites sans mesures.",
    saleAngle: "Mets en avant la couleur, la coupe, la taille exacte et le cote parfait vacances/festival."
  },
  {
    id: "ralph-cable-knit",
    title: "Pulls Ralph Lauren torsades",
    category: "Classique premium",
    season: "A acheter hors saison",
    budget: "15-35 EUR",
    buyMin: 15,
    buyMax: 35,
    resale: "45-80 EUR",
    marginScore: 8.6,
    seasonScore: 7.4,
    safetyScore: 8.2,
    demand: "Tres liquide si logo visible, couleur creme/marine/gris et taille S a L.",
    whyNow: "Hors hiver, certains vendeurs bradent. Tu peux stocker et revendre plus haut quand le froid revient.",
    searchIdeas: ["Ralph Lauren pull torsade", "Polo Ralph Lauren maille", "pull coton cable knit"],
    checks: ["Photo etiquette marque", "Col pas detendu", "Pas de trou maille", "Mesure aisselle a aisselle"],
    avoid: "Evite les pulls bouloches avec col fatigue, meme pas chers.",
    saleAngle: "Vends le cote intemporel, propre, facile a porter avec jean ou pantalon habille."
  },
  {
    id: "gorpcore-fleece",
    title: "Polaires outdoor Nike ACG, Patagonia, The North Face",
    category: "Gorpcore",
    season: "Monte avant automne",
    budget: "25-70 EUR",
    buyMin: 25,
    buyMax: 70,
    resale: "65-150 EUR",
    marginScore: 8.9,
    seasonScore: 8.3,
    safetyScore: 7.7,
    demand: "Forte demande si zip OK, logo brode et coloris sobre ou vintage.",
    whyNow: "Le style outdoor reste fort. Les bonnes polaires se vendent vite quand les temperatures baissent.",
    searchIdeas: ["Nike ACG polaire", "Patagonia Synchilla", "The North Face fleece", "Columbia titanium"],
    checks: ["Zip entier", "Poignets pas uses", "Bouloches acceptables", "Etiquette taille visible"],
    avoid: "Attention aux polaires trop usees ou photos floues qui cachent les manches.",
    saleAngle: "Mets en avant chaleur, coupe, matiere, logo et usage ville/outdoor."
  },
  {
    id: "levis-501",
    title: "Levi's 501 / 505 avec vraies mesures",
    category: "Denim",
    season: "Stable toute l'annee",
    budget: "15-35 EUR",
    buyMin: 15,
    buyMax: 35,
    resale: "38-75 EUR",
    marginScore: 7.9,
    seasonScore: 7.8,
    safetyScore: 8.8,
    demand: "Bonne rotation si taille W30-W34, longueur claire et coupe non retouchee bizarre.",
    whyNow: "C'est une niche safe : moins hype, mais tres reguliere si tu donnes les mesures propres.",
    searchIdeas: ["Levis 501 W32", "Levis 505 made in USA", "jean Levi's straight vintage"],
    checks: ["Largeur taille", "Longueur jambe", "Ourlet", "Usure entrejambe"],
    avoid: "N'achete pas sans mesures, les retours mentaux des acheteurs viennent presque toujours de la taille.",
    saleAngle: "Annonce avec mesures nettes, coupe expliquee et photos face/dos/etiquette."
  },
  {
    id: "football-shirts",
    title: "Maillots de foot retro ou clubs populaires",
    category: "Sport collector",
    season: "Pics pendant compet et mercato",
    budget: "15-60 EUR",
    buyMin: 15,
    buyMax: 60,
    resale: "35-120 EUR",
    marginScore: 8.2,
    seasonScore: 8.7,
    safetyScore: 6.9,
    demand: "Tres bon si club connu, saison precise, sponsor propre et flocage en bon etat.",
    whyNow: "La demande bouge avec les competitions, transferts et tendances TikTok/maillots retro.",
    searchIdeas: ["maillot retro Nike", "maillot PSG vintage", "maillot France 98", "maillot Adidas ancien"],
    checks: ["Authenticite etiquette", "Flocage pas colle", "Sponsor pas craquele", "Taille exacte"],
    avoid: "Beaucoup de copies : si le prix est trop bas sur une piece rare, demande plusieurs photos.",
    saleAngle: "Raconte la saison, le club, l'etat du flocage et le style streetwear."
  },
  {
    id: "winter-puffers",
    title: "Doudounes Moncler, The North Face, Napapijri",
    category: "Hiver premium",
    season: "A sourcer avant octobre",
    budget: "80-450 EUR",
    buyMin: 80,
    buyMax: 450,
    resale: "160-700 EUR",
    marginScore: 8.4,
    seasonScore: 7.6,
    safetyScore: 5.8,
    demand: "Grosse marge possible, mais risque d'authenticite plus eleve.",
    whyNow: "Le meilleur moment est souvent avant que tout le monde recherche une doudoune.",
    searchIdeas: ["Moncler Maya certilogo", "The North Face Nuptse", "Napapijri rainforest", "doudoune plume vintage"],
    checks: ["Certilogo ou etiquette", "Zip", "Taches manches", "Gonflant", "Facture si luxe"],
    avoid: "N'achete jamais une grosse marque luxe sans preuves claires d'authenticite.",
    saleAngle: "Annonce rassurante : preuves, photos details, chaleur, coupe, defauts transparents."
  },
  {
    id: "summer-accessories",
    title: "Sacs banane, lunettes, casquettes marquees",
    category: "Accessoires rapides",
    season: "Tres bon ete/festivals",
    budget: "5-25 EUR",
    buyMin: 5,
    buyMax: 25,
    resale: "15-45 EUR",
    marginScore: 7.3,
    seasonScore: 8.9,
    safetyScore: 8.4,
    demand: "Petits paniers, vente rapide si marque visible et bon etat.",
    whyNow: "Les accessoires utiles se vendent vite avant vacances, festivals et week-ends.",
    searchIdeas: ["banane Nike vintage", "casquette Ralph Lauren", "sac Adidas retro", "lunettes Oakley vintage"],
    checks: ["Fermeture", "Rayures", "Logo", "Taille reglable", "Interieur propre"],
    avoid: "Evite les accessoires trop generiques, sauf lot tres bas prix.",
    saleAngle: "Vends le cote pratique, vacances, festival, tenue complete."
  },
  {
    id: "tech-risk",
    title: "Tech tres sous-cotee, mais uniquement verifiable",
    category: "High risk / high reward",
    season: "Stable, depend du prix",
    budget: "150 EUR+",
    buyMin: 150,
    buyMax: 1200,
    resale: "Variable",
    marginScore: 9.1,
    seasonScore: 6.7,
    safetyScore: 3.9,
    demand: "RTX, iPhone, MacBook peuvent etre enormes, mais les arnaques aussi.",
    whyNow: "Un prix anormalement bas peut etre une vraie opportunite ou un piege. Il faut verifier avant tout.",
    searchIdeas: ["RTX 4070 facture", "MacBook M1 facture", "iPhone debloque facture"],
    checks: ["Facture", "Numero de serie", "Remise main propre", "Test video", "Compte retire"],
    avoid: "N'achete pas si le vendeur vend seulement une facture, une boite, ou refuse les preuves.",
    saleAngle: "Si achat valide, revente basee sur preuves, tests, facture et etat batterie/composants."
  }
];

export function WeeklyOpportunities() {
  const [sort, setSort] = useState<SortKey>("season");
  const [budget, setBudget] = useState<BudgetKey>("all");
  const [isElite, setIsElite] = useState(false);
  const [planLoaded, setPlanLoaded] = useState(false);
  const [liveItems, setLiveItems] = useState<LiveOpportunity[]>([]);
  const [seenLinks, setSeenLinks] = useState<string[]>([]);
  const [liveMessage, setLiveMessage] = useState("");
  const [liveLoading, setLiveLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("elite") === "1") {
      const stored = localStorage.getItem("resellscore_demo_user");
      const user = stored ? JSON.parse(stored) as DemoUser : {};
      localStorage.setItem("resellscore_demo_user", JSON.stringify({
        ...user,
        email: "demo@resellscore.app",
        nickname: "Noah",
        plan: "elite"
      }));
      window.dispatchEvent(new Event("resellscore-user-updated"));
      window.history.replaceState(null, "", window.location.pathname);
    }

    function loadPlan() {
      const stored = localStorage.getItem("resellscore_demo_user");
      if (!stored) {
        setIsElite(false);
      } else {
        const user = JSON.parse(stored) as DemoUser;
        setIsElite(user.plan === "elite");
      }
      setPlanLoaded(true);

      fetch("/api/me/plan", { cache: "no-store" })
        .then((response) => response.ok ? response.json() : null)
        .then((data: { plan?: string } | null) => {
          if (data?.plan) setIsElite(normalizePlan(data.plan) === "elite");
        })
        .catch(() => {});
    }

    loadPlan();
    window.addEventListener("resellscore-user-updated", loadPlan);
    window.addEventListener("storage", loadPlan);
    return () => {
      window.removeEventListener("resellscore-user-updated", loadPlan);
      window.removeEventListener("storage", loadPlan);
    };
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("resellscore_seen_opportunities");
    if (stored) setSeenLinks(JSON.parse(stored) as string[]);
  }, []);

  useEffect(() => {
    if (!isElite) return;

    let cancelled = false;
    setLiveLoading(true);
    fetch("/api/opportunities/live", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then((data: { items?: LiveOpportunity[]; message?: string } | null) => {
        if (cancelled) return;
        setLiveItems(data?.items || []);
        setLiveMessage(data?.message || "Scanner indisponible pour le moment.");
      })
      .catch(() => {
        if (!cancelled) {
          setLiveItems([]);
          setLiveMessage("Scanner live bloque pour le moment. Les tendances restent disponibles.");
        }
      })
      .finally(() => {
        if (!cancelled) setLiveLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isElite]);

  const sorted = useMemo(() => {
    const selectedBudget = budgetFilters.find((item) => item.key === budget) || budgetFilters[0];
    return trends
      .filter((item) => item.buyMax >= selectedBudget.min && item.buyMin <= selectedBudget.max)
      .sort((a, b) => {
        if (sort === "margin") return b.marginScore - a.marginScore;
        if (sort === "safe") return b.safetyScore - a.safetyScore;
        return b.seasonScore - a.seasonScore;
      });
  }, [budget, sort]);

  function markSeen(link: string) {
    setSeenLinks((current) => {
      if (current.includes(link)) return current;
      const next = [link, ...current].slice(0, 100);
      localStorage.setItem("resellscore_seen_opportunities", JSON.stringify(next));
      return next;
    });
  }

  if (!planLoaded) {
    return (
      <section className="mt-8 rounded-lg border border-white/10 bg-panel p-6 text-sm font-semibold text-muted shadow-glow">
        Verification de ton acces Elite...
      </section>
    );
  }

  if (!isElite) {
    return (
      <section className="mt-8">
        <Link
          href="/pricing"
          className="grid min-h-[360px] place-items-center rounded-lg border border-accent/20 bg-panel p-8 text-center shadow-glow transition hover:border-accent/60"
        >
          <div className="max-w-lg">
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-full border border-accent/25 bg-accent/10 text-accent">
              <Lock size={34} />
            </div>
            <h2 className="mt-6 text-3xl font-bold">Tendances reservees Elite</h2>
            <p className="mt-3 text-muted">
              Les tendances premium cachent les niches, saisons, budgets, risques et angles de revente. Passe en Elite pour les voir.
            </p>
            <span className="mt-6 inline-flex rounded-md bg-accent px-5 py-3 text-sm font-bold text-ink">
              Voir les tarifs
            </span>
          </div>
        </Link>
      </section>
    );
  }

  return (
    <section className="mt-8">
      <div className="rounded-lg border border-white/10 bg-panel p-5 shadow-glow">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-5">
          <div>
            <p className="flex items-center gap-2 text-sm font-bold text-white">
              <ArrowUp size={16} className="text-accent" />
              Radar revente
            </p>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              Des pistes concretes a chercher sur Vinted : budget max, prix de revente vise, signaux a verifier et angle d'annonce. Pas de fausses annonces inventees.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-xs font-bold text-accent">
            <Crown size={13} />
            Elite
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {sortFilters.map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => setSort(filter.key)}
              className={cn(
                "inline-flex h-10 items-center gap-2 rounded-md border px-4 text-sm font-semibold transition",
                sort === filter.key ? "border-accent bg-accent text-ink" : "border-white/15 bg-white/5 text-white hover:bg-white/10"
              )}
            >
              <Search size={15} />
              {filter.label}
            </button>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {budgetFilters.map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => setBudget(filter.key)}
              className={cn(
                "h-9 rounded-md border px-3 text-xs font-bold transition",
                budget === filter.key ? "border-white bg-white text-ink" : "border-white/15 bg-white/5 text-slate-200 hover:bg-white/10"
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <section className="mt-6 rounded-lg border border-accent/20 bg-panel p-5 shadow-glow">
        <div className="flex flex-col gap-3 border-b border-white/10 pb-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm font-bold text-accent">
              {liveLoading ? <Loader2 size={16} className="animate-spin" /> : <ExternalLink size={16} />}
              Annonces directes premium
            </p>
            <p className="mt-2 text-sm leading-6 text-muted">
              Le live garde seulement les annonces ou le prix Vinted est lu, sous le budget, avec une marge assez forte. Si le prix est bloque, l'annonce ne s'affiche pas.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setLiveLoading(true);
              fetch("/api/opportunities/live", { cache: "no-store" })
                .then((response) => response.ok ? response.json() : null)
                .then((data: { items?: LiveOpportunity[]; message?: string } | null) => {
                  setLiveItems(data?.items || []);
                  setLiveMessage(data?.message || "Scanner indisponible pour le moment.");
                })
                .catch(() => setLiveMessage("Scanner live bloque pour le moment."))
                .finally(() => setLiveLoading(false));
            }}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-white/15 bg-white/5 px-4 text-sm font-bold text-white hover:bg-white/10"
          >
            <Search size={15} />
            Rafraichir
          </button>
        </div>

        {liveItems.length > 0 ? (
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {liveItems.slice(0, 6).map((item) => {
              const seen = seenLinks.includes(item.link);
              return (
                <a
                  key={item.id}
                  href={item.link}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => markSeen(item.link)}
                  className={cn(
                    "relative rounded-lg border bg-white/[0.03] p-4 transition hover:border-accent/60 hover:bg-white/[0.05]",
                    seen ? "border-accent/35" : "border-white/10"
                  )}
                >
                  {seen ? (
                    <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent/15 px-2 py-1 text-[11px] font-black uppercase text-accent">
                      <CheckCircle2 size={12} />
                      Vu
                    </span>
                  ) : null}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase text-accent">{item.category}</p>
                      <h3 className={cn("mt-1 line-clamp-2 font-bold text-white", seen ? "pr-14" : "")}>{item.title}</h3>
                    </div>
                    <span className="shrink-0 rounded-full bg-accent px-3 py-1 text-xs font-black text-ink">{item.score}/10</span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
                    <Mini label="Prix annonce" value={`${item.listingPrice || item.buy} EUR`} highlight />
                    <Mini label="Prix neuf estime" value={`${item.retail} EUR`} />
                    <Mini label="Revente visee" value={`${item.resale} EUR`} />
                    <Mini label="Marge brute" value={`+${item.margin} EUR`} highlight />
                    <Mini label="Marge" value={`${Math.round(item.marginRate * 100)}%`} />
                    <Mini label="Demande" value={`${item.demand}%`} />
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-300">{item.signal} - {item.reason}</p>
                  <p className="mt-2 text-xs leading-5 text-amber-100">Risque : {item.risk}</p>
                  <p className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-accent">
                    Ouvrir l'annonce Vinted
                    <ExternalLink size={13} />
                  </p>
                </a>
              );
            })}
          </div>
        ) : (
          <div className="mt-4 rounded-md border border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-muted">
            {liveLoading ? "Recherche des annonces Vinted avec prix reel en cours..." : liveMessage || "Aucune annonce directe fiable detectee pour le moment."}
          </div>
        )}
      </section>

      <div className="mt-6 grid gap-4">
        {sorted.map((item) => (
          <article key={item.id} className="rounded-lg border border-white/10 bg-panel p-5 shadow-glow">
            <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-xs font-black uppercase text-accent">{item.category}</span>
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-bold text-slate-200">{item.season}</span>
                </div>
                <h2 className="mt-3 text-2xl font-bold leading-tight">{item.title}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">{item.whyNow}</p>
                <p className="mt-2 text-sm leading-6 text-muted">{item.demand}</p>
              </div>

              <div className="grid gap-2 text-sm">
                <Row label="Payer max" value={`${item.buyMax} EUR`} strong />
                <Row label="Zone achat" value={item.budget} />
                <Row label="Revente visee" value={item.resale} strong />
              </div>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-3">
              <div className="rounded-md border border-white/10 bg-white/[0.03] p-4">
                <p className="flex items-center gap-2 text-sm font-bold text-white"><Search size={16} className="text-accent" />Recherches</p>
                <div className="mt-3 grid gap-2">
                  {item.searchIdeas.slice(0, 3).map((idea) => (
                    <a key={idea} href={vintedSearchUrl(idea, item.buyMax)} target="_blank" rel="noreferrer" className="rounded-md border border-white/10 bg-black/10 px-3 py-2 text-xs font-semibold text-accent hover:border-accent/50">
                      {idea}
                    </a>
                  ))}
                </div>
              </div>

              <div className="rounded-md border border-white/10 bg-white/[0.03] p-4">
                <p className="flex items-center gap-2 text-sm font-bold text-white"><ShieldCheck size={16} className="text-accent" />Check rapide</p>
                <ul className="mt-3 grid gap-1 text-sm leading-6 text-muted">
                  {item.checks.slice(0, 4).map((check) => <li key={check}>- {check}</li>)}
                </ul>
              </div>

              <div className="rounded-md border border-accent/20 bg-accent/[0.06] p-4">
                <p className="flex items-center gap-2 text-sm font-bold text-accent"><Sparkles size={16} />Annonce gagnante</p>
                <p className="mt-3 text-sm leading-6 text-slate-200">{item.saleAngle}</p>
              </div>
            </div>

            <p className="mt-4 rounded-md border border-amber-300/15 bg-amber-400/10 p-3 text-sm leading-6 text-amber-100">
              A eviter : {item.avoid}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function vintedSearchUrl(query: string, maxPrice: number) {
  const params = new URLSearchParams({
    search_text: query,
    price_to: String(maxPrice),
    order: "newest_first"
  });
  return `https://www.vinted.fr/catalog?${params.toString()}`;
}

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-4 rounded-md bg-white/[0.04] p-3">
      <span className="text-muted">{label}</span>
      <strong className={cn("text-right", strong ? "text-accent" : "text-white")}>{value}</strong>
    </div>
  );
}

function Mini({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={cn("rounded-md border p-2", highlight ? "border-accent/35 bg-accent/10" : "border-white/10 bg-black/10")}>
      <p className="text-[10px] uppercase tracking-wide text-muted">{label}</p>
      <p className={cn("mt-1 font-black", highlight ? "text-accent" : "text-white")}>{value}</p>
    </div>
  );
}
