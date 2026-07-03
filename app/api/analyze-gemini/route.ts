import { NextResponse } from "next/server";
import { z } from "zod";
import { extractListingFromImages, getConfiguredAiProvider, runListingAnalysis } from "@/lib/ai";
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

    const files = [...form.getAll("photos"), ...form.getAll("screenshots")]
      .filter((item): item is File => item instanceof File && item.size > 0 && item.type.startsWith("image/"))
      .slice(0, 4);

    const hasVintedUrl = Boolean(parsed.data.vintedUrl);
    if (hasVintedUrl && !isVintedUrl(parsed.data.vintedUrl)) {
      return NextResponse.json({ error: "Le lien doit venir de Vinted." }, { status: 400 });
    }
    if (!hasVintedUrl && files.length === 0) {
      return NextResponse.json({ error: "Ajoute un lien Vinted ou une capture d'annonce complete." }, { status: 400 });
    }

    const images = await Promise.all(files.map(async (file) => ({
      mimeType: file.type,
      data: Buffer.from(await file.arrayBuffer()).toString("base64")
    })));

    const hasScreenshotMode = files.length > 0 && !hasVintedUrl;
    let visualProductGuess = "";
    let visualTitle = "";
    let visualDescription = "";
    let visualBrand = "";
    let visualSize = "";
    let visualCondition = "";
    let visualPrice = 0;

    if (hasScreenshotMode) {
      const visualListing = await extractListingFromImages(images);
      visualProductGuess = visualListing.productGuess || "";
      visualTitle = visualListing.title || "";
      visualDescription = visualListing.description || "";
      visualBrand = visualListing.brand || "";
      visualSize = visualListing.size || "";
      visualCondition = visualListing.condition || "";
      visualPrice = Number(visualListing.sellerPrice || 0);

      if (!visualListing.valid) {
        return NextResponse.json({
          error: `Capture refusee : ce n'est pas une annonce Vinted/marketplace exploitable. ${visualListing.reason || "Envoie une capture complete ou l'on voit le produit, le prix, le titre et le texte de l'annonce."}`
        }, { status: 422 });
      }
    }

    const scraped = hasVintedUrl ? await readVintedListing(parsed.data.vintedUrl) : null;
    const urlTitle = hasVintedUrl ? titleFromVintedUrl(parsed.data.vintedUrl) : "";
    const correctedProduct = parsed.data.productCorrection?.trim();
    const formProduct = parsed.data.title !== "Article Vinted a analyser" && parsed.data.title !== "Article Vinted a analyser" ? parsed.data.title : "";
    const mergedTitle = correctedProduct || formProduct || visualTitle || visualProductGuess || scraped?.title || urlTitle || "Article Vinted a analyser";
    const mergedDescription = [
      visualProductGuess ? `Lecture capture: produit probable ${visualProductGuess}` : "",
      visualDescription ? `Texte lu sur la capture: ${visualDescription}` : "",
      correctedProduct ? `Correction utilisateur sur le produit exact: ${correctedProduct}` : "",
      !correctedProduct && formProduct ? `Produit confirme par l'utilisateur: ${formProduct}` : "",
      scraped?.description,
      parsed.data.description,
      scraped?.rawText ? `Infos Vinted lues: ${scraped.rawText.slice(0, 1200)}` : ""
    ]
      .filter(Boolean)
      .join("\n\n")
      .trim() || "Analyse demandee a partir des infos fournies.";
    const mergedBrand = parsed.data.brand || visualBrand || scraped?.brand || undefined;
    const mergedPrice = visualPrice || scraped?.sellerPrice || parsed.data.sellerPrice;
    const mergedCondition = parsed.data.condition || visualCondition || scraped?.condition || undefined;

    const result = await runListingAnalysis({
      title: mergedTitle,
      description: mergedDescription,
      sellerPrice: mergedPrice,
      brand: mergedBrand,
      size: parsed.data.size || visualSize || undefined,
      condition: mergedCondition,
      vintedUrl: parsed.data.vintedUrl || undefined,
      photoCount: images.length,
      images,
      sourceListing: scraped
    }, { allowFallback: !hasScreenshotMode });

    if (hasScreenshotMode && /capture_invalide/i.test(result.summary || "")) {
      return NextResponse.json({
        error: "Capture refusee : ce n'est pas une annonce Vinted/marketplace exploitable. Envoie une capture complete ou l'on voit le produit, le prix, le titre et le texte de l'annonce."
      }, { status: 422 });
    }

    return NextResponse.json({ result, poweredBy: provider });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Analyse impossible.";
    if (/quota|billing|insufficient_quota|exceeded/i.test(message)) {
      return NextResponse.json({
        error: "Le moteur IA du site n'a plus de quota OpenAI pour le moment. Ton abonnement ResellScore est bien actif, mais il faut recharger/configurer la facturation OpenAI du site."
      }, { status: 503 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
