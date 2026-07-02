import { NextResponse } from "next/server";
import { z } from "zod";
import { getConfiguredAiProvider, runListingAnalysis } from "@/lib/ai";
import { isVintedUrl, readVintedListing, titleFromVintedUrl } from "@/lib/vinted";

const fieldsSchema = z.object({
  title: z.string().min(0).max(160).default("Article Vinted a analyser"),
  description: z.string().min(0).max(5000).default("Analyse demandee a partir des infos fournies."),
  sellerPrice: z.coerce.number().positive().max(10000).default(1),
  brand: z.string().max(80).optional().nullable(),
  size: z.string().max(40).optional().nullable(),
  condition: z.string().max(80).optional().nullable(),
  productCorrection: z.string().max(180).optional().nullable(),
  vintedUrl: z.string().optional().nullable()
});

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
      productCorrection: form.get("productCorrection") || undefined,
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

    const scraped = await readVintedListing(parsed.data.vintedUrl);
    const urlTitle = titleFromVintedUrl(parsed.data.vintedUrl);
    const correctedProduct = parsed.data.productCorrection?.trim();
    const mergedTitle = correctedProduct || scraped?.title || (parsed.data.title === "Article Vinted a analyser" ? urlTitle : parsed.data.title) || urlTitle || "Article Vinted a analyser";
    const mergedDescription = [correctedProduct ? `Correction utilisateur sur le produit exact: ${correctedProduct}` : "", scraped?.description, parsed.data.description, scraped?.rawText ? `Infos Vinted lues: ${scraped.rawText.slice(0, 1200)}` : ""]
      .filter(Boolean)
      .join("\n\n")
      .trim() || "Analyse demandee a partir des infos fournies.";
    const mergedBrand = parsed.data.brand || scraped?.brand || undefined;
    const mergedPrice = scraped?.sellerPrice || parsed.data.sellerPrice;
    const mergedCondition = parsed.data.condition || scraped?.condition || undefined;

    const result = await runListingAnalysis({
      title: mergedTitle,
      description: mergedDescription,
      sellerPrice: mergedPrice,
      brand: mergedBrand,
      size: parsed.data.size || undefined,
      condition: mergedCondition,
      vintedUrl: parsed.data.vintedUrl || undefined,
      photoCount: images.length,
      images,
      sourceListing: scraped
    });

    return NextResponse.json({ result, poweredBy: provider });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Analyse impossible.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
