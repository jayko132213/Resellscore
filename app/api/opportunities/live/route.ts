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

const scans = [
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

function parsePrice(text: string) {
  const cleaned = cleanText(text);
  const matches = [...cleaned.matchAll(/(?:^|[\s>])(\d{1,5}(?:[,.]\d{1,2})?)\s*(?:EUR|€)/gi)];
  for (const match of matches) {
    const value = Number(match[1].replace(",", "."));
    if (Number.isFinite(value) && value > 0 && value < 5000) return Math.round(value);
  }
  return null;
}

function looksReliable(title: string) {
  const value = title.toLowerCase();
  return !badListingWords.some((word) => value.includes(word));
}

function extractLinks(html: string) {
  const links = new Map<string, { title: string; listingPrice: number | null }>();
  const regex = /href=["']([^"']*\/items\/[^"']+)["'][^>]*>(.*?)<\/a>/gi;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(html))) {
    const href = absoluteVintedLink(match[1]);
    const title = cleanText(match[2]) || titleFromHref(href);
    const chunk = html.slice(Math.max(0, match.index - 1200), Math.min(html.length, match.index + 2400));
    const listingPrice = parsePrice(chunk);
    if (title.length > 4 && looksReliable(title)) links.set(href, { title, listingPrice });
  }

  const bareRegex = /https?:\/\/www\.vinted\.[a-z.]+\/items\/[0-9]+-[^"'\\\s]+/gi;
  while ((match = bareRegex.exec(html))) {
    const href = absoluteVintedLink(match[0]);
    const title = titleFromHref(href);
    const chunk = html.slice(Math.max(0, match.index - 1200), Math.min(html.length, match.index + 2400));
    const listingPrice = parsePrice(chunk);
    if (title.length > 4 && looksReliable(title)) {
      const existing = links.get(href);
      if (!existing || (!existing.listingPrice && listingPrice)) links.set(href, { title, listingPrice });
    }
  }

  return [...links.entries()]
    .map(([link, item]) => ({ link, ...item }))
    .filter((item) => item.listingPrice !== null)
    .slice(0, 5);
}

async function fetchSearch(scan: typeof scans[number]) {
  const url = `https://www.vinted.fr/catalog?search_text=${encodeURIComponent(scan.q)}&price_to=${scan.max}&order=newest_first`;
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
    return extractLinks(html)
      .filter((item) => {
        const price = item.listingPrice || 0;
        const margin = scan.resale - price;
        const marginRate = margin / Math.max(price, 1);
        return price > 0 && price <= scan.max && margin >= scan.minMargin && marginRate >= scan.minRate;
      })
      .map((item, index): LiveOpportunity => {
      const listingPrice = item.listingPrice || 0;
      const margin = scan.resale - listingPrice;
      const marginRate = margin / Math.max(listingPrice, 1);
      const score = Math.max(
        7.4,
        Math.min(9.8, 6.7 + marginRate * 1.25 + scan.demand / 100 + (listingPrice <= scan.max * 0.75 ? 0.35 : 0) - index * 0.08)
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
        margin,
        marginRate: Number(marginRate.toFixed(2)),
        demand: scan.demand,
        popularity: Math.min(98, scan.demand + 4 - index),
        link: item.link,
        signal: "Prix lu sur Vinted",
        reason: `Prix annonce: ${listingPrice} EUR. Revente visee: ${scan.resale} EUR. Marge brute: ${margin} EUR avant frais.`,
        risk: scan.risk,
        condition: "A verifier sur photos vendeur",
        sellerSignal: `Prix reel sous ${scan.max} EUR`,
        spottedAt: `Live ${new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`
      };
    });
  } catch {
    clearTimeout(timeout);
    return [];
  }
}

export async function GET() {
  const results = (await Promise.all(scans.map(fetchSearch))).flat();
  const unique = Array.from(new Map(results.map((item) => [item.link, item])).values())
    .sort((a, b) => (b.score - a.score) || (b.margin - a.margin))
    .slice(0, 10);

  return NextResponse.json({
    items: unique,
    checkedAt: new Date().toISOString(),
    live: unique.length > 0,
    message: unique.length > 0
      ? `${unique.length} annonces live avec prix Vinted lu.`
      : "Aucune annonce live fiable: Vinted bloque le prix ou aucune annonce ne passe les filtres premium."
  });
}
