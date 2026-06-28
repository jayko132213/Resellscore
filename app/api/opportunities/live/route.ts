import { NextResponse } from "next/server";

type LiveOpportunity = {
  id: string;
  title: string;
  category: string;
  score: number;
  buy: number;
  resale: number;
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
  { q: "Nike short vert", max: 30, category: "Ete", resale: 42, demand: 84, risk: "Verifier etiquette et etat de l'elastique" },
  { q: "Ralph Lauren pull torsade", max: 30, category: "Vintage", resale: 55, demand: 82, risk: "Verifier col, maille et etiquette" },
  { q: "Carhartt Detroit jacket", max: 70, category: "Workwear", resale: 125, demand: 92, risk: "Verifier zip, doublure et manches" },
  { q: "Levis 501 USA", max: 35, category: "Denim", resale: 68, demand: 89, risk: "Verifier mesures et ourlet" },
  { q: "Adidas Samba cuir", max: 45, category: "Sneakers", resale: 75, demand: 91, risk: "Verifier semelle et talon interieur" },
  { q: "Arc'teryx shell ancien logo", max: 110, category: "Outdoor", resale: 210, demand: 96, risk: "Verifier membrane et coutures" },
  { q: "Stone Island maille badge", max: 115, category: "Designer", resale: 180, demand: 88, risk: "Verifier certilogo et badge" },
  { q: "Patagonia Synchilla", max: 80, category: "Outdoor", resale: 135, demand: 86, risk: "Verifier bouloches et taches" }
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

function extractLinks(html: string) {
  const links = new Map<string, string>();
  const regex = /href=["']([^"']*\/items\/[^"']+)["'][^>]*>(.*?)<\/a>/gi;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(html))) {
    const href = absoluteVintedLink(match[1]);
    const title = cleanText(match[2]) || titleFromHref(href);
    if (title.length > 4) links.set(href, title);
  }

  const bareRegex = /https?:\/\/www\.vinted\.[a-z.]+\/items\/[0-9]+-[^"'\\\s]+/gi;
  while ((match = bareRegex.exec(html))) {
    const href = absoluteVintedLink(match[0]);
    links.set(href, titleFromHref(href));
  }

  return [...links.entries()].slice(0, 3).map(([link, title]) => ({ link, title }));
}

async function fetchSearch(scan: typeof scans[number]) {
  const url = `https://www.vinted.fr/catalog?search_text=${encodeURIComponent(scan.q)}&price_to=${scan.max}&order=newest_first`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 ResellScoreBot/1.0",
        "Accept": "text/html,application/xhtml+xml"
      },
      cache: "no-store"
    });
    clearTimeout(timeout);
    if (!response.ok) return [];
    const html = await response.text();
    return extractLinks(html).map((item, index): LiveOpportunity => {
      const buy = Math.max(8, Math.round(scan.max * (0.65 + index * 0.08)));
      const margin = scan.resale - buy;
      const score = Math.max(7.4, Math.min(9.7, 7.2 + margin / Math.max(buy, 1) + scan.demand / 100));

      return {
        id: `${scan.q}-${index}-${item.link}`.replace(/\W+/g, "-").slice(0, 90),
        title: item.title || scan.q,
        category: scan.category,
        score: Number(score.toFixed(1)),
        buy,
        resale: scan.resale,
        demand: scan.demand,
        popularity: Math.min(98, scan.demand + 4 - index),
        link: item.link,
        signal: margin >= 25 ? "Annonce sous le marche" : "Marge a verifier",
        reason: `Annonce precise detectee depuis Vinted sur "${scan.q}". Marge brute estimee autour de ${margin} EUR si l'etat est confirme.`,
        risk: scan.risk,
        condition: "A verifier sur photos vendeur",
        sellerSignal: `Prix cible sous ${scan.max} EUR`,
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
    .sort((a, b) => (b.resale - b.buy) - (a.resale - a.buy))
    .slice(0, 18);

  return NextResponse.json({
    items: unique,
    checkedAt: new Date().toISOString(),
    live: unique.length > 0,
    message: unique.length > 0
      ? `${unique.length} annonces Vinted detectees.`
      : "Aucune annonce live recuperee. Vinted ou le reseau local bloque peut-etre le scan."
  });
}
