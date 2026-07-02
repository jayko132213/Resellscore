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
  return Math.round(Number(`${match[1]}.${match[2] || "0"}`));
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
