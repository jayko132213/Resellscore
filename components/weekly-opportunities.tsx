"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowUp, Bell, Bot, CheckCircle2, Crown, ExternalLink, Filter, Loader2, Lock, Search, ShieldCheck, Sparkles, X } from "lucide-react";
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
  safeResale: number;
  maxSafeBuy: number;
  safetyReserve: number;
  x2Rule: boolean;
  margin: number;
  marginRate: number;
  demand: number;
  likes: number | null;
  likeVelocity: string;
  popularity: number;
  link: string;
  imageUrl: string;
  signal: string;
  reason: string;
  risk: string;
  condition: string;
  sellerSignal: string;
  spottedAt: string;
  postedLabel: string;
  quickDescription: string;
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

type NichePreset = {
  id: string;
  label: string;
  description: string;
  searches: { id: string; label: string }[];
};

type SavedFilter = {
  id: string;
  name: string;
  categories: string[];
  brands: string[];
  sizes: string[];
  colors: string[];
  conditions: string[];
  zone: string[];
  materials: string[];
  keywords: string;
  priceMin: string;
  priceMax: string;
  hideReposts: boolean;
  notifications: boolean;
  autocop: boolean;
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

const filterOptions = {
  categories: ["Sweats et pulls", "Sweats a capuche", "T-shirts", "Chemises", "Jupes", "Robes", "Vestes", "Sneakers", "Maillots", "Accessoires"],
  brands: ["Nike", "Ralph Lauren", "Polo Ralph Lauren", "Adidas", "Carhartt", "Levi's", "Patagonia", "The North Face", "Stone Island", "Arc'teryx"],
  sizes: ["XS", "S", "M", "L", "XL", "XXL", "36", "38", "40", "42", "W30", "W32", "W34"],
  colors: ["Noir", "Blanc", "Gris", "Bleu", "Marine", "Vert", "Rouge", "Rose", "Creme", "Beige"],
  conditions: ["Neuf avec etiquette", "Neuf sans etiquette", "Tres bon etat", "Bon etat"],
  zone: ["Europe occidentale", "France", "Belgique", "Italie", "Espagne", "Allemagne"],
  materials: ["Coton", "Laine", "Cuir", "Denim", "Nylon", "Polyester", "Soie", "Cachemire"]
};

const defaultFilter: SavedFilter = {
  id: "default",
  name: "Vetement oversize Nike",
  categories: ["Sweats et pulls", "Sweats a capuche"],
  brands: ["Nike"],
  sizes: ["S", "M", "L", "XL"],
  colors: [],
  conditions: ["Tres bon etat", "Bon etat"],
  zone: ["Europe occidentale"],
  materials: [],
  keywords: "oversize logo brode vintage",
  priceMin: "",
  priceMax: "35",
  hideReposts: true,
  notifications: false,
  autocop: false
};

const nichePresets: NichePreset[] = [
  { id: "niche", label: "Niches x3-x10", description: "Bouton special: recherches rares, fortes marges et demande niche.", searches: [
    { id: "topshop-kate-moss", label: "Topshop Kate Moss" },
    { id: "sweater-shop", label: "The Sweater Shop" },
    { id: "patagonia-retro", label: "Patagonia retro" },
    { id: "tommy-crest", label: "Tommy crest" },
    { id: "levis-big-e", label: "Levi's Big E" },
    { id: "oakley-y2k", label: "Oakley Y2K" },
    { id: "diesel-y2k", label: "Diesel Y2K" },
    { id: "miss-sixty", label: "Miss Sixty" },
    { id: "football-bucket", label: "Bucket foot" },
    { id: "balletcore-shoes", label: "Balletcore shoes" },
    { id: "animal-print-sneakers", label: "Sneakers animal print" },
    { id: "metallic-sneakers", label: "Sneakers metalliques" }
  ] },
  { id: "nike", label: "Nike", description: "Running, sport, ACG, pulls, shorts propres.", searches: [{ id: "nike-running", label: "Nike running" }, { id: "nike-sport", label: "Nike sport" }, { id: "nike-acg", label: "Nike ACG" }, { id: "nike-pull", label: "Nike pull" }, { id: "Nike short vert", label: "Nike shorts" }, { id: "nike-track", label: "Nike track jacket" }] },
  { id: "ralph", label: "Ralph Lauren", description: "Pull torsade, chemises Oxford, casquettes, old money.", searches: [{ id: "ralph-knit", label: "Pull torsade" }, { id: "ralph-oxford", label: "Oxford" }, { id: "ralph-cap", label: "Casquettes" }, { id: "ralph-rugby", label: "Rugby shirt" }, { id: "ralph-linen", label: "Lin ete" }] },
  { id: "adidas", label: "Adidas", description: "Samba, shorts, survetements retro, football.", searches: [{ id: "adidas-samba", label: "Samba" }, { id: "Adidas short vintage", label: "Shorts" }, { id: "adidas-track", label: "Survetements" }, { id: "adidas-tokyo", label: "Tokyo/Paris" }, { id: "adidas-football", label: "Football retro" }] },
  { id: "maillots", label: "Maillots / Blokecore", description: "PSG, Manchester, clubs populaires, foot fashion.", searches: [{ id: "maillot retro Nike", label: "Nike retro" }, { id: "football-psg", label: "PSG" }, { id: "football-manchester", label: "Manchester" }, { id: "football-inter", label: "Inter Milan" }, { id: "football-france", label: "France retro" }, { id: "football-training", label: "Training tops" }] },
  { id: "outdoor", label: "Outdoor / Gorpcore", description: "Arc'teryx, Patagonia, TNF, Salomon, Columbia.", searches: [{ id: "outdoor-arcteryx", label: "Arc'teryx" }, { id: "Patagonia Synchilla", label: "Patagonia" }, { id: "outdoor-tnf", label: "TNF" }, { id: "outdoor-salomon", label: "Salomon" }, { id: "outdoor-columbia", label: "Columbia Titanium" }, { id: "outdoor-fjallraven", label: "Fjallraven" }] },
  { id: "workwear", label: "Workwear", description: "Carhartt, Dickies, vestes solides, coupes demandees.", searches: [{ id: "workwear-carhartt", label: "Carhartt Detroit" }, { id: "workwear-dickies", label: "Dickies" }, { id: "workwear-chore", label: "Chore jacket" }] },
  { id: "denim", label: "Denim", description: "Levi's 501, trucker, jorts, mesures propres.", searches: [{ id: "denim-levis", label: "Levi's 501" }, { id: "denim-trucker", label: "Trucker jacket" }, { id: "denim-jorts", label: "Jorts" }] },
  { id: "designer", label: "Designer", description: "Stone Island, CP Company, pieces premium verifiables.", searches: [{ id: "designer-stone", label: "Stone Island" }, { id: "designer-cp", label: "CP Company" }, { id: "designer-fred-perry", label: "Fred Perry Oxford" }] },
  { id: "sneakers", label: "Sneakers 2026", description: "Speedcat, slim, metallic, running chunky, ballet sneakers.", searches: [{ id: "puma-speedcat", label: "Puma Speedcat" }, { id: "puma-h-street", label: "Puma H-Street" }, { id: "fila-vintage", label: "Fila vintage" }, { id: "slim-sneakers", label: "Slim sneakers" }] },
  { id: "accessoires", label: "Accessoires rapides", description: "Sacs banane, casquettes, lunettes, petits paniers rapides.", searches: [{ id: "bum-bag-vintage", label: "Sac banane vintage" }, { id: "cap-vintage-logo", label: "Casquette logo" }, { id: "sunglasses-y2k", label: "Lunettes Y2K" }] },
  { id: "tech", label: "Tech", description: "Seulement si preuves, facture et risque compris.", searches: [{ id: "tech-iphone", label: "iPhone" }] },
  { id: "ete", label: "Saison ete", description: "Jupes, robes, chemisiers, pieces propres et lumineuses.", searches: [{ id: "summer-skirt-premium", label: "Jupes" }, { id: "summer-dress-premium", label: "Robes" }, { id: "summer-blouse", label: "Chemisiers" }] },
  { id: "hiver", label: "Saison hiver", description: "Mailles, laine, doudounes, achats avant la demande.", searches: [{ id: "winter-knit", label: "Mailles" }, { id: "winter-puffer", label: "Doudounes" }] }
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
  const [selectedNiches, setSelectedNiches] = useState<string[]>(["niche", "nike", "ralph", "maillots"]);
  const [selectedSearches, setSelectedSearches] = useState<string[]>([]);
  const [nicheSearch, setNicheSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [draftFilter, setDraftFilter] = useState<SavedFilter>(defaultFilter);
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
    const storedFilters = localStorage.getItem("resellscore_trend_filters");
    setSavedFilters(storedFilters ? JSON.parse(storedFilters) as SavedFilter[] : [defaultFilter]);
  }, []);

  useEffect(() => {
    if (!isElite) return;

    let cancelled = false;
    setLiveLoading(true);
    fetch(liveApiUrl(selectedNiches, selectedSearches), { cache: "no-store" })
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

  const activeSearches = useMemo(() => {
    return nichePresets
      .filter((niche) => selectedNiches.includes(niche.id))
      .flatMap((niche) => niche.searches.map((search) => ({ ...search, nicheId: niche.id, nicheLabel: niche.label })));
  }, [selectedNiches]);

  const allNicheSearches = useMemo(() => {
    return nichePresets.flatMap((niche) => niche.searches.map((search) => ({ ...search, nicheId: niche.id, nicheLabel: niche.label })));
  }, []);

  const suggestedSearches = useMemo(() => {
    const query = nicheSearch.trim().toLowerCase();
    const base = query
      ? allNicheSearches.filter((search) => `${search.label} ${search.id} ${search.nicheLabel}`.toLowerCase().includes(query))
      : activeSearches;
    return base.slice(0, query ? 36 : 48);
  }, [activeSearches, allNicheSearches, nicheSearch]);

  function markSeen(link: string) {
    setSeenLinks((current) => {
      if (current.includes(link)) return current;
      const next = [link, ...current].slice(0, 100);
      localStorage.setItem("resellscore_seen_opportunities", JSON.stringify(next));
      return next;
    });
  }

  function toggleNiche(id: string) {
    setSelectedNiches((current) => {
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
      return next.length > 0 ? next : [id];
    });
    setSelectedSearches([]);
  }

  function toggleSearch(id: string, nicheId?: string) {
    if (nicheId) {
      setSelectedNiches((current) => current.includes(nicheId) ? current : [...current, nicheId]);
    }
    setSelectedSearches((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function refreshLive() {
    setLiveLoading(true);
    fetch(liveApiUrl(selectedNiches, selectedSearches), { cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then((data: { items?: LiveOpportunity[]; message?: string } | null) => {
        setLiveItems(data?.items || []);
        setLiveMessage(data?.message || "Scanner indisponible pour le moment.");
      })
      .catch(() => setLiveMessage("Scanner live bloque pour le moment."))
      .finally(() => setLiveLoading(false));
  }

  function toggleDraftValue(field: keyof Pick<SavedFilter, "categories" | "brands" | "sizes" | "colors" | "conditions" | "zone" | "materials">, value: string) {
    setDraftFilter((current) => {
      const list = current[field];
      return {
        ...current,
        [field]: list.includes(value) ? list.filter((item) => item !== value) : [...list, value]
      };
    });
  }

  function saveFilter() {
    const nextFilter = { ...draftFilter, id: draftFilter.id === "default" ? `filter-${Date.now()}` : draftFilter.id };
    const next = [nextFilter, ...savedFilters.filter((item) => item.id !== nextFilter.id)].slice(0, 8);
    setSavedFilters(next);
    localStorage.setItem("resellscore_trend_filters", JSON.stringify(next));
    setFiltersOpen(false);
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

      <section className="mt-6 rounded-lg border border-white/10 bg-panel p-5 shadow-glow">
        <div className="flex flex-col gap-3 border-b border-white/10 pb-5 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm font-black text-accent">
              <Bot size={17} />
              Bot Vinted par niche
            </p>
            <h2 className="mt-2 text-2xl font-bold">Choisis ce que le radar doit chercher</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              Le scanner lance plusieurs recherches comme un compte Vinted non connecte: marque, sous-style, budget, marge et potentiel de revente.
            </p>
          </div>
          <button
            type="button"
            onClick={refreshLive}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-accent px-4 text-sm font-black text-ink transition hover:bg-accent/90"
          >
            {liveLoading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            Scanner
          </button>
        </div>

        <div className="mt-5 flex flex-col gap-3 rounded-lg border border-white/10 bg-black/20 p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase text-muted">Filtres sauvegardes</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {savedFilters.map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setDraftFilter(filter)}
                  className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-white hover:border-accent/40"
                >
                  <Filter size={13} className="text-accent" />
                  {filter.name}
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setDraftFilter({ ...defaultFilter, id: `filter-${Date.now()}` });
              setFiltersOpen(true);
            }}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-accent/35 bg-accent/10 px-4 text-sm font-black text-accent hover:bg-accent/15"
          >
            <Filter size={15} />
            Creer un filtre
          </button>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {nichePresets.map((niche) => {
            const active = selectedNiches.includes(niche.id);
            return (
              <button
                key={niche.id}
                type="button"
                onClick={() => toggleNiche(niche.id)}
                className={cn(
                  "rounded-lg border p-4 text-left transition",
                  active ? "border-accent/60 bg-accent/10" : "border-white/10 bg-white/[0.03] hover:border-white/25"
                )}
              >
                <span className={cn("text-sm font-black", active ? "text-accent" : "text-white")}>{niche.label}</span>
                <span className="mt-2 block text-xs leading-5 text-muted">{niche.description}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-5">
          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <label className="grid gap-2 text-sm font-bold text-white">
              Recherche de niche
              <input
                value={nicheSearch}
                onChange={(event) => setNicheSearch(event.target.value)}
                className="h-11 rounded-md border border-white/10 bg-white/[0.06] px-3 text-sm font-semibold outline-none transition focus:border-accent"
                placeholder="Tape Nike, Ralph, gorpcore, maillot, Y2K..."
              />
            </label>
            <button
              type="button"
              onClick={() => {
                setSelectedNiches(["niche"]);
                setSelectedSearches([]);
                setNicheSearch("");
              }}
              className="h-11 rounded-md border border-accent/35 bg-accent/10 px-4 text-sm font-black text-accent hover:bg-accent/15"
            >
              Mode niche
            </button>
          </div>

          <p className="mt-4 text-xs font-black uppercase text-muted">
            {nicheSearch.trim() ? "Suggestions trouvees" : "Sous-recherches actives"}
          </p>
          <div className="mt-2 flex max-h-44 flex-wrap gap-2 overflow-y-auto pr-1">
            {suggestedSearches.map((search) => {
              const active = selectedSearches.length === 0 ? selectedNiches.includes(search.nicheId) : selectedSearches.includes(search.id);
              return (
                <button
                  key={search.id}
                  type="button"
                  onClick={() => toggleSearch(search.id, search.nicheId)}
                  className={cn(
                    "h-9 rounded-md border px-3 text-xs font-bold transition",
                    active ? "border-accent/40 bg-accent/10 text-accent" : "border-white/10 bg-white/[0.03] text-muted"
                  )}
                >
                  {search.label}
                  <span className="ml-1 text-[10px] opacity-70">{search.nicheLabel}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-muted">
            Si aucun sous-filtre n'est choisi, le bot scanne toutes les sous-recherches des niches cochees. Le bouton Niche ajoute les recherches a plus forte marge.
          </p>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <MethodCard title="Prix max safe" text="Le radar prend la revente estimee, retire environ 15% de securite, puis divise par deux." />
          <MethodCard title="Demande" text="Il garde les annonces avec signaux de likes quand ils sont lisibles, ou niches deja fortes." />
          <MethodCard title="Lot vendeur" text="Si une piece est trop chere, regarde le dressing du vendeur pour negocier un lot." />
        </div>
      </section>

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
            onClick={refreshLive}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-white/15 bg-white/5 px-4 text-sm font-bold text-white hover:bg-white/10"
          >
            <Search size={15} />
            Rafraichir
          </button>
        </div>

        {liveItems.length > 0 ? (
          <div className="mt-4 grid gap-3">
            {liveItems.slice(0, 6).map((item) => {
              const seen = seenLinks.includes(item.link);
              return (
                <article
                  key={item.id}
                  className={cn(
                    "relative grid overflow-hidden rounded-lg border bg-white/[0.03] transition hover:border-accent/60 hover:bg-white/[0.05] sm:grid-cols-[180px_1fr]",
                    seen ? "border-accent/35" : "border-white/10"
                  )}
                >
                  <div className="aspect-square bg-black/30 sm:aspect-auto">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="grid h-full place-items-center bg-gradient-to-br from-accent/15 to-white/5 p-4 text-center text-xs font-black uppercase text-accent">
                        {item.category}
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-xs font-black uppercase text-accent">{item.category}</p>
                        <span className="text-xs font-bold text-muted">Score {item.score}/10</span>
                        {seen ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent/15 px-2 py-0.5 text-[10px] font-black uppercase text-accent">
                            <CheckCircle2 size={11} />
                            Vu
                          </span>
                        ) : null}
                      </div>
                      <span className={cn("rounded-full px-2.5 py-1 text-[10px] font-black uppercase", item.x2Rule ? "bg-accent text-ink" : "bg-amber-400/15 text-amber-100")}>
                        {item.x2Rule ? "x2 ok" : "limite"}
                      </span>
                    </div>
                    <h3 className="mt-2 line-clamp-2 text-lg font-black text-white">{item.title}</h3>
                    <p className="mt-1 text-xs font-semibold text-muted">Etat: {item.condition} - {item.postedLabel || item.spottedAt}</p>

                    <div className="mt-3 flex flex-wrap items-end gap-3">
                      <div>
                        <p className="text-[10px] uppercase text-muted">Prix annonce</p>
                        <p className="text-2xl font-black text-white">{item.listingPrice || item.buy} EUR</p>
                      </div>
                      <div className="text-xs font-bold text-muted">
                        Revente prudente <span className="text-accent">{item.safeResale} EUR</span> - Achat max <span className="text-accent">{item.maxSafeBuy} EUR</span>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                      <Mini label="Marge" value={`+${item.margin} EUR`} highlight />
                      <Mini label="Likes" value={item.likes === null ? "non lus" : String(item.likes)} />
                      <Mini label="Demande" value={`${item.demand}%`} />
                      <Mini label="Reserve" value={`${item.safetyReserve} EUR`} />
                    </div>

                    <p className="mt-3 rounded-md border border-white/10 bg-black/20 px-3 py-2 text-xs leading-5 text-slate-200">
                      {item.quickDescription || item.reason}
                    </p>
                    <p className="mt-3 text-xs leading-5 text-slate-300">{item.signal} - {item.likeVelocity}</p>
                    <p className="mt-1 text-xs leading-5 text-amber-100">{item.risk}</p>

                    <div className="mt-4 flex gap-2">
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => markSeen(item.link)}
                        className="inline-flex h-10 flex-1 items-center justify-center rounded-md bg-white/10 px-4 text-sm font-black text-white hover:bg-white/15"
                      >
                        Details
                      </a>
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => markSeen(item.link)}
                        className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-md bg-accent px-4 text-sm font-black text-ink hover:bg-accent/90"
                      >
                        <ExternalLink size={15} />
                        Acheter
                      </a>
                    </div>
                  </div>
                </article>
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

      {filtersOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-lg border border-white/10 bg-[#111] p-5 shadow-2xl">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-black">Creer un filtre</h2>
              <button type="button" onClick={() => setFiltersOpen(false)} className="grid h-9 w-9 place-items-center rounded-md bg-white/10 text-white">
                <X size={18} />
              </button>
            </div>

            <div className="mt-5 grid gap-4">
              <label className="grid gap-2 text-sm font-bold">
                Nom du filtre
                <input
                  value={draftFilter.name}
                  onChange={(event) => setDraftFilter((current) => ({ ...current, name: event.target.value }))}
                  className="h-11 rounded-md border border-white/10 bg-white/[0.06] px-3 text-sm font-semibold outline-none focus:border-accent"
                  placeholder="Vetement oversize Nike"
                />
              </label>

              <FilterGroup title="Categories" values={filterOptions.categories} selected={draftFilter.categories} onToggle={(value) => toggleDraftValue("categories", value)} />
              <FilterGroup title="Marques" values={filterOptions.brands} selected={draftFilter.brands} onToggle={(value) => toggleDraftValue("brands", value)} />
              <FilterGroup title="Tailles" values={filterOptions.sizes} selected={draftFilter.sizes} onToggle={(value) => toggleDraftValue("sizes", value)} />
              <FilterGroup title="Couleurs" values={filterOptions.colors} selected={draftFilter.colors} onToggle={(value) => toggleDraftValue("colors", value)} />
              <FilterGroup title="Etats" values={filterOptions.conditions} selected={draftFilter.conditions} onToggle={(value) => toggleDraftValue("conditions", value)} />
              <FilterGroup title="Zone geographique" values={filterOptions.zone} selected={draftFilter.zone} onToggle={(value) => toggleDraftValue("zone", value)} />
              <FilterGroup title="Matieres" values={filterOptions.materials} selected={draftFilter.materials} onToggle={(value) => toggleDraftValue("materials", value)} />

              <label className="grid gap-2 text-sm font-bold">
                Mots cles
                <input
                  value={draftFilter.keywords}
                  onChange={(event) => setDraftFilter((current) => ({ ...current, keywords: event.target.value }))}
                  className="h-11 rounded-md border border-white/10 bg-white/[0.06] px-3 text-sm font-semibold outline-none focus:border-accent"
                  placeholder="logo brode, oversize, vintage..."
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-bold">
                  Prix minimum
                  <input
                    value={draftFilter.priceMin}
                    onChange={(event) => setDraftFilter((current) => ({ ...current, priceMin: event.target.value.replace(/[^\d]/g, "") }))}
                    className="h-11 rounded-md border border-white/10 bg-white/[0.06] px-3 text-sm font-semibold outline-none focus:border-accent"
                    placeholder="Minimum"
                  />
                </label>
                <label className="grid gap-2 text-sm font-bold">
                  Prix maximum
                  <input
                    value={draftFilter.priceMax}
                    onChange={(event) => setDraftFilter((current) => ({ ...current, priceMax: event.target.value.replace(/[^\d]/g, "") }))}
                    className="h-11 rounded-md border border-white/10 bg-white/[0.06] px-3 text-sm font-semibold outline-none focus:border-accent"
                    placeholder="Maximum"
                  />
                </label>
              </div>

              <ToggleLine label="Masquer les repost" checked={draftFilter.hideReposts} onChange={() => setDraftFilter((current) => ({ ...current, hideReposts: !current.hideReposts }))} />
              <ToggleLine label="Reception des notifications" checked={draftFilter.notifications} onChange={() => setDraftFilter((current) => ({ ...current, notifications: !current.notifications }))} />
              <ToggleLine label="Autocop cet article" checked={draftFilter.autocop} onChange={() => setDraftFilter((current) => ({ ...current, autocop: !current.autocop }))} />
            </div>

            <div className="mt-6 flex gap-3">
              <button type="button" onClick={saveFilter} className="h-11 rounded-md bg-accent px-6 text-sm font-black text-ink">
                Ajouter
              </button>
              <button type="button" onClick={() => setFiltersOpen(false)} className="h-11 rounded-md px-4 text-sm font-black text-white">
                Annuler
              </button>
            </div>
          </div>
        </div>
      ) : null}
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

function liveApiUrl(niches: string[], searches: string[]) {
  const params = new URLSearchParams();
  if (searches.length > 0) params.set("searches", searches.join(","));
  if (searches.length === 0 && niches.length > 0) params.set("niches", niches.join(","));
  const query = params.toString();
  return query ? `/api/opportunities/live?${query}` : "/api/opportunities/live";
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

function MethodCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.03] p-3">
      <p className="text-xs font-black uppercase text-accent">{title}</p>
      <p className="mt-2 text-xs leading-5 text-muted">{text}</p>
    </div>
  );
}

function FilterGroup({ title, values, selected, onToggle }: { title: string; values: string[]; selected: string[]; onToggle: (value: string) => void }) {
  return (
    <div>
      <p className="text-sm font-bold">{title}</p>
      <div className="mt-2 flex flex-wrap gap-2 rounded-md border border-white/10 bg-white/[0.04] p-2">
        {values.map((value) => {
          const active = selected.includes(value);
          return (
            <button
              key={value}
              type="button"
              onClick={() => onToggle(value)}
              className={cn(
                "rounded-md border px-2.5 py-1.5 text-xs font-bold transition",
                active ? "border-accent/50 bg-accent/15 text-accent" : "border-white/10 bg-black/10 text-muted"
              )}
            >
              {active ? "✓ " : ""}{value}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ToggleLine({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <button type="button" onClick={onChange} className="flex items-center justify-between rounded-md px-1 py-1 text-left text-sm font-semibold text-muted">
      <span>{label}</span>
      <span className={cn("relative h-6 w-11 rounded-full transition", checked ? "bg-accent" : "bg-white/20")}>
        <span className={cn("absolute top-1 h-4 w-4 rounded-full bg-white transition", checked ? "left-6" : "left-1")} />
      </span>
    </button>
  );
}
