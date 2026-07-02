import { NextResponse } from "next/server";
import { z } from "zod";
import { getConfiguredAiProvider, runListingAnalysis } from "@/lib/ai";

const fieldsSchema = z.object({
  title: z.string().min(0).max(160).default("Article Vinted a analyser"),
  description: z.string().min(0).max(5000).default("Analyse demandee a partir des infos fournies."),
  sellerPrice: z.coerce.number().positive().max(10000).default(1),
  brand: z.string().max(80).optional().nullable(),
  size: z.string().max(40).optional().nullable(),
  condition: z.string().max(80).optional().nullable(),
  vintedUrl: z.string().optional().nullable()
});

function isVintedUrl(value?: string | null) {
  if (!value) return true;
  try {
    const host = new URL(value).hostname.toLowerCase();
    return host === "vinted.fr" || host.endsWith(".vinted.fr") || host === "vinted.com" || host.endsWith(".vinted.com");
  } catch {
    return false;
  }
}

function cleanText(value: string) {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&quot;/g, "\"")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function titleFromVintedUrl(value?: string | null) {
  if (!value) return "";
  try {
    const url = new URL(value);
    const itemPart = url.pathname.split("/").find((part) => part.includes("-"));
    if (!itemPart) return "";
    return decodeURIComponent(itemPart)
      .replace(/^\d+-?/, "")
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  } catch {
    return "";
  }
}

function extractMeta(html: string, property: string) {
  const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i");
  const match = html.match(re);
  return match ? cleanText(match[1]) : "";
}

function guessBrandFromText(text: string) {
  const brands = ["Ralph Lauren", "Lacoste", "Nike", "Adidas", "Carhartt", "Stone Island", "Arc'teryx", "Levi's", "Patagonia", "Moncler", "Apple", "Sony", "Nintendo", "New Balance", "Burberry", "Dr. Martens"];
  const lowered = text.toLowerCase();
  return brands.find((brand) => lowered.includes(brand.toLowerCase().replace("'", "")) || lowered.includes(brand.toLowerCase())) || "";
}

function extractPrice(text: string) {
  const match = text.match(/(?:€|eur|prix|price)\s*[:\-]?\s*(\d{1,5})|(\d{1,5})\s*(?:€|eur|euros?)/i);
  return Number(match?.[1] || match?.[2] || 0);
}

async function readVintedPage(vintedUrl?: string | null) {
  if (!vintedUrl) return null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);
    const response = await fetch(vintedUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 ResellScoreBot/1.0",
        "Accept": "text/html,application/xhtml+xml"
      }
    });
    clearTimeout(timeout);
    if (!response.ok) return null;

    const html = await response.text();
    const title = extractMeta(html, "og:title") || extractMeta(html, "twitter:title") || titleFromVintedUrl(vintedUrl);
    const description = extractMeta(html, "og:description") || extractMeta(html, "description");
    const combined = `${title} ${description}`;

    return {
      title,
      description,
      sellerPrice: extractPrice(combined),
      brand: guessBrandFromText(combined)
    };
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const provider = getConfiguredAiProvider();

    if (provider === "fallback") {
      return NextResponse.json({ error: "Le moteur d'analyse est temporairement indisponible. Reessaie dans quelques minutes." }, { status: 503 });
    }

    const form = await request.formData();
    const parsed = fieldsSchema.safeParse({
      title: form.get("title") || "Article Vinted a analyser",
      description: form.get("description") || "Analyse demandee a partir des infos fournies.",
      sellerPrice: form.get("sellerPrice") || 1,
      brand: form.get("brand") || undefined,
      size: form.get("size") || undefined,
      condition: form.get("condition") || undefined,
      vintedUrl: form.get("vintedUrl") || undefined
    });

    if (!parsed.success) return NextResponse.json({ error: "Donnees invalides." }, { status: 400 });
    if (!isVintedUrl(parsed.data.vintedUrl)) return NextResponse.json({ error: "Le lien doit venir de Vinted." }, { status: 400 });

    const files = [...form.getAll("photos"), ...form.getAll("screenshots")]
      .filter((item): item is File => item instanceof File && item.size > 0 && item.type.startsWith("image/"))
      .slice(0, 4);

    const images = await Promise.all(files.map(async (file) => ({
      mimeType: file.type,
      data: Buffer.from(await file.arrayBuffer()).toString("base64")
    })));

    const scraped = await readVintedPage(parsed.data.vintedUrl);
    const urlTitle = titleFromVintedUrl(parsed.data.vintedUrl);
    const mergedTitle = scraped?.title || (parsed.data.title === "Article Vinted a analyser" ? urlTitle : parsed.data.title) || urlTitle || "Article Vinted a analyser";
    const mergedDescription = [scraped?.description, parsed.data.description]
      .filter(Boolean)
      .join("\n\n")
      .trim() || "Analyse demandee a partir des infos fournies.";
    const mergedBrand = parsed.data.brand || scraped?.brand || guessBrandFromText(`${mergedTitle} ${mergedDescription}`) || undefined;
    const mergedPrice = scraped?.sellerPrice || parsed.data.sellerPrice;

    const result = await runListingAnalysis({
      title: mergedTitle,
      description: mergedDescription,
      sellerPrice: mergedPrice,
      brand: mergedBrand,
      size: parsed.data.size || undefined,
      condition: parsed.data.condition || undefined,
      vintedUrl: parsed.data.vintedUrl || undefined,
      photoCount: images.length,
      images
    });

    return NextResponse.json({ result, poweredBy: provider });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Analyse impossible.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
