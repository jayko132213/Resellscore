export type VintedListingSnapshot = {
  url: string;
  title: string;
  description: string;
  sellerPrice: number;
  brand: string;
  condition: string;
  imageUrl: string;
  rawText: string;
  fetched: boolean;
};

export type VintedProductPreview = VintedListingSnapshot & {
  productGuess: string;
  confidence: "faible" | "moyenne" | "haute";
};

export function isVintedUrl(value?: string | null) {
  if (!value) return true;
  try {
    const host = new URL(value).hostname.toLowerCase();
    return host === "vinted.fr" || host.endsWith(".vinted.fr") || host === "vinted.com" || host.endsWith(".vinted.com");
  } catch {
    return false;
  }
}

export function titleFromVintedUrl(value?: string | null) {
  if (!value) return "";
  try {
    const url = new URL(value);
    const itemPart = url.pathname.split("/").find((part) => /^\d+[-_]/.test(part) || part.includes("-"));
    if (!itemPart) return "";
    return decodeURIComponent(itemPart)
      .replace(/^\d+[-_]?/, "")
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  } catch {
    return "";
  }
}

function itemIdFromVintedUrl(value?: string | null) {
  if (!value) return "";
  try {
    const url = new URL(value);
    const match = url.pathname.match(/\/items\/(\d+)/);
    return match?.[1] || "";
  } catch {
    return "";
  }
}

function cleanText(value: string) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&quot;/g, "\"")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&euro;/g, "€")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanJsonText(value: unknown) {
  return cleanText(String(value || ""));
}

function extractMeta(html: string, property: string) {
  const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escaped}["'][^>]*>`, "i")
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return cleanText(match[1]);
  }
  return "";
}

function extractFirstNumber(value: string) {
  const match = value.match(/(\d{1,5})(?:[,.](\d{1,2}))?/);
  if (!match) return 0;
  const price = Math.round(Number(`${match[1]}.${match[2] || "0"}`));
  return price > 0 && price <= 5000 ? price : 0;
}

function priceFromValue(value: unknown) {
  if (typeof value === "number") return value > 0 && value <= 5000 ? Math.round(value) : 0;
  if (typeof value === "string") return extractFirstNumber(value);
  if (value && typeof value === "object") {
    const object = value as Record<string, unknown>;
    return priceFromValue(object.amount || object.value || object.price || object.price_without_discount);
  }
  return 0;
}

function extractPriceFromText(text: string) {
  const patterns = [
    /(?:prix|price|€|eur|euros?)\s*[:\-]?\s*(\d{1,5}(?:[,.]\d{1,2})?)/i,
    /(\d{1,5}(?:[,.]\d{1,2})?)\s*(?:€|eur|euros?)/i
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return extractFirstNumber(match[1]);
  }
  return 0;
}

function guessBrandFromText(text: string) {
  const brands = [
    "Ralph Lauren", "Polo Ralph Lauren", "Lacoste", "Nike", "Nike ACG", "Adidas", "Carhartt",
    "Stone Island", "Arc'teryx", "Arcteryx", "Levi's", "Levis", "Patagonia", "Moncler",
    "Apple", "Sony", "Nintendo", "New Balance", "Burberry", "Dr. Martens", "The North Face",
    "Supreme", "Stussy", "CP Company", "C.P. Company", "Diesel", "Tommy Hilfiger"
  ];
  const lowered = text.toLowerCase();
  return brands.find((brand) => lowered.includes(brand.toLowerCase().replace("'", "")) || lowered.includes(brand.toLowerCase())) || "";
}

function guessFootballProduct(text: string) {
  const lowered = text.toLowerCase();
  if (!/maillot|football|soccer|jersey|psg|manchester|inter milan|internazionale/.test(lowered)) return "";

  const clubs = [
    { match: /manchester united|man utd/, name: "Manchester United" },
    { match: /psg|paris saint[-\s]?germain/, name: "PSG" },
    { match: /inter milan|internazionale/, name: "Inter Milan" },
    { match: /real madrid/, name: "Real Madrid" },
    { match: /barcelone|barcelona|fc barca|barça/, name: "FC Barcelone" },
    { match: /marseille|om olympique/, name: "Olympique de Marseille" },
    { match: /arsenal/, name: "Arsenal" },
    { match: /chelsea/, name: "Chelsea" },
    { match: /milan ac|ac milan/, name: "AC Milan" }
  ];
  const club = clubs.find((item) => item.match.test(lowered))?.name;
  const brand = /nike/.test(lowered) ? "Nike" : /adidas/.test(lowered) ? "Adidas" : /puma/.test(lowered) ? "Puma" : "";
  const season = lowered.match(/\b(19|20)\d{2}\s*[-/]\s*(\d{2}|\d{4})\b/)?.[0]?.replace(/\s+/g, "") || "";
  const size = lowered.match(/\btaille\s*(xs|s|m|l|xl|xxl|\d{2,3})\b/i)?.[0]?.replace(/\s+/g, " ") || "";

  return ["maillot", club, brand, season, size].filter(Boolean).join(" ");
}

export function buildProductPreview(listing: VintedListingSnapshot): VintedProductPreview {
  const text = [listing.title, listing.description, listing.rawText].filter(Boolean).join(" ");
  const football = guessFootballProduct(text);
  const cleanTitle = listing.title || titleFromVintedUrl(listing.url);
  const productGuess = football || cleanTitle || "Produit Vinted";
  const confidence = listing.fetched && listing.sellerPrice > 0 && productGuess !== "Produit Vinted"
    ? "haute"
    : listing.fetched || productGuess !== "Produit Vinted"
      ? "moyenne"
      : "faible";

  return {
    ...listing,
    productGuess,
    confidence
  };
}

function guessConditionFromText(text: string) {
  const lowered = text.toLowerCase();
  if (/neuf avec etiquette|neuf avec étiquette|new with tags|nwt/.test(lowered)) return "Neuf avec etiquette";
  if (/neuf sans etiquette|neuf sans étiquette|jamais porte|jamais porté|new without tags/.test(lowered)) return "Neuf sans etiquette";
  if (/tres bon etat|très bon état|excellent etat|excellent état|excellent/.test(lowered)) return "Tres bon etat";
  if (/bon etat|bon état/.test(lowered)) return "Bon etat";
  if (/satisfaisant|correct|usage|usure/.test(lowered)) return "Etat correct";
  if (/tache|trou|abime|abîme|defaut|défaut|panne|manquant/.test(lowered)) return "Defaut a verifier";
  return "";
}

function readNestedText(value: unknown, keys: string[]): string {
  if (!value || typeof value !== "object") return "";
  const object = value as Record<string, unknown>;
  for (const key of keys) {
    const item = object[key];
    if (typeof item === "string" || typeof item === "number") return cleanJsonText(item);
    if (item && typeof item === "object" && "title" in item) return cleanJsonText((item as Record<string, unknown>).title);
    if (Array.isArray(item) && item.length) {
      const first = item[0];
      if (typeof first === "string" || typeof first === "number") return cleanJsonText(first);
      if (first && typeof first === "object" && "title" in first) return cleanJsonText((first as Record<string, unknown>).title);
    }
  }
  return "";
}

function readNestedPrice(value: unknown, keys: string[]): number {
  if (!value || typeof value !== "object") return 0;
  const object = value as Record<string, unknown>;
  for (const key of keys) {
    const price = priceFromValue(object[key]);
    if (price > 0) return price;
  }
  return 0;
}

function cookiesFromResponse(response: Response) {
  const headers = response.headers as Headers & { getSetCookie?: () => string[] };
  const values = typeof headers.getSetCookie === "function"
    ? headers.getSetCookie()
    : response.headers.get("set-cookie")?.split(/,(?=\s*[^;,\s]+=)/) || [];

  return values
    .map((cookie) => cookie.split(";")[0]?.trim())
    .filter(Boolean)
    .join("; ");
}

function csrfFromHtml(html: string) {
  return html.match(/<meta[^>]+name=["']csrf-token["'][^>]+content=["']([^"']+)["']/i)?.[1] || "";
}

function snapshotFromApiItem(vintedUrl: string, item: Record<string, unknown>, rawJson: string): VintedListingSnapshot {
  const photos = Array.isArray(item.photos) ? item.photos : [];
  const firstPhoto = photos[0] as Record<string, unknown> | undefined;
  const title = readNestedText(item, ["title", "name"]);
  const description = readNestedText(item, ["description", "description_plain", "item_description"]);
  const brand = readNestedText(item, ["brand_title", "brand", "manufacturer"]);
  const condition = readNestedText(item, ["status", "status_title", "condition"]);
  const imageUrl = readNestedText(firstPhoto || {}, ["url", "full_size_url", "high_resolution_url"]);
  const sellerPrice = readNestedPrice(item, ["price", "item_price", "total_item_price", "price_numeric"]);
  const rawText = [
    title,
    description,
    brand,
    condition,
    rawJson.slice(0, 2000)
  ].filter(Boolean).join(" ");

  return {
    url: vintedUrl,
    title,
    description,
    sellerPrice,
    brand,
    condition,
    imageUrl,
    rawText,
    fetched: true
  };
}

async function readVintedApiListing(vintedUrl: string): Promise<VintedListingSnapshot | null> {
  const itemId = itemIdFromVintedUrl(vintedUrl);
  if (!itemId) return null;

  const origin = new URL(vintedUrl).origin;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const warmup = await fetch(origin, {
      signal: controller.signal,
      cache: "no-store",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.7"
      }
    });
    const warmupHtml = await warmup.text().catch(() => "");
    const cookie = cookiesFromResponse(warmup);
    const csrf = csrfFromHtml(warmupHtml);
    const apiHeaders: HeadersInit = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
      "Accept": "application/json, text/plain, */*",
      "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.7",
      "Referer": vintedUrl
    };
    if (cookie) apiHeaders.Cookie = cookie;
    if (csrf) apiHeaders["X-CSRF-Token"] = csrf;

    const endpoints = [
      `${origin}/api/v2/items/${itemId}`,
      `${origin}/api/v2/items/${itemId}/details`
    ];

    for (const endpoint of endpoints) {
      const response = await fetch(endpoint, {
        signal: controller.signal,
        cache: "no-store",
        headers: apiHeaders
      });
      if (!response.ok) continue;

      const json = await response.json();
      const item = (json.item || json.item_dto || json) as Record<string, unknown>;
      const rawJson = JSON.stringify(json);
      const snapshot = snapshotFromApiItem(vintedUrl, item, rawJson);
      if (snapshot.title || snapshot.description || snapshot.sellerPrice > 0) {
        return snapshot;
      }
    }

    return null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function readJsonLd(html: string) {
  const blocks = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const block of blocks) {
    try {
      const parsed = JSON.parse(block[1].trim());
      const list = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of list) {
        if (!item || typeof item !== "object") continue;
        const object = item as Record<string, unknown>;
        const offers = object.offers as Record<string, unknown> | undefined;
        const price = offers ? extractFirstNumber(String(offers.price || offers.lowPrice || "")) : 0;
        return {
          title: cleanJsonText(object.name),
          description: cleanJsonText(object.description),
          sellerPrice: price,
          brand: readNestedText(object, ["brand", "manufacturer"]),
          imageUrl: readNestedText(object, ["image"])
        };
      }
    } catch {
      // Ignore bad JSON-LD blocks.
    }
  }
  return null;
}

function extractEmbeddedPrice(html: string) {
  const metaPrice = extractMeta(html, "product:price:amount");
  if (metaPrice) return extractFirstNumber(metaPrice);

  const patterns = [
    /"price"\s*:\s*\{\s*"amount"\s*:\s*"?(\d{1,5}(?:[,.]\d{1,2})?)"?/i,
    /"price"\s*:\s*"?(\d{1,5}(?:[,.]\d{1,2})?)"?\s*,\s*"currency/i,
    /"amount"\s*:\s*"?(\d{1,5}(?:[,.]\d{1,2})?)"?\s*,\s*"currency_code"\s*:\s*"EUR"/i
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return extractFirstNumber(match[1]);
  }
  return 0;
}

export async function readVintedListing(vintedUrl?: string | null): Promise<VintedListingSnapshot | null> {
  if (!vintedUrl || !isVintedUrl(vintedUrl)) return null;

  const apiListing = await readVintedApiListing(vintedUrl);
  if (apiListing) return apiListing;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const response = await fetch(vintedUrl, {
      signal: controller.signal,
      cache: "no-store",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.7"
      }
    });
    clearTimeout(timeout);
    if (!response.ok) return null;

    const html = await response.text();
    const jsonLd = readJsonLd(html);
    const metaTitle = extractMeta(html, "og:title") || extractMeta(html, "twitter:title");
    const metaDescription = extractMeta(html, "og:description") || extractMeta(html, "description") || extractMeta(html, "twitter:description");
    const imageUrl = extractMeta(html, "og:image") || extractMeta(html, "twitter:image") || jsonLd?.imageUrl || "";
    const pageText = cleanText(html).slice(0, 12000);
    const combined = [metaTitle, metaDescription, jsonLd?.title, jsonLd?.description, pageText].filter(Boolean).join(" ");

    return {
      url: vintedUrl,
      title: jsonLd?.title || metaTitle || titleFromVintedUrl(vintedUrl),
      description: jsonLd?.description || metaDescription || "",
      sellerPrice: jsonLd?.sellerPrice || extractEmbeddedPrice(html) || extractPriceFromText(combined),
      brand: jsonLd?.brand || guessBrandFromText(combined),
      condition: guessConditionFromText(combined),
      imageUrl,
      rawText: combined.slice(0, 6000),
      fetched: true
    };
  } catch {
    return {
      url: vintedUrl,
      title: titleFromVintedUrl(vintedUrl),
      description: "",
      sellerPrice: 0,
      brand: "",
      condition: "",
      imageUrl: "",
      rawText: titleFromVintedUrl(vintedUrl),
      fetched: false
    };
  }
}
