"use client";

import { useEffect, useState } from "react";
import { Camera, FileText, Link2, Loader2, Sparkles, Upload } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { detectListingWarnings, warningPenalty } from "@/lib/listing-risk";
import type { AnalysisResult } from "@/lib/types";
import { cn, euros } from "@/lib/utils";
import { ScoreCard } from "./score-card";
import { Button } from "./ui/button";

type AnalyzeMode = "link" | "photo" | "manual";
type Precision = "haute" | "moyenne" | "basse";

const marketProfiles = [
  { match: ["5090", "rtx5090", "rtx 5090", "geforce 5090"], brand: "NVIDIA GeForce RTX 5090", category: "Carte graphique", retail: 2300, vinted: 2600, demand: 9.8 },
  { match: ["4090", "rtx4090", "rtx 4090", "geforce 4090"], brand: "NVIDIA GeForce RTX 4090", category: "Carte graphique", retail: 1750, vinted: 1450, demand: 9.3 },
  { match: ["5080", "rtx5080", "rtx 5080"], brand: "NVIDIA GeForce RTX 5080", category: "Carte graphique", retail: 1150, vinted: 1050, demand: 8.7 },
  { match: ["iphone 15", "iphone15"], brand: "Apple iPhone 15", category: "Smartphone", retail: 749, vinted: 520, demand: 8.2 },
  { match: ["ralph", "lauren", "polo"], brand: "Ralph Lauren", category: "Pull / maille", retail: 149, vinted: 42, demand: 8.4 },
  { match: ["lacoste"], brand: "Lacoste", category: "Pull / polo", retail: 120, vinted: 38, demand: 7.7 },
  { match: ["carhartt", "detroit"], brand: "Carhartt", category: "Veste workwear", retail: 159, vinted: 78, demand: 9.1 },
  { match: ["acg"], brand: "Nike ACG", category: "Outdoor vintage", retail: 130, vinted: 62, demand: 9.2 },
  { match: ["nike"], brand: "Nike", category: "Sportswear", retail: 75, vinted: 34, demand: 8.1 },
  { match: ["adidas"], brand: "Adidas", category: "Sportswear vintage", retail: 85, vinted: 34, demand: 7.9 },
  { match: ["levis", "levi", "501"], brand: "Levi's", category: "Denim", retail: 110, vinted: 46, demand: 8.1 },
  { match: ["stone", "island"], brand: "Stone Island", category: "Premium streetwear", retail: 260, vinted: 145, demand: 8.8 },
  { match: ["arcteryx", "arc", "teryx"], brand: "Arc'teryx", category: "Outdoor technique", retail: 320, vinted: 170, demand: 9.4 }
];

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function readJsonResponse(response: Response) {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(response.ok ? "Reponse du serveur illisible." : "Le serveur n'a pas renvoye une reponse lisible.");
  }
}

function isDemoSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  return url.includes("example.supabase.co") || key === "demo-key";
}

function isVintedUrl(value: string) {
  if (!value) return true;
  try {
    const host = new URL(value).hostname.toLowerCase();
    return host === "vinted.fr" || host.endsWith(".vinted.fr") || host === "vinted.com" || host.endsWith(".vinted.com");
  } catch {
    return false;
  }
}

function hashText(value: string) {
  return value.split("").reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) % 997, 7);
}

function textFromForm(formData: FormData) {
  const raw = [
    formData.get("vintedUrl"),
    formData.get("title"),
    formData.get("description"),
    formData.get("brand"),
    formData.get("condition")
  ].filter(Boolean).join(" ");

  return decodeURIComponent(String(raw)).toLowerCase().replace(/[-_/]+/g, " ");
}

function extractPriceFromText(text: string) {
  const euroMatch = text.match(/(?:prix|price|eur|€)\s*[:\-]?\s*(\d{2,5})|(\d{2,5})\s*(?:eur|€)/i);
  if (!euroMatch) return 0;
  return Number(euroMatch[1] || euroMatch[2] || 0);
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

function priceScoreFromMarket(price: number, marketPrice: number) {
  const ratio = price / Math.max(marketPrice, 1);
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
  if (/short|bermuda/.test(text)) return "Short";
  if (/t[\s-]?shirt|tee shirt|tee|debardeur|débardeur/.test(text)) return "T-shirt / haut leger";
  if (/polo/.test(text)) return "Polo";
  if (/sweat|hoodie|pull|maille/.test(text)) return "Pull / sweat";
  if (/veste|jacket|manteau|doudoune|parka/.test(text)) return "Veste";
  if (/chaussure|sneaker|basket|air max|jordan|samba/.test(text)) return "Sneakers";
  if (/casquette|bonnet|sac|accessoire/.test(text)) return "Accessoire";
  return "";
}

function calibrateMarketProfile(profile: typeof marketProfiles[number], text: string, seed: number) {
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

function detectMarketProfile(formData: FormData) {
  const text = textFromForm(formData);
  const found = marketProfiles.find((profile) => profile.match.some((word) => text.includes(word)));
  const seed = hashText(text);

  if (found) {
    return {
      ...calibrateMarketProfile(found, text, seed),
      text
    };
  }

  const genericCategory = productCategoryFromText(text);
  if (genericCategory === "Short") {
    return { brand: String(formData.get("brand") || "Marque non precisee"), category: "Short", retail: 35, vinted: 18, demand: 6.8, text };
  }
  if (genericCategory === "T-shirt / haut leger") {
    return { brand: String(formData.get("brand") || "Marque non precisee"), category: genericCategory, retail: 25, vinted: 12, demand: 6.2, text };
  }
  if (genericCategory === "Polo") {
    return { brand: String(formData.get("brand") || "Marque non precisee"), category: "Polo", retail: 35, vinted: 18, demand: 6.5, text };
  }

  return {
    brand: String(formData.get("brand") || "Marque non precisee"),
    category: text.includes("pull") ? "Pull / maille" : text.includes("veste") ? "Veste" : "Article vintage",
    retail: 85 + (seed % 45),
    vinted: 24 + (seed % 28),
    demand: 6.2 + ((seed % 20) / 10),
    text
  };
}

function demandLabel(score: number): "faible" | "moyenne" | "forte" | "très forte" {
  if (score >= 9) return "très forte";
  if (score >= 7.6) return "forte";
  if (score >= 6) return "moyenne";
  return "faible";
}

function demoResult(formData: FormData, precision: Precision): AnalysisResult {
  const market = detectMarketProfile(formData);
  const title = String(formData.get("title") || `${market.brand} ${market.category}`);
  const brand = String(formData.get("brand") || market.brand);
  const condition = String(formData.get("condition") || "").toLowerCase();
  const hasSellerPrice = Number(formData.get("sellerPrice")) > 0;
  const extractedPrice = extractPriceFromText(market.text);
  const price = hasSellerPrice ? Number(formData.get("sellerPrice")) : extractedPrice || Math.round(market.vinted * 0.72);
  const resale = Math.round(market.vinted * (precision === "haute" ? 1.08 : precision === "moyenne" ? 1 : 0.92));
  const margin = resale - price;
  const priceScore = priceScoreFromMarket(price, market.vinted);
  const demandScore = Math.max(1, Math.min(10, market.demand));
  const marginScore = Math.max(2, Math.min(10, 5 + (margin / Math.max(price, 1)) * 3));
  const conditionScore = conditionScoreFromText([condition, String(formData.get("description") || ""), String(formData.get("title") || "")].join(" "));
  const suspiciousDiscount = price < market.vinted * 0.35;
  const categoryRisk = market.category === "Carte graphique" ? 1.2 : 0;
  const riskScore = Math.max(2, Math.min(9.8, 8.5 - demandScore * 0.35 - marginScore * 0.2 + (precision === "basse" ? 1.2 : 0) + categoryRisk + (suspiciousDiscount ? 3.2 : 0)));
  const listingWarnings = detectListingWarnings(market.text);
  const penalty = warningPenalty(listingWarnings);
  const adjustedRiskScore = Math.max(2, Math.min(10, riskScore + penalty));
  const adjustedConditionScore = Math.max(1, conditionScore - penalty * 0.75);
  const hasCriticalWarning = listingWarnings.some((warning) => warning.severity === "critical");
  const score = Number(Math.max(1.5, Math.min(9.6, priceScore * 0.25 + demandScore * 0.2 + marginScore * 0.3 + adjustedConditionScore * 0.1 + (10 - adjustedRiskScore) * 0.15)).toFixed(1));

  const result: AnalysisResult = {
    globalScore: score,
    priceScore: Number(priceScore.toFixed(1)),
    conditionScore: Number(adjustedConditionScore.toFixed(1)),
    demandScore: Number(demandScore.toFixed(1)),
    resalePotentialScore: Number(((demandScore + marginScore) / 2).toFixed(1)),
    marginScore: Number(marginScore.toFixed(1)),
    riskScore: Number(adjustedRiskScore.toFixed(1)),
    maxBuyPrice: Math.max(1, Math.round(resale * 0.62)),
    recommendedResalePrice: resale,
    priceRange: { low: Math.round(resale * 0.85), medium: resale, high: Math.round(resale * 1.15) },
    estimatedMargin: margin,
    decision: suspiciousDiscount ? "Négocier" : score >= 8 ? "Acheter" : score >= 6 ? "Négocier" : "Éviter",
    summary: suspiciousDiscount
      ? `${brand} détecté. Prix neuf estimé autour de ${market.retail} €, reconditionné/occasion autour de ${market.vinted} €. À ${price} €, la marge est énorme si c'est authentique, mais le prix est anormalement bas : vérification obligatoire avant achat.`
      : `${brand} détecté. Prix neuf estimé autour de ${market.retail} €, comparables Vinted autour de ${market.vinted} €. ${hasSellerPrice || extractedPrice ? "Prix vendeur pris en compte." : "Prix vendeur estimé faute de prix exact dans le lien."}`,
    market: {
      detectedBrand: brand,
      detectedCategory: market.category,
      retailPriceEstimate: market.retail,
      vintedComparablePrice: market.vinted,
      demandLevel: demandLabel(demandScore),
      conditionImpact: suspiciousDiscount
        ? "Risque élevé : prix très inférieur au marché. Demande facture, photos réelles, test vidéo, numéro de série et privilégie remise en main propre."
        : condition ? `État pris en compte : ${condition}.` : "État non lu dans le lien : ajoute une capture ou une description pour affiner."
    },
    basis: {
      comparableListings: Math.round(22 + demandScore * 5 + (precision === "haute" ? 14 : precision === "moyenne" ? 6 : 0)),
      confidence: precision === "basse" ? "faible" : precision,
      sources: precision === "haute"
        ? ["lien Vinted validé", "marque détectée", "prix neuf estimé", "prix reconditionné/occasion", "demande marché", "écart de prix"]
        : precision === "moyenne"
          ? ["photo/capture fournie", "prix visible", "marque/catégorie", "demande du style"]
          : ["titre manuel", "description", "prix vendeur", "mots-clés de demande"]
    },
    negotiationTips: [
      suspiciousDiscount ? "Ne paie pas à distance sans preuve solide : facture, test vidéo daté et numéro de série." : `Essaie de négocier sous ${Math.max(1, Math.round(resale * 0.55))} € pour garder une marge correcte.`,
      market.category === "Carte graphique" ? "Demander captures GPU-Z, benchmark, facture, état des connecteurs et vidéo de fonctionnement." : "Demander une photo de l'étiquette, des défauts et de la matière.",
      `Comparer avec des ${market.category.toLowerCase()} similaires avant achat.`
    ],
    optimizedTitle: `${brand ? `${brand} ` : ""}${title}`.trim(),
    optimizedDescription: "Annonce optimisée : ajoute les mesures, l'état réel, les défauts visibles, la marque, la taille et les mots-clés recherchés.",
    disclaimer: "Ces résultats sont des estimations, pas des garanties de revente ou de marge."
  };

  if (listingWarnings.length > 0) {
    result.listingWarnings = listingWarnings;
    result.conditionScore = Number(adjustedConditionScore.toFixed(1));
    result.riskScore = Number(adjustedRiskScore.toFixed(1));
    result.decision = hasCriticalWarning ? "Éviter" : result.decision;
    result.summary = hasCriticalWarning
      ? `${brand} détecté. Le texte de l'annonce contient des alertes fortes (${listingWarnings.map((warning) => warning.label.toLowerCase()).join(", ")}). Meme si le prix semble interessant, l'achat est trop risque sans preuves solides et test complet.`
      : `${result.summary} Attention : le texte vendeur contient ${listingWarnings.map((warning) => warning.label.toLowerCase()).join(", ")}.`;
    if (result.market) {
      result.market.conditionImpact = `Texte vendeur analysé : ${listingWarnings.map((warning) => warning.label).join(", ")}. L'état doit être considéré risqué tant que le vendeur ne fournit pas de preuve.`;
    }
    result.negotiationTips = [
      hasCriticalWarning ? "Si le texte parle de panne, pieces manquantes ou produit non complet, traite l'annonce comme achat pour pieces uniquement." : "Demande des preuves claires sur le point risque avant de negocier.",
      ...result.negotiationTips
    ];
  }

  return result;
}

export function AnalyzeForm({
  initialResult,
  canAnalyze,
  demoMode = false
}: {
  initialResult: AnalysisResult | null;
  canAnalyze: boolean;
  demoMode?: boolean;
}) {
  const [mode, setMode] = useState<AnalyzeMode>("link");
  const [result, setResult] = useState<AnalysisResult | null>(initialResult);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [aiReady, setAiReady] = useState(false);
  const [aiProvider, setAiProvider] = useState<"openai" | "gemini" | "fallback">("fallback");

  useEffect(() => {
    fetch("/api/ai/status", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        setAiReady(Boolean(data.aiEnabled));
        setAiProvider(data.provider || "fallback");
      })
      .catch(() => {
        setAiReady(false);
        setAiProvider("fallback");
      });
  }, []);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setError("");
    setResult(null);
    const startedAt = Date.now();

    try {
      const vintedUrl = String(formData.get("vintedUrl") || "").trim();
      const productPhotos = formData.getAll("photos").filter((item): item is File => item instanceof File && item.size > 0);
      const screenshots = formData.getAll("screenshots").filter((item): item is File => item instanceof File && item.size > 0);
      const hasManualInfo = Boolean(formData.get("title")) && Number(formData.get("sellerPrice")) > 0;

      if (mode === "link" && !vintedUrl) throw new Error("Colle un lien Vinted pour lancer l'analyse.");
      if (vintedUrl && !isVintedUrl(vintedUrl)) throw new Error("Le lien doit venir de Vinted. Sinon choisis Photo/Capture ou Manuel.");
      if (mode === "photo" && productPhotos.length === 0 && screenshots.length === 0) throw new Error("Ajoute une photo du produit ou une capture de l'annonce.");
      if (mode === "manual" && !hasManualInfo) throw new Error("Ajoute au minimum un titre et un prix vendeur.");

      const precision: Precision = mode === "link" ? "haute" : mode === "photo" ? "moyenne" : "basse";

      if ((demoMode || isDemoSupabase()) && aiReady) {
        const response = await fetch("/api/analyze-gemini", {
          method: "POST",
          body: formData
        });

        await sleep(Math.max(0, 3000 - (Date.now() - startedAt)));
        const json = await readJsonResponse(response);
        if (!response.ok) throw new Error(json.error || "Analyse IA impossible.");
        setResult(json.result);
        return;
      }

      if (demoMode || isDemoSupabase()) {
        await sleep(Math.max(0, 3200 - (Date.now() - startedAt)));
        setResult(demoResult(formData, precision));
        return;
      }

      const supabase = createSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      const files = [...productPhotos, ...screenshots];
      const photoUrls: string[] = [];

      if (user) {
        for (const file of files) {
          const path = `${user.id}/${crypto.randomUUID()}-${file.name}`;
          const { error: uploadError } = await supabase.storage.from("analysis-images").upload(path, file, { upsert: false });
          if (!uploadError) {
            const { data } = supabase.storage.from("analysis-images").getPublicUrl(path);
            photoUrls.push(data.publicUrl);
          }
        }
      }

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.get("title") || "Article Vinted à analyser",
          description: formData.get("description") || "Analyse demandée à partir du lien, des photos ou de la capture fournie.",
          sellerPrice: Number(formData.get("sellerPrice") || 1),
          brand: formData.get("brand"),
          size: formData.get("size"),
          condition: formData.get("condition"),
          vintedUrl,
          photoUrls
        })
      });

      await sleep(Math.max(0, 3000 - (Date.now() - startedAt)));
      const json = await readJsonResponse(response);
      if (!response.ok) throw new Error(json.error || "Analyse impossible.");
      setResult(json.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <form action={onSubmit} className="grid gap-5 rounded-lg border border-white/10 bg-panel p-5">
        <div className={`rounded-md border p-3 text-sm ${aiReady ? "border-accent/25 bg-accent/10 text-accent" : "border-white/10 bg-white/[0.03] text-muted"}`}>
          <span className="flex items-center gap-2 font-semibold">
            <Sparkles size={16} />
            {aiReady ? `${aiProvider === "openai" ? "OpenAI" : "Gemini"} actif : analyse approfondie, avec secours interne si le réseau bloque` : "IA non configurée : estimation interne de démonstration"}
          </span>
        </div>

        <div>
          <p className="text-sm font-semibold text-white">Choisis ta méthode d'analyse</p>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <ModeButton active={mode === "link"} icon={<Link2 size={18} />} title="Lien Vinted" text="Le plus précis" onClick={() => setMode("link")} />
            <ModeButton active={mode === "photo"} icon={<Camera size={18} />} title="Photo / capture" text="Précision moyenne" onClick={() => setMode("photo")} />
            <ModeButton active={mode === "manual"} icon={<FileText size={18} />} title="Manuel" text="Moins précis" onClick={() => setMode("manual")} />
          </div>
        </div>

        {mode === "link" && (
          <section className="grid gap-4 rounded-md border border-white/10 bg-white/[0.03] p-4">
            <Field label="Lien Vinted" name="vintedUrl" type="url" placeholder="https://www.vinted.fr/items/..." required />
            <Field label="Prix affiché sur l'annonce (€)" name="sellerPrice" type="number" min="1" step="0.01" placeholder="ex: 150" />
            <label className="grid gap-2">
              <span className="text-sm text-muted">Texte/commentaire de l'annonce</span>
              <textarea name="description" rows={5} placeholder="Colle ici la description Vinted : panne, accessoires, facture, pieces manquantes, etat reel..." className="rounded-md border border-white/10 bg-white/5 px-3 py-3 outline-none focus:border-accent" />
            </label>
            <p className="text-sm leading-6 text-muted">Le lien sert à détecter l'objet et la marque. Le texte vendeur sert à repérer les pannes, pièces manquantes, accessoires seuls et signaux risqués.</p>
          </section>
        )}

        {mode === "photo" && (
          <section className="grid gap-4 rounded-md border border-white/10 bg-white/[0.03] p-4">
            <FilePicker name="photos" label="Photo du produit" icon={<Camera size={16} />} />
            <FilePicker name="screenshots" label="Capture d'écran de l'annonce" icon={<Upload size={16} />} />
            <p className="rounded-md border border-white/10 bg-white/[0.04] p-3 text-sm leading-6 text-muted">
              Précision moyenne : la capture doit montrer le prix, le titre et les photos de l'annonce.
            </p>
            <ManualDetails />
          </section>
        )}

        {mode === "manual" && (
          <section className="grid gap-4 rounded-md border border-white/10 bg-white/[0.03] p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-amber-400/15 px-3 py-1 text-xs font-semibold text-amber-200">Moins précis</span>
              <p className="text-sm text-muted">Sans lien ni capture, l'analyse se base seulement sur ce que tu écris.</p>
            </div>
            <ManualDetails required />
          </section>
        )}

        {error && <p className="rounded-md bg-rose-500/10 p-3 text-sm text-rose-200">{error}</p>}
        {!canAnalyze && <p className="rounded-md bg-amber-500/10 p-3 text-sm text-amber-100">Quota atteint. Passe sur un plan supérieur ou reviens demain selon ton plan.</p>}
        <Button disabled={loading || !canAnalyze} className="w-full">
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 size={18} className="animate-spin" />
              Analyse en cours...
            </span>
          ) : (
            "Analyser l'annonce"
          )}
        </Button>
      </form>

      <div className="grid content-start gap-4">
        {loading ? (
          <LoadingPanel />
        ) : result ? (
          <>
            <ScoreCard result={result} />
            <section className="rounded-lg border border-white/10 bg-panel p-5">
              <h2 className="text-xl font-semibold">Commentaire</h2>
              <p className="mt-3 leading-7 text-slate-300">{result.summary}</p>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <Small label="Basse" value={euros(result.priceRange.low)} />
                <Small label="Moyenne" value={euros(result.priceRange.medium)} />
                <Small label="Haute" value={euros(result.priceRange.high)} />
              </div>
            </section>
            <section className="rounded-lg border border-white/10 bg-panel p-5">
              <h2 className="text-xl font-semibold">Conseils de négociation</h2>
              <ul className="mt-3 grid gap-2 text-sm text-slate-300">
                {result.negotiationTips.map((tip) => <li key={tip}>• {tip}</li>)}
              </ul>
            </section>
          </>
        ) : (
          <div className="rounded-lg border border-white/10 bg-panel p-8 text-muted">Choisis une méthode, lance l'analyse, puis le score apparaîtra ici.</div>
        )}
      </div>
    </div>
  );
}

function ModeButton({ active, icon, title, text, onClick }: { active: boolean; icon: React.ReactNode; title: string; text: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "min-h-28 rounded-md border p-4 text-left transition",
        active ? "border-accent bg-accent/10 shadow-[0_0_30px_rgba(74,222,128,0.14)]" : "border-white/10 bg-white/[0.03] hover:border-white/25"
      )}
    >
      <span className={cn("flex h-9 w-9 items-center justify-center rounded-md", active ? "bg-accent text-ink" : "bg-white/10 text-white")}>{icon}</span>
      <span className="mt-3 block font-semibold text-white">{title}</span>
      <span className="mt-1 block text-xs text-muted">{text}</span>
    </button>
  );
}

function ManualDetails({ required = false }: { required?: boolean }) {
  return (
    <>
      <Field label="Titre de l'annonce ou du produit" name="title" required={required} />
      <label className="grid gap-2">
        <span className="text-sm text-muted">Description ou infos utiles</span>
        <textarea name="description" rows={4} className="rounded-md border border-white/10 bg-white/5 px-3 py-3 outline-none focus:border-accent" />
      </label>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Prix vendeur (€)" name="sellerPrice" type="number" min="1" step="0.01" required={required} />
        <Field label="Marque" name="brand" />
        <Field label="Taille" name="size" />
        <Field label="État" name="condition" />
      </div>
    </>
  );
}

function FilePicker({ name, label, icon }: { name: string; label: string; icon: React.ReactNode }) {
  return (
    <label className="grid gap-3 rounded-md border border-dashed border-white/15 bg-white/[0.03] p-4">
      <span className="flex items-center gap-2 text-sm font-medium text-white">{icon}{label}</span>
      <span className="inline-flex h-11 max-w-full items-center justify-center rounded-md bg-white/10 px-4 text-sm font-semibold text-white">
        Sélectionner un fichier
      </span>
      <input name={name} type="file" accept="image/*" multiple className="sr-only" />
      <span className="text-xs leading-5 text-muted">Image JPG, PNG ou capture lisible. Le nom du fichier ne déborde pas dans la case.</span>
    </label>
  );
}

function LoadingPanel() {
  return (
    <div className="rounded-lg border border-accent/20 bg-panel p-8 text-center shadow-glow">
      <div className="mx-auto grid h-20 w-20 place-items-center rounded-full border border-accent/30 bg-accent/10">
        <Loader2 size={38} className="animate-spin text-accent" />
      </div>
      <h2 className="mt-5 text-2xl font-semibold">Analyse en cours</h2>
      <p className="mt-3 text-sm leading-6 text-muted">ResellScore vérifie la marque, la catégorie, l'état, le prix marché prudent, la marge et le risque.</p>
      <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full w-2/3 animate-pulse rounded-full bg-accent" />
      </div>
    </div>
  );
}

function Field({ label, name, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; name: string }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm text-muted">{label}</span>
      <input name={name} className="rounded-md border border-white/10 bg-white/5 px-3 py-3 outline-none focus:border-accent" {...props} />
    </label>
  );
}

function Small({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-white/[0.04] p-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}


