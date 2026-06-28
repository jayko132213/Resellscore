import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

type ProductKind = "vetement" | "objet";

type GeneratedListing = {
  kind: ProductKind;
  kindLabel: string;
  title: string;
  price: number;
  fastPrice: number;
  highPrice: number;
  expectedDelay: string;
  description: string;
  defects: string[];
  potentialProblems: string[];
  keywords: string[];
  checklist: string[];
  sellingAngles: string[];
  marketResearch: {
    retailPrice: number;
    usedPriceLow: number;
    usedPriceHigh: number;
    comparableCount: number;
    confidence: "faible" | "moyenne" | "haute";
    reason: string;
  };
};

function cleanJson(text: string) {
  return text.replace(/```json|```/g, "").trim();
}

function normalizeListing(value: GeneratedListing): GeneratedListing {
  const kind = value.kind === "objet" ? "objet" : "vetement";
  const price = Math.max(1, Math.round(Number(value.price) || 20));

  return {
    kind,
    kindLabel: kind === "vetement" ? "Vetement" : "Objet reconnaissable",
    title: String(value.title || (kind === "vetement" ? "Vetement a vendre" : "Objet a vendre")).slice(0, 90),
    price,
    fastPrice: Math.max(1, Math.round(Number(value.fastPrice) || price * 0.88)),
    highPrice: Math.max(price, Math.round(Number(value.highPrice) || price * 1.15)),
    expectedDelay: String(value.expectedDelay || "3 a 10 jours"),
    description: String(value.description || "").slice(0, 1800),
    defects: Array.isArray(value.defects) ? value.defects.slice(0, 6).map(String) : [],
    potentialProblems: Array.isArray(value.potentialProblems) ? value.potentialProblems.slice(0, 8).map(String) : [],
    keywords: Array.isArray(value.keywords) ? value.keywords.slice(0, 10).map(String) : [],
    checklist: Array.isArray(value.checklist) ? value.checklist.slice(0, 8).map(String) : [],
    sellingAngles: Array.isArray(value.sellingAngles) ? value.sellingAngles.slice(0, 8).map(String) : [],
    marketResearch: {
      retailPrice: Math.max(1, Math.round(Number(value.marketResearch?.retailPrice) || price * 2.3)),
      usedPriceLow: Math.max(1, Math.round(Number(value.marketResearch?.usedPriceLow) || price * 0.8)),
      usedPriceHigh: Math.max(price, Math.round(Number(value.marketResearch?.usedPriceHigh) || price * 1.25)),
      comparableCount: Math.max(3, Math.round(Number(value.marketResearch?.comparableCount) || 18)),
      confidence: value.marketResearch?.confidence === "haute" || value.marketResearch?.confidence === "moyenne" ? value.marketResearch.confidence : "faible",
      reason: String(value.marketResearch?.reason || "Prix estime avec prudence a partir du type de produit, de la marque visible et de l'etat indique.")
    }
  };
}

export async function POST(request: Request) {
  const form = await request.formData();
  const photo = form.get("photo");
  const problem = String(form.get("problem") || "");
  const details = String(form.get("details") || "");

  if (!(photo instanceof File)) {
    return NextResponse.json({ message: "Ajoute une photo du produit." }, { status: 400 });
  }

  if (!photo.type.startsWith("image/")) {
    return NextResponse.json({ message: "Le fichier doit etre une image." }, { status: 400 });
  }

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({
      needsDetails: true,
      message: "Je peux faire l'annonce, mais pour chercher un vrai prix il me faut au moins la marque et le type du produit.",
      questions: ["Quelle est la marque ?", "C'est quel produit exactement ?", "Taille, etat et defaut visible ?"]
    });
  }

  const bytes = Buffer.from(await photo.arrayBuffer());
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
Tu es l'outil Vente de ResellScore. Tu dois aider un revendeur a creer une annonce Vinted apres achat.
Lis vraiment la photo. N'utilise JAMAIS le nom du fichier comme titre, marque ou modele.

Objectif:
- Identifier si c'est un vetement ou un objet reconnaissable.
- Si la marque, le modele ou le type exact ne sont pas visibles et que les details utilisateur ne compensent pas, ne cree PAS d'annonce. Demande les infos manquantes.
- Si c'est reconnaissable, cree une fiche de vente complete.
- Estime les prix comme si tu comparais a des annonces Vinted/eBay/occasion similaires et au prix neuf habituel. Tu n'as pas le droit de dire que tu as scrape une page en direct.
- Le prix conseille doit etre realiste pour vendre, pas un chiffre random.
- Signale les problemes possibles sans inventer des defauts certains.

Infos utilisateur:
Probleme signale: ${problem || "aucun"}
Details en plus: ${details || "aucun"}

Reponds seulement en JSON valide:
{
  "needsDetails": boolean,
  "message": string,
  "questions": string[],
  "listing": {
    "kind": "vetement" | "objet",
    "kindLabel": string,
    "title": string,
    "price": number,
    "fastPrice": number,
    "highPrice": number,
    "expectedDelay": string,
    "description": string,
    "defects": string[],
    "potentialProblems": string[],
    "keywords": string[],
    "checklist": string[],
    "sellingAngles": string[],
    "marketResearch": {
      "retailPrice": number,
      "usedPriceLow": number,
      "usedPriceHigh": number,
      "comparableCount": number,
      "confidence": "faible" | "moyenne" | "haute",
      "reason": string
    }
  }
}`;

  try {
    const response = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: bytes.toString("base64"),
          mimeType: photo.type
        }
      }
    ]);
    const parsed = JSON.parse(cleanJson(response.response.text())) as {
      needsDetails?: boolean;
      message?: string;
      questions?: string[];
      listing?: GeneratedListing;
    };

    if (parsed.needsDetails || !parsed.listing) {
      return NextResponse.json({
        needsDetails: true,
        message: parsed.message || "Je vois le produit, mais pas assez d'infos pour faire un prix fiable.",
        questions: parsed.questions?.length ? parsed.questions : ["Marque ?", "Type exact ?", "Taille/etat ?"]
      });
    }

    return NextResponse.json({ listing: normalizeListing(parsed.listing) });
  } catch {
    return NextResponse.json({
      needsDetails: true,
      message: "Je n'arrive pas a reconnaitre assez bien le produit sur cette photo. Ajoute la marque/type pour que je fasse le vrai prix.",
      questions: ["Quelle est la marque ?", "C'est quel produit exactement ?", "Taille, etat et defaut visible ?"]
    });
  }
}
