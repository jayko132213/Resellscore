import { NextResponse } from "next/server";

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
  signal: string;
  reason: string;
  risk: string;
  condition: string;
  sellerSignal: string;
  spottedAt: string;
};

type Scan = {
  id?: string;
  niche?: string;
  subcategory?: string;
  q: string;
  min?: number;
  max: number;
  category: string;
  retail: number;
  resale: number;
  demand: number;
  minMargin: number;
  minRate: number;
  risk: string;
  season?: string;
};

const scans: Scan[] = [
  { q: "Nike short vert", max: 25, category: "Ete", retail: 45, resale: 42, demand: 84, minMargin: 12, minRate: 0.45, risk: "Verifier etiquette et etat de l'elastique" },
  { q: "Adidas short vintage", max: 22, category: "Ete", retail: 40, resale: 38, demand: 80, minMargin: 10, minRate: 0.45, risk: "Verifier taches et cordon" },
  { q: "Ralph Lauren pull torsade", max: 32, category: "Vintage", retail: 149, resale: 62, demand: 82, minMargin: 20, minRate: 0.55, risk: "Verifier col, maille et etiquette" },
  { q: "Ralph Lauren chemise oxford", max: 25, category: "Classique", retail: 119, resale: 48, demand: 78, minMargin: 15, minRate: 0.5, risk: "Verifier col et poignets" },
  { q: "Carhartt Detroit jacket", max: 70, category: "Workwear", retail: 189, resale: 125, demand: 92, minMargin: 35, minRate: 0.55, risk: "Verifier zip, doublure et manches" },
  { q: "Levis 501 USA", max: 35, category: "Denim", retail: 110, resale: 68, demand: 89, minMargin: 20, minRate: 0.55, risk: "Verifier mesures et ourlet" },
  { q: "Adidas Samba cuir", max: 45, category: "Sneakers", retail: 120, resale: 75, demand: 91, minMargin: 18, minRate: 0.42, risk: "Verifier semelle et talon interieur" },
  { q: "Arc'teryx shell ancien logo", max: 110, category: "Outdoor", retail: 400, resale: 210, demand: 96, minMargin: 65, minRate: 0.65, risk: "Verifier membrane et coutures" },
  { q: "Stone Island maille badge", max: 115, category: "Designer", retail: 280, resale: 180, demand: 88, minMargin: 45, minRate: 0.45, risk: "Verifier certilogo et badge" },
  { q: "Patagonia Synchilla", max: 80, category: "Outdoor", retail: 150, resale: 135, demand: 86, minMargin: 35, minRate: 0.5, risk: "Verifier bouloches et taches" },
  { q: "maillot retro Nike", max: 45, category: "Sport", retail: 90, resale: 85, demand: 88, minMargin: 25, minRate: 0.6, risk: "Verifier authenticite et flocage" },
  { q: "Nike ACG polaire", max: 60, category: "Gorpcore", retail: 130, resale: 110, demand: 91, minMargin: 30, minRate: 0.55, risk: "Verifier zip et manches" }
];

const extraScans: Scan[] = [
  { id: "nike-running", niche: "nike", subcategory: "Nike running", q: "Nike running vintage", max: 35, category: "Nike", retail: 70, resale: 58, demand: 86, minMargin: 16, minRate: 0.48, risk: "Verifier logo, matiere technique et traces d'usure" },
  { id: "nike-sport", niche: "nike", subcategory: "Nike sport", q: "Nike sport vintage", max: 28, category: "Nike", retail: 55, resale: 48, demand: 84, minMargin: 14, minRate: 0.45, risk: "Verifier taches, logo et coupe" },
  { id: "nike-acg", niche: "nike", subcategory: "Nike ACG", q: "Nike ACG polaire", max: 60, category: "Gorpcore", retail: 130, resale: 110, demand: 91, minMargin: 30, minRate: 0.55, risk: "Verifier zip et manches" },
  { id: "ralph-knit", niche: "ralph", subcategory: "Pull torsade", q: "Ralph Lauren pull torsade", max: 32, category: "Ralph Lauren", retail: 149, resale: 62, demand: 82, minMargin: 20, minRate: 0.55, risk: "Verifier col, maille et etiquette" },
  { id: "ralph-oxford", niche: "ralph", subcategory: "Chemise Oxford", q: "Ralph Lauren chemise oxford", max: 25, category: "Ralph Lauren", retail: 119, resale: 48, demand: 78, minMargin: 15, minRate: 0.5, risk: "Verifier col et poignets" },
  { id: "ralph-cap", niche: "ralph", subcategory: "Casquette Ralph", q: "Ralph Lauren casquette", max: 18, category: "Accessoires", retail: 49, resale: 34, demand: 76, minMargin: 10, minRate: 0.55, risk: "Verifier forme, taches et logo" },
  { id: "adidas-samba", niche: "adidas", subcategory: "Adidas Samba", q: "Adidas Samba cuir", max: 45, category: "Sneakers", retail: 120, resale: 75, demand: 91, minMargin: 18, minRate: 0.42, risk: "Verifier semelle et talon interieur" },
  { id: "adidas-track", niche: "adidas", subcategory: "Survetement retro", q: "Adidas survetement vintage", max: 45, category: "Sportswear", retail: 90, resale: 78, demand: 83, minMargin: 22, minRate: 0.55, risk: "Verifier fermeture, bandes et bouloches" },
  { id: "football-psg", niche: "maillots", subcategory: "PSG", q: "maillot PSG vintage", max: 55, category: "Maillots", retail: 95, resale: 95, demand: 90, minMargin: 28, minRate: 0.55, risk: "Verifier saison, sponsor et flocage" },
  { id: "football-manchester", niche: "maillots", subcategory: "Manchester", q: "maillot Manchester United vintage", max: 55, category: "Maillots", retail: 95, resale: 92, demand: 87, minMargin: 25, minRate: 0.5, risk: "Verifier authenticite et etiquette" },
  { id: "outdoor-arcteryx", niche: "outdoor", subcategory: "Arc'teryx", q: "Arc'teryx shell ancien logo", max: 110, category: "Outdoor", retail: 400, resale: 210, demand: 96, minMargin: 65, minRate: 0.65, risk: "Verifier membrane et coutures" },
  { id: "outdoor-tnf", niche: "outdoor", subcategory: "The North Face", q: "The North Face fleece vintage", max: 65, category: "Outdoor", retail: 130, resale: 105, demand: 87, minMargin: 30, minRate: 0.52, risk: "Verifier zip, logo et manches" },
  { id: "workwear-carhartt", niche: "workwear", subcategory: "Carhartt Detroit", q: "Carhartt Detroit jacket", max: 70, category: "Workwear", retail: 189, resale: 125, demand: 92, minMargin: 35, minRate: 0.55, risk: "Verifier zip, doublure et manches" },
  { id: "denim-levis", niche: "denim", subcategory: "Levi's 501", q: "Levis 501 USA", max: 35, category: "Denim", retail: 110, resale: 68, demand: 89, minMargin: 20, minRate: 0.55, risk: "Verifier mesures et ourlet" },
  { id: "designer-stone", niche: "designer", subcategory: "Stone Island", q: "Stone Island maille badge", max: 115, category: "Designer", retail: 280, resale: 180, demand: 88, minMargin: 45, minRate: 0.45, risk: "Verifier certilogo et badge" },
  { id: "tech-iphone", niche: "tech", subcategory: "iPhone", q: "iPhone facture debloque", max: 350, category: "Tech", retail: 750, resale: 520, demand: 86, minMargin: 70, minRate: 0.25, risk: "Verifier facture, IMEI, batterie et compte retire" }
];

const seasonalScans: Scan[] = [
  { id: "summer-skirt-premium", niche: "ete", subcategory: "Jupes premium", q: "jupe vintage soie", min: 30, max: 65, category: "Ete", retail: 120, resale: 82, demand: 78, minMargin: 24, minRate: 0.48, risk: "Verifier doublure, taches et transparence", season: "ete" },
  { id: "summer-dress-premium", niche: "ete", subcategory: "Robes propres", q: "robe vintage ete", min: 30, max: 70, category: "Ete", retail: 130, resale: 88, demand: 80, minMargin: 25, minRate: 0.46, risk: "Verifier taille, fermeture et taches", season: "ete" },
  { id: "summer-blouse", niche: "ete", subcategory: "Chemisiers", q: "chemisier vintage brode", min: 25, max: 55, category: "Ete", retail: 95, resale: 64, demand: 77, minMargin: 18, minRate: 0.45, risk: "Verifier aisselles, boutons et matiere", season: "ete" },
  { id: "winter-knit", niche: "hiver", subcategory: "Mailles hiver", q: "pull laine vintage", min: 25, max: 60, category: "Hiver", retail: 120, resale: 82, demand: 82, minMargin: 24, minRate: 0.5, risk: "Verifier trous, bouloches et col", season: "hiver" },
  { id: "winter-puffer", niche: "hiver", subcategory: "Doudounes", q: "doudoune vintage plume", min: 60, max: 180, category: "Hiver", retail: 260, resale: 220, demand: 84, minMargin: 55, minRate: 0.42, risk: "Verifier zip, gonflant, taches et authenticite", season: "hiver" }
];

const allScans = Array.from(new Map([...seasonalScans, ...extraScans, ...scans].map((scan) => [scan.id || scan.q, scan])).values());

const badListingWords = [
  "facture",
  "boite",
  "box",
  "recu",
  "ticket",
  "notice",
  "accessoire",
  "piece",
  "pieces",
  "cass",
  "hs",
  "ne marche pas",
  "defectueux",
  "pour pieces"
];

const aestheticBoostWords = [
  "vintage",
  "retro",
  "brode",
  "logo",
  "ancien",
  "rare",
  "oversize",
  "y2k",
  "gorpcore",
  "acg",
  "torsade",
  "oxford",
  "usa",
  "made in",
  "cuir",
  "vert",
  "bleu",
  "rouge",
  "rose",
  "creme",
  "beige",
  "marine",
  "noir",
  "blanc"
];

const aestheticPenaltyWords = [
  "delave",
  "delavé",
  "tache",
  "taches",
  "trou",
  "troue",
  "troué",
  "abime",
  "abîme",
  "abimee",
  "abîmée",
  "use",
  "usé",
  "sale",
  "sans marque",
  "lot",
  "basique",
  "simple",
  "ancien mais",
  "a reparer",
  "à réparer"
];

function cleanText(value: string) {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&quot;/g, "\"")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function titleFromHref(href: string) {
  const slug = href.split("/items/")[1]?.split("?")[0] || "";
  return decodeURIComponent(slug)
    .replace(/^\d+-?/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function absoluteVintedLink(href: string) {
  if (href.startsWith("http")) return href.split("?")[0];
  return `https://www.vinted.fr${href.split("?")[0]}`;
}

function looksReliable(title: string) {
  const value = title.toLowerCase();
  return !badListingWords.some((word) => value.includes(word));
}

function sellabilityScore(title: string, scan: Scan) {
  const value = title.toLowerCase();
  const titleWords = value.split(/\s+/).filter(Boolean);
  const hasScanBrand = scan.q.toLowerCase().split(/\s+/).some((word) => word.length > 3 && value.includes(word));
  const boosts = aestheticBoostWords.filter((word) => value.includes(word)).length;
  const penalties = aestheticPenaltyWords.filter((word) => value.includes(word)).length;
  const detailScore = Math.min(1.2, Math.max(0, titleWords.length - 3) * 0.18);
  const brandScore = hasScanBrand ? 1.25 : -0.8;
  const styleScore = Math.min(1.6, boosts * 0.35);
  const penaltyScore = penalties * 0.65;
  const categoryScore = ["Outdoor", "Gorpcore", "Workwear", "Sport", "Classique", "Vintage", "Designer"].includes(scan.category) ? 0.45 : 0.2;
  return Math.max(1, Math.min(10, 5.3 + brandScore + styleScore + detailScore + categoryScore - penaltyScore));
}

function extractLinks(html: string) {
  const links = new Map<string, { title: string }>();
  const regex = /href=["']([^"']*\/items\/[^"']+)["'][^>]*>(.*?)<\/a>/gi;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(html))) {
    const href = absoluteVintedLink(match[1]);
    const title = cleanText(match[2]) || titleFromHref(href);
    if (title.length > 4 && looksReliable(title)) links.set(href, { title });
  }

  const bareRegex = /https?:\/\/www\.vinted\.[a-z.]+\/items\/[0-9]+-[^"'\\\s]+/gi;
  while ((match = bareRegex.exec(html))) {
    const href = absoluteVintedLink(match[0]);
    const title = titleFromHref(href);
    if (title.length > 4 && looksReliable(title)) links.set(href, { title });
  }

  return [...links.entries()].slice(0, 8).map(([link, item]) => ({ link, ...item }));
}

function extractMetaContent(html: string, property: string) {
  const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i");
  return cleanText(regex.exec(html)?.[1] || "");
}

function parseDetailPrice(html: string) {
  const metaPrice = extractMetaContent(html, "product:price:amount");
  const metaValue = Number(metaPrice.replace(",", "."));
  if (Number.isFinite(metaValue) && metaValue > 0 && metaValue < 5000) return Math.round(metaValue);

  const jsonLd = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const match of jsonLd) {
    try {
      const data = JSON.parse(match[1]);
      const offers = Array.isArray(data.offers) ? data.offers[0] : data.offers;
      const price = Number(String(offers?.price || offers?.lowPrice || "").replace(",", "."));
      if (Number.isFinite(price) && price > 0 && price < 5000) return Math.round(price);
    } catch {}
  }

  const strictPatterns = [
    /"price"\s*:\s*\{\s*"amount"\s*:\s*"?(\d{1,5}(?:[,.]\d{1,2})?)"?/i,
    /"price"\s*:\s*"?(\d{1,5}(?:[,.]\d{1,2})?)"?\s*,\s*"currency/i,
    /"amount"\s*:\s*"?(\d{1,5}(?:[,.]\d{1,2})?)"?\s*,\s*"currency_code"\s*:\s*"EUR"/i
  ];

  for (const pattern of strictPatterns) {
    const value = Number((pattern.exec(html)?.[1] || "").replace(",", "."));
    if (Number.isFinite(value) && value > 0 && value < 5000) return Math.round(value);
  }

  return null;
}

function parseDetailTitle(html: string, fallback: string) {
  return extractMetaContent(html, "og:title")
    .replace(/\s*\|\s*Vinted.*$/i, "")
    .trim() || fallback;
}

function parseFavoriteCount(html: string) {
  const patterns = [
    /"favourite_count"\s*:\s*(\d+)/i,
    /"favorite_count"\s*:\s*(\d+)/i,
    /"favorites_count"\s*:\s*(\d+)/i,
    /"likes_count"\s*:\s*(\d+)/i,
    /(\d+)\s*(?:favoris|likes|j'aime)/i
  ];

  for (const pattern of patterns) {
    const value = Number(pattern.exec(html)?.[1] || 0);
    if (Number.isFinite(value) && value >= 0 && value < 100000) return value;
  }

  return null;
}

function likeVelocityLabel(likes: number | null, demand: number) {
  if (likes === null) return demand >= 86 ? "Demande probable forte, likes non lisibles" : "Likes non lisibles";
  if (likes >= 20) return "Tres fort: deja 20+ likes";
  if (likes >= 10) return "Fort: 10+ likes";
  if (likes >= 4) return "Correct: premiers likes visibles";
  return "Faible: peu de likes visibles";
}

function safeBuyPrice(resale: number) {
  const safeResale = Math.round(resale * 0.85);
  return {
    safeResale,
    maxSafeBuy: Math.max(1, Math.floor(safeResale / 2)),
    safetyReserve: Math.max(1, resale - safeResale)
  };
}

async function fetchListingDetail(item: { link: string; title: string }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);

  try {
    const response = await fetch(item.link, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.7"
      },
      cache: "no-store"
    });
    clearTimeout(timeout);
    if (!response.ok) return null;
    const html = await response.text();
    const listingPrice = parseDetailPrice(html);
    const title = parseDetailTitle(html, item.title);
    const likes = parseFavoriteCount(html);
    if (!listingPrice || !looksReliable(title)) return null;
    return { ...item, title, listingPrice, likes };
  } catch {
    clearTimeout(timeout);
    return null;
  }
}

async function fetchSearch(scan: Scan) {
  const params = new URLSearchParams({
    search_text: scan.q,
    price_to: String(scan.max),
    order: "newest_first"
  });
  if (scan.min) params.set("price_from", String(scan.min));
  const url = `https://www.vinted.fr/catalog?${params.toString()}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.7"
      },
      cache: "no-store"
    });
    clearTimeout(timeout);
    if (!response.ok) return [];

    const html = await response.text();
    const checkedItems = await Promise.all(extractLinks(html).map(fetchListingDetail));

    return checkedItems
      .filter((item): item is { link: string; title: string; listingPrice: number; likes: number | null } => Boolean(item))
      .filter((item) => {
        const price = item.listingPrice;
        const safe = safeBuyPrice(scan.resale);
        const margin = scan.resale - price;
        const marginRate = margin / Math.max(price, 1);
        const sellable = sellabilityScore(item.title, scan);
        const demandSignal = item.likes === null || item.likes >= 4 || scan.demand >= 86;
        return price > 0 && price <= scan.max && price <= safe.maxSafeBuy && margin >= scan.minMargin && marginRate >= scan.minRate && sellable >= 6.2 && demandSignal;
      })
      .map((item, index): LiveOpportunity => {
        const listingPrice = item.listingPrice;
        const safe = safeBuyPrice(scan.resale);
        const margin = scan.resale - listingPrice;
        const marginRate = margin / Math.max(listingPrice, 1);
        const sellable = sellabilityScore(item.title, scan);
        const likeBoost = item.likes === null ? 0 : Math.min(0.8, item.likes / 30);
        const score = Math.max(
          7.4,
          Math.min(9.8, 6.1 + marginRate * 1.05 + scan.demand / 100 + sellable * 0.18 + likeBoost + (listingPrice <= safe.maxSafeBuy ? 0.45 : 0) - index * 0.08)
        );

        return {
          id: `${scan.q}-${index}-${item.link}`.replace(/\W+/g, "-").slice(0, 90),
          title: item.title || scan.q,
          category: scan.category,
          score: Number(score.toFixed(1)),
          buy: listingPrice,
          listingPrice,
          retail: scan.retail,
          resale: scan.resale,
          safeResale: safe.safeResale,
          maxSafeBuy: safe.maxSafeBuy,
          safetyReserve: safe.safetyReserve,
          x2Rule: listingPrice * 2 <= safe.safeResale,
          margin,
          marginRate: Number(marginRate.toFixed(2)),
          demand: scan.demand,
          likes: item.likes,
          likeVelocity: likeVelocityLabel(item.likes, scan.demand),
          popularity: Math.min(98, scan.demand + 4 - index),
          link: item.link,
          signal: `Prix lu + style vendable ${sellable.toFixed(1)}/10`,
          reason: `Prix annonce: ${listingPrice} EUR. Revente visee: ${scan.resale} EUR. Revente prudente apres marge de securite: ${safe.safeResale} EUR. Achat max conseille: ${safe.maxSafeBuy} EUR.`,
          risk: scan.risk,
          condition: "A verifier sur photos vendeur",
          sellerSignal: `Si le prix est un peu haut, regarde le dressing vendeur pour tenter un lot et viser -30% a -40%.`,
          spottedAt: `Live ${new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`
        };
      });
  } catch {
    clearTimeout(timeout);
    return [];
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const requestedNiches = (url.searchParams.get("niches") || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const requestedSearches = (url.searchParams.get("searches") || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const selectedScans = allScans
    .filter((scan) => requestedNiches.length === 0 || requestedNiches.includes(scan.niche || ""))
    .filter((scan) => requestedSearches.length === 0 || requestedSearches.includes(scan.id || scan.q))
    .slice(0, 12);
  const activeScans = selectedScans.length > 0 ? selectedScans : allScans.slice(0, 12);
  const results = (await Promise.all(activeScans.map(fetchSearch))).flat();
  const unique = Array.from(new Map(results.map((item) => [item.link, item])).values())
    .sort((a, b) => (b.score - a.score) || (b.margin - a.margin))
    .slice(0, 10);

  return NextResponse.json({
    items: unique,
    checkedAt: new Date().toISOString(),
    live: unique.length > 0,
    message: unique.length > 0
      ? `${unique.length} annonces live avec prix exact lu sur la page annonce.`
      : "Aucune annonce live fiable: Vinted bloque le prix exact ou aucune annonce ne passe les filtres premium.",
    activeScans: activeScans.map((scan) => ({ id: scan.id || scan.q, niche: scan.niche || "general", label: scan.subcategory || scan.q, q: scan.q }))
  });
}
