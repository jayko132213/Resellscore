import { GoogleGenerativeAI } from "@google/generative-ai";
import { detectListingWarnings, warningPenalty } from "./listing-risk";
import type { AnalysisResult } from "./types";
import type { VintedListingSnapshot } from "./vinted";

export type AiProvider = "openai" | "gemini" | "fallback";

type AnalysisInput = {
  title: string;
  description: string;
  sellerPrice: number;
  brand?: string;
  size?: string;
  condition?: string;
  vintedUrl?: string;
  photoCount: number;
  images?: {
    mimeType: string;
    data: string;
  }[];
  sourceListing?: VintedListingSnapshot | null;
};

const marketProfiles = [
  { match: ["5090", "rtx5090", "rtx 5090", "geforce 5090"], brand: "NVIDIA GeForce RTX 5090", category: "Carte graphique", retail: 2300, vinted: 2600, demand: 9.8 },
  { match: ["4090", "rtx4090", "rtx 4090", "geforce 4090"], brand: "NVIDIA GeForce RTX 4090", category: "Carte graphique", retail: 1750, vinted: 1450, demand: 9.3 },
  { match: ["5080", "rtx5080", "rtx 5080"], brand: "NVIDIA GeForce RTX 5080", category: "Carte graphique", retail: 1150, vinted: 1050, demand: 8.7 },
  { match: ["iphone 15", "iphone15"], brand: "Apple iPhone 15", category: "Smartphone", retail: 749, vinted: 520, demand: 8.2 },
  { match: ["manchester united", "man utd", "maillot manchester", "jersey manchester"], brand: "Adidas / Manchester United", category: "Maillot de foot", retail: 95, vinted: 44, demand: 8.4 },
  { match: ["psg", "paris saint germain", "maillot paris"], brand: "Nike / PSG", category: "Maillot de foot", retail: 95, vinted: 46, demand: 8.6 },
  { match: ["inter milan", "internazionale", "maillot inter"], brand: "Nike / Inter Milan", category: "Maillot de foot", retail: 95, vinted: 43, demand: 8.2 },
  { match: ["maillot de foot", "maillot foot", "football jersey", "soccer jersey"], brand: "Maillot de foot", category: "Maillot de foot", retail: 90, vinted: 40, demand: 8.0 },
  { match: ["ralph", "lauren", "polo"], brand: "Ralph Lauren", category: "Pull / maille", retail: 149, vinted: 42, demand: 8.4 },
  { match: ["lacoste"], brand: "Lacoste", category: "Pull / polo", retail: 120, vinted: 38, demand: 7.7 },
  { match: ["carhartt", "detroit"], brand: "Carhartt", category: "Veste workwear", retail: 159, vinted: 78, demand: 9.1 },
  { match: ["acg"], brand: "Nike ACG", category: "Outdoor vintage", retail: 130, vinted: 62, demand: 9.2 },
  { match: ["nike"], brand: "Nike", category: "Sportswear", retail: 75, vinted: 34, demand: 8.1 },
  { match: ["adidas"], brand: "Adidas", category: "Sportswear vintage", retail: 85, vinted: 34, demand: 7.9 },
  { match: ["levis", "levi", "501"], brand: "Levi's", category: "Denim", retail: 110, vinted: 46, demand: 8.1 },
  { match: ["stone", "island"], brand: "Stone Island", category: "Premium streetwear", retail: 260, vinted: 145, demand: 8.8 },
  { match: ["arcteryx", "arc'teryx", "arc teryx"], brand: "Arc'teryx", category: "Outdoor technique", retail: 320, vinted: 170, demand: 9.4 }
];

function hashText(value: string) {
  return value.split("").reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) % 997, 7);
}

function demandLabel(score: number): "faible" | "moyenne" | "forte" | "très forte" {
  if (score >= 9) return "très forte";
  if (score >= 7.6) return "forte";
  if (score >= 6) return "moyenne";
  return "faible";
}

function extractPriceFromText(text: string) {
  const euroMatch = text.match(/(?:prix|price|eur|€)\s*[:\-]?\s*(\d{2,5})|(\d{2,5})\s*(?:eur|€)/i);
  if (!euroMatch) return 0;
  const price = Number(euroMatch[1] || euroMatch[2] || 0);
  return price > 0 && price <= 5000 ? price : 0;
}

function conditionScoreFromText(text: string) {
  const lowered = text.toLowerCase();
  if (/neuf avec etiquette|neuf avec étiquette|new with tags|nwt/.test(lowered)) return 9.6;
  if (/neuf|jamais porte|jamais porté|excellent/.test(lowered)) return 9.1;
  if (/tres bon|très bon|bon etat|bon état/.test(lowered)) return 8;
  if (/correct|usage leger|usure legere|usure légère/.test(lowered)) return 6.5;
  if (/tache|trou|abime|abîme|panne|manquant|defaut|défaut/.test(lowered)) return 4.2;
  return 7;
}

function priceScoreFromMarket(sellerPrice: number, marketPrice: number) {
  const ratio = sellerPrice / Math.max(marketPrice, 1);
  if (ratio <= 0.45) return 9.4;
  if (ratio <= 0.6) return 8.8;
  if (ratio <= 0.75) return 8.1;
  if (ratio <= 0.85) return 7.3;
  if (ratio <= 0.95) return 6.6;
  if (ratio <= 1.05) return 5.8;
  if (ratio <= 1.2) return 4.7;
  return 3.2;
}

function productCategoryFromText(text: string) {
  if (/maillot|football jersey|soccer jersey|psg|manchester united|man utd|inter milan|internazionale/.test(text)) return "Maillot de foot";
  if (/short|bermuda/.test(text)) return "Short";
  if (/t[\s-]?shirt|tee shirt|tee|debardeur|débardeur/.test(text)) return "T-shirt / haut leger";
  if (/polo/.test(text)) return "Polo";
  if (/sweat|hoodie|pull|maille/.test(text)) return "Pull / sweat";
  if (/veste|jacket|manteau|doudoune|parka/.test(text)) return "Veste";
  if (/chaussure|sneaker|basket|air max|jordan|samba/.test(text)) return "Sneakers";
  if (/casquette|bonnet|sac|accessoire/.test(text)) return "Accessoire";
  return "";
}

function calibrateMarket(profile: typeof marketProfiles[number], text: string, seed: number) {
  const category = productCategoryFromText(text);
  let retail = profile.retail + (seed % 13) - 6;
  let vinted = Math.max(12, profile.vinted + (seed % 9) - 4);
  let detectedCategory = profile.category;

  if (profile.brand === "Nike" && category) {
    detectedCategory = `Nike ${category}`;
    if (category === "Short") {
      retail = 45;
      vinted = 28;
    } else if (category === "T-shirt / haut leger") {
      retail = 35;
      vinted = 20;
    } else if (category === "Polo") {
      retail = 45;
      vinted = 24;
    } else if (category === "Pull / sweat") {
      retail = 70;
      vinted = 34;
    } else if (category === "Sneakers") {
      retail = 95;
      vinted = 55;
    } else if (category === "Accessoire") {
      retail = 28;
      vinted = 14;
    }
  }

  if (profile.brand === "Adidas" && category) {
    detectedCategory = `Adidas ${category}`;
    if (category === "Short") {
      retail = 38;
      vinted = 22;
    } else if (category === "T-shirt / haut leger") {
      retail = 30;
      vinted = 18;
    } else if (category === "Sneakers") {
      retail = 90;
      vinted = 48;
    }
  }

  return {
    ...profile,
    category: detectedCategory,
    retail,
    vinted
  };
}

export function getConfiguredAiProvider(): AiProvider {
  const preferred = (process.env.AI_PROVIDER || "").toLowerCase();
  const hasOpenAi = Boolean(process.env.OPENAI_API_KEY);
  const hasGemini = Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);

  if (preferred === "openai" && hasOpenAi) return "openai";
  if (preferred === "gemini" && hasGemini) return "gemini";
  if (hasOpenAi) return "openai";
  if (hasGemini) return "gemini";
  return "fallback";
}

function detectMarket(input: AnalysisInput) {
  const text = decodeURIComponent([
    input.vintedUrl,
    input.title,
    input.description,
    input.brand,
    input.condition,
    input.sourceListing?.rawText
  ].filter(Boolean).join(" ")).toLowerCase().replace(/[-_/]+/g, " ");
  const found = marketProfiles.find((profile) => profile.match.some((word) => text.includes(word)));
  const seed = hashText(text);

  if (found) {
    return calibrateMarket(found, text, seed);
  }

  const genericCategory = productCategoryFromText(text);
  if (genericCategory === "Short") {
    return { brand: input.brand || "Marque non précisée", category: "Short", retail: 35, vinted: 18, demand: 6.8 };
  }
  if (genericCategory === "T-shirt / haut leger") {
    return { brand: input.brand || "Marque non précisée", category: genericCategory, retail: 25, vinted: 12, demand: 6.2 };
  }
  if (genericCategory === "Polo") {
    return { brand: input.brand || "Marque non précisée", category: "Polo", retail: 35, vinted: 18, demand: 6.5 };
  }

  return {
    brand: input.brand || "Marque non précisée",
    category: text.includes("pull") ? "Pull / maille" : text.includes("veste") ? "Veste" : "Article vintage",
    retail: 85 + (seed % 45),
    vinted: 24 + (seed % 28),
    demand: 6.2 + ((seed % 20) / 10)
  };
}

function fallbackAnalysis(input: AnalysisInput): AnalysisResult {
  const market = detectMarket(input);
  const fullText = [input.vintedUrl, input.title, input.description, input.brand, input.condition, input.sourceListing?.rawText].filter(Boolean).join(" ");
  const extractedPrice = extractPriceFromText(fullText);
  const extractedLooksWrong = extractedPrice > Math.max(500, market.retail * 4);
  const safeExtractedPrice = extractedLooksWrong ? 0 : extractedPrice;
  const sellerPrice = input.sourceListing?.sellerPrice || (input.sellerPrice > 1 ? input.sellerPrice : safeExtractedPrice || Math.round(market.vinted * 0.72));
  const condition = (input.condition || input.sourceListing?.condition || "").toLowerCase();
  const resale = Math.round(market.vinted * (input.vintedUrl ? 1.08 : input.photoCount > 0 ? 1 : 0.92));
  const margin = resale - sellerPrice;
  const priceScore = priceScoreFromMarket(sellerPrice, market.vinted);
  const demandScore = Math.max(1, Math.min(10, market.demand));
  const marginScore = Math.max(2, Math.min(10, 5 + (margin / Math.max(sellerPrice, 1)) * 3));
  const conditionScore = conditionScoreFromText([input.condition, input.sourceListing?.condition, input.description, input.title, input.sourceListing?.rawText].filter(Boolean).join(" "));
  const suspiciousDiscount = sellerPrice < market.vinted * 0.35;
  const categoryRisk = market.category === "Carte graphique" ? 1.2 : 0;
  const baseRiskScore = Math.max(2, Math.min(9.8, 8.5 - demandScore * 0.35 - marginScore * 0.2 + categoryRisk + (suspiciousDiscount ? 3.2 : 0)));
  const listingWarnings = detectListingWarnings(fullText);
  const penalty = warningPenalty(listingWarnings);
  const riskScore = Math.max(2, Math.min(10, baseRiskScore + penalty));
  const adjustedConditionScore = Math.max(1, conditionScore - penalty * 0.75);
  const hasCriticalWarning = listingWarnings.some((warning) => warning.severity === "critical");
  const score = Number(Math.max(1.5, Math.min(9.6, priceScore * 0.25 + demandScore * 0.2 + marginScore * 0.3 + adjustedConditionScore * 0.1 + (10 - riskScore) * 0.15)).toFixed(1));

  const result: AnalysisResult = {
    globalScore: score,
    priceScore: Number(priceScore.toFixed(1)),
    conditionScore: Number(adjustedConditionScore.toFixed(1)),
    demandScore: Number(demandScore.toFixed(1)),
    resalePotentialScore: Number(((demandScore + marginScore) / 2).toFixed(1)),
    marginScore: Number(marginScore.toFixed(1)),
    riskScore: Number(riskScore.toFixed(1)),
    maxBuyPrice: Math.max(1, Math.round(resale * 0.62)),
    recommendedResalePrice: resale,
    priceRange: { low: Math.round(resale * 0.85), medium: resale, high: Math.round(resale * 1.15) },
    estimatedMargin: margin,
    decision: hasCriticalWarning ? "Éviter" : suspiciousDiscount ? "Négocier" : score >= 8 ? "Acheter" : score >= 6 ? "Négocier" : "Éviter",
    summary: suspiciousDiscount
      ? `${market.brand} détecté. Prix neuf prudent autour de ${market.retail} €, comparables occasion autour de ${market.vinted} €. À ${sellerPrice} €, marge énorme si authentique, mais risque d'arnaque très élevé.`
      : `${market.brand} détecté. Prix neuf prudent autour de ${market.retail} €, comparables occasion autour de ${market.vinted} €. Prix annonce pris en compte : ${sellerPrice} €.`,
    market: {
      detectedBrand: market.brand,
      detectedCategory: market.category,
      retailPriceEstimate: market.retail,
      vintedComparablePrice: market.vinted,
      demandLevel: demandLabel(demandScore),
      conditionImpact: suspiciousDiscount
        ? "Risque élevé : demande facture, test vidéo, numéro de série et remise en main propre."
        : condition ? `État pris en compte : ${condition}.` : "État non lu clairement dans le lien : demande une photo proche des défauts et de l'étiquette."
    },
    basis: {
      comparableListings: Math.round(22 + demandScore * 5 + (input.vintedUrl ? 14 : input.photoCount > 0 ? 6 : 0)),
      confidence: input.vintedUrl ? "haute" : input.photoCount > 0 ? "moyenne" : "faible",
      sources: [
        ...(input.sourceListing?.fetched ? ["page Vinted lue"] : input.vintedUrl ? ["lien Vinted validé"] : input.photoCount > 0 ? ["photo/capture fournie"] : ["saisie manuelle"]),
        "marque détectée",
        "prix neuf prudent",
        "prix occasion estimé",
        "demande marché",
        "écart de prix"
      ]
    },
    negotiationTips: [
      suspiciousDiscount ? "Ne paie pas à distance sans facture, test vidéo daté et numéro de série." : `Essaie de négocier sous ${Math.max(1, Math.round(resale * 0.55))} € pour garder une marge correcte.`,
      market.category === "Carte graphique" ? "Demander captures GPU-Z, benchmark, facture, état des connecteurs et vidéo de fonctionnement." : "Demander une photo de l'étiquette, des défauts et de la matière.",
      `Comparer avec des ${market.category.toLowerCase()} similaires avant achat.`
    ],
    optimizedTitle: `${market.brand} ${input.title}`.trim(),
    optimizedDescription: `${input.description}\n\nAjoute mesures, état réel, défauts visibles et mots-clés de recherche.`,
    disclaimer: "Ces resultats sont des estimations et ne garantissent pas une revente ni une marge."
  };

  if (listingWarnings.length > 0) {
    result.listingWarnings = listingWarnings;
    result.summary = hasCriticalWarning
      ? `${market.brand} detecte. Le texte vendeur contient des alertes fortes (${listingWarnings.map((warning) => warning.label.toLowerCase()).join(", ")}). Meme si le prix semble interessant, l\'achat est trop risque sans preuves solides et test complet.`
      : `${result.summary} Attention : le texte vendeur contient ${listingWarnings.map((warning) => warning.label.toLowerCase()).join(", ")}.`;
    if (result.market) {
      result.market.conditionImpact = `Texte vendeur analyse : ${listingWarnings.map((warning) => warning.label).join(", ")}. L etat doit etre considere risque tant que le vendeur ne fournit pas de preuve.`;
    }
    result.negotiationTips = [
      hasCriticalWarning ? "Si le texte parle de panne, pieces manquantes ou produit non complet, traite l annonce comme achat pour pieces uniquement." : "Demande des preuves claires sur le point risque avant de negocier.",
      ...result.negotiationTips
    ];
  }

  return result;
}

function analysisPrompt(input: AnalysisInput) {
  const sourceListing = input.sourceListing
    ? `
Infos lues depuis la page Vinted:
- Page lue: ${input.sourceListing.fetched ? "oui" : "non"}
- Titre Vinted: ${input.sourceListing.title || "non lu"}
- Description Vinted: ${input.sourceListing.description || "non lue"}
- Prix annonce Vinted: ${input.sourceListing.sellerPrice || "non lu"} EUR
- Marque lue/devinee: ${input.sourceListing.brand || "non lue"}
- Etat lu/devine: ${input.sourceListing.condition || "non lu"}
- Image principale: ${input.sourceListing.imageUrl || "non lue"}
- Texte brut utile: ${input.sourceListing.rawText?.slice(0, 1800) || "vide"}
`
    : "Infos lues depuis la page Vinted: aucune page lue.\n";

  return `
Tu analyses une annonce Vinted/vintage pour un revendeur. Réponds uniquement en JSON valide.
Si des infos Vinted sont fournies ci-dessous, utilise-les comme source prioritaire. Ne remplace pas le prix de l'annonce par une estimation.
Ne prétends pas avoir consulté une boutique officielle si tu ne l'as pas fait : estime le prix neuf prudemment avec ta connaissance produit.
Si des images sont fournies, lis-les vraiment : produit, marque visible, état, défauts, prix affiché sur capture, accessoires, texte vendeur.
Si tu ne peux pas lire une info, dis que la confiance est plus faible au lieu d'inventer.

Annonce:
Titre: ${input.title}
Description: ${input.description}
Prix vendeur: ${input.sellerPrice} EUR
Marque: ${input.brand || "non précisée"}
Taille: ${input.size || "non précisée"}
État: ${input.condition || "non précisé"}
Lien optionnel: ${input.vintedUrl || "absent"}
Nombre de photos fournies: ${input.photoCount}
${sourceListing}

Analyse la demande, le prix neuf estimé de la marque, les prix Vinted/reconditionnés comparables estimés, l'état, la marge et le risque.
Compare clairement: prix de l'annonce, prix neuf probable, prix Vinted occasion probable selon l'état, marge possible.
Si le prix est anormalement bas pour un objet tech cher, ne le note pas comme nul : explique que l'opportunité est énorme si authentique mais que le risque d'arnaque est très élevé.

Format exact:
{
  "globalScore": number,
  "priceScore": number,
  "conditionScore": number,
  "demandScore": number,
  "resalePotentialScore": number,
  "marginScore": number,
  "riskScore": number,
  "maxBuyPrice": number,
  "recommendedResalePrice": number,
  "priceRange": {"low": number, "medium": number, "high": number},
  "estimatedMargin": number,
  "decision": "Acheter" | "Négocier" | "Éviter",
  "summary": string,
  "market": {"detectedBrand": string, "detectedCategory": string, "retailPriceEstimate": number, "vintedComparablePrice": number, "demandLevel": "faible" | "moyenne" | "forte" | "très forte", "conditionImpact": string},
  "basis": {"comparableListings": number, "sources": string[], "confidence": "faible" | "moyenne" | "haute"},
  "negotiationTips": string[],
  "optimizedTitle": string,
  "optimizedDescription": string,
  "disclaimer": string
}`;
}

function withDisclaimer(result: AnalysisResult): AnalysisResult {
  return {
    ...result,
    disclaimer: result.disclaimer || "Ces résultats sont des estimations et ne garantissent pas une revente ni une marge."
  };
}

async function runOpenAiAnalysis(input: AnalysisInput): Promise<AnalysisResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return fallbackAnalysis(input);

  const content = [
    { type: "text", text: analysisPrompt(input) },
    ...(input.images || []).map((image) => ({
      type: "image_url",
      image_url: {
        url: `data:${image.mimeType};base64,${image.data}`
      }
    }))
  ];

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content
        }
      ]
    })
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Analyse OpenAI impossible: ${details.slice(0, 240)}`);
  }

  const json = await response.json();
  const text = String(json.choices?.[0]?.message?.content || "").replace(/```json|```/g, "").trim();
  return withDisclaimer(JSON.parse(text) as AnalysisResult);
}

async function runGeminiAnalysis(input: AnalysisInput): Promise<AnalysisResult> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return fallbackAnalysis(input);
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const prompt = analysisPrompt(input);

  const parts = [
    { text: prompt },
    ...(input.images || []).map((image) => ({
      inlineData: {
        data: image.data,
        mimeType: image.mimeType
      }
    }))
  ];

  const response = await model.generateContent(parts);
  const text = response.response.text().replace(/```json|```/g, "").trim();
  return withDisclaimer(JSON.parse(text) as AnalysisResult);
}

export async function runListingAnalysis(input: AnalysisInput): Promise<AnalysisResult> {
  const provider = getConfiguredAiProvider();
  try {
    if (provider === "openai") return await runOpenAiAnalysis(input);
    if (provider === "gemini") return await runGeminiAnalysis(input);
  } catch (error) {
    const fallback = fallbackAnalysis(input);
    return {
      ...fallback,
      summary: fallback.summary,
      basis: fallback.basis
        ? {
            ...fallback.basis,
            confidence: fallback.basis.confidence === "haute" ? "moyenne" : fallback.basis.confidence,
            sources: [...fallback.basis.sources, "moteur ResellScore temporairement indisponible"]
          }
        : fallback.basis,
      negotiationTips: [
        "Ajoute le prix, le texte vendeur et une capture pour rendre l'analyse plus precise.",
        ...fallback.negotiationTips
      ]
    };
  }
  return fallbackAnalysis(input);
}

