"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Camera, Check, Clipboard, Coins, Loader2, PackageCheck, Shirt, Timer, Upload, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, euros } from "@/lib/utils";

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
  marketResearch?: {
    retailPrice: number;
    usedPriceLow: number;
    usedPriceHigh: number;
    comparableCount: number;
    confidence: "faible" | "moyenne" | "haute";
    reason: string;
  };
};

type VenteResponse = {
  listing?: GeneratedListing;
  needsDetails?: boolean;
  message?: string;
  questions?: string[];
};

const clothingWords = ["pull", "veste", "nike", "ralph", "lacoste", "adidas", "carhartt", "stone", "moncler", "jean", "pantalon", "sweat", "hoodie", "tshirt", "shirt", "polo", "manteau", "robe", "chaussure", "sneaker", "casquette", "bonnet", "short"];
const objectWords = ["ps5", "ps4", "xbox", "switch", "nintendo", "manette", "jeu", "game", "pokemon", "fifa", "zelda", "mario", "console", "carte", "telephone", "iphone", "samsung", "casque", "montre", "sac", "livre", "lego", "figurine", "appareil", "camera", "clavier", "souris", "ecouteurs", "airpods", "bijou", "lunettes"];

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
}

function hashText(value: string) {
  return value.split("").reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) % 997, 11);
}

function detectKind(file: File, title: string): ProductKind {
  const text = normalize(`${file.name} ${title}`);
  if (clothingWords.some((word) => text.includes(word))) return "vetement";
  if (objectWords.some((word) => text.includes(word))) return "objet";
  return "vetement";
}

function kindLabel(kind: ProductKind) {
  if (kind === "vetement") return "Vetement";
  return "Objet reconnaissable";
}

function makePrice(kind: ProductKind, seed: number, hasProblem: boolean) {
  const base = kind === "vetement" ? 34 : 39;
  const demandBoost = kind === "vetement" ? 9 : 10;
  return Math.max(12, base + (seed % 31) + demandBoost - (hasProblem ? 8 : 0));
}

function makeDelay(kind: ProductKind, hasProblem: boolean, seed: number) {
  if (hasProblem) return kind === "objet" ? "5 a 12 jours" : "5 a 10 jours";
  if (kind === "objet") return seed % 2 === 0 ? "2 a 5 jours" : "3 a 7 jours";
  if (kind === "vetement") return seed % 2 === 0 ? "3 a 7 jours" : "4 a 9 jours";
  return "4 a 10 jours";
}

function buildListing(file: File, problem: string, fallbackTitle: string): GeneratedListing {
  const firstTitle = fallbackTitle.trim() || "Produit a vendre";
  const kind = detectKind(file, firstTitle);
  const title = fallbackTitle.trim() || (kind === "objet" ? "Objet a identifier" : "Vetement a identifier");
  const seed = hashText(`${file.name}-${problem}-${title}`);
  const hasProblem = problem.trim().length > 0;
  const price = makePrice(kind, seed, hasProblem);
  const fastPrice = Math.max(10, Math.round(price * 0.86));
  const highPrice = Math.round(price * 1.18);

  const clothingAngles = ["style facile a porter", "photo claire", "couleur simple a vendre", "piece utile dans une garde-robe"];
  const objectAngles = ["objet identifiable", "prix accessible", "achat simple", "envoi rapide", "bon produit si complet et propre"];
  const sellingAngles = kind === "vetement" ? clothingAngles : objectAngles;

  const potentialProblems = kind === "vetement"
    ? ["tache", "trou", "bouloches", "couture fatiguee", "taille mal indiquee", "usure col/manches"]
    : ["rayures", "piece manquante", "etat mal visible", "accessoire absent", "fonctionnement non teste"];

  const defects = hasProblem ? [problem.trim()] : ["Aucun probleme signale, mais verifier les points possibles ci-dessous"];
  const keywords = Array.from(new Set([
    title,
    kindLabel(kind),
    kind === "vetement" ? "bon etat" : "objet reconnaissable",
    kind === "vetement" ? "style" : "fonctionnel",
    "envoi rapide",
    hasProblem ? "defaut indique" : "pret a vendre"
  ])).slice(0, 8);

  const description = kind === "vetement"
    ? [
        `${title} en bon etat general.`,
        "Piece facile a porter, propre visuellement et ideale pour completer une tenue sans payer le prix fort.",
        hasProblem ? `Point a signaler : ${problem.trim()}.` : "Aucun probleme particulier signale sur la photo.",
        "La photo montre l'etat reel du produit. Envoi rapide et soigne."
      ].join("\n\n")
    : [
        `${title} disponible.`,
        "Objet reconnaissable, proprement presente et simple a comprendre pour l'acheteur.",
        hasProblem ? `Point a signaler : ${problem.trim()}.` : "Aucun probleme particulier signale sur la photo.",
        "A verifier selon l'objet : etat visible, fonctionnement, accessoires et pieces manquantes. Envoi rapide et soigne."
      ].join("\n\n");

  return {
    kind,
    kindLabel: kindLabel(kind),
    title,
    price,
    fastPrice,
    highPrice,
    expectedDelay: makeDelay(kind, hasProblem, seed),
    description,
    defects,
    potentialProblems,
    keywords,
    sellingAngles,
    checklist: [
      "Mettre cette photo en premiere image",
      kind === "vetement" ? "Ajouter la taille dans le titre si tu la connais" : "Preciser si l'objet est complet et fonctionne",
      hasProblem ? "Laisser le probleme visible dans l'annonce pour eviter les litiges" : "Ne pas inventer de defaut si tu n'en vois pas",
      `Publier a ${euros(price)}`,
      `Baisser vers ${euros(fastPrice)} si ca ne part pas`
    ]
  };
}

export function CellForm({ initialProduct = "" }: { initialProduct?: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [problem, setProblem] = useState("");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [listing, setListing] = useState<GeneratedListing | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [questions, setQuestions] = useState<string[]>([]);
  const [needsDetails, setNeedsDetails] = useState(false);

  const preview = useMemo(() => file ? { name: file.name, url: URL.createObjectURL(file) } : null, [file]);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview.url);
    };
  }, [preview]);

  async function createListing() {
    if (!file) {
      setError("Ajoute une photo du produit.");
      return;
    }

    setLoading(true);
    setCopied(false);
    setError("");
    setQuestions([]);
    setNeedsDetails(false);

    try {
      const body = new FormData();
      body.append("photo", file);
      body.append("problem", problem);
      body.append("details", details || initialProduct);

      const response = await fetch("/api/vente", { method: "POST", body });
      const data = await response.json() as VenteResponse;
      await sleep(800);

      if (!response.ok) throw new Error(data.message || "Analyse impossible.");
      if (data.needsDetails || !data.listing) {
        setNeedsDetails(true);
        setQuestions(data.questions || ["Marque ?", "Taille ?", "Etat exact ?"]);
        setError(data.message || "Je vois le produit, mais il manque des infos pour faire une vraie annonce.");
        setLoading(false);
        return;
      }

      setListing(data.listing);
    } catch (caught) {
      setNeedsDetails(true);
      setQuestions(["Quelle est la marque ?", "C'est quoi exactement : pull, veste, pantalon, console, jeu ?", "Taille et etat ?"]);
      setError(caught instanceof Error ? caught.message : "Je n'arrive pas a lire assez bien la photo.");
    }

    setLoading(false);
  }

  async function copyListing() {
    if (!listing) return;
    await navigator.clipboard.writeText(`${listing.title}\n\nPrix conseille : ${euros(listing.price)}\n\n${listing.description}`);
    setCopied(true);
  }

  return (
    <div className="mt-8 grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
      <section className="grid content-start gap-5 rounded-lg border border-white/10 bg-panel p-5 shadow-glow">
        <label className="grid min-h-[320px] cursor-pointer place-items-center gap-4 rounded-md border border-dashed border-accent/35 bg-accent/[0.05] p-5 text-center transition hover:border-accent">
          {preview ? (
              <span className="grid w-full gap-4">
                <span className="mx-auto aspect-square w-full max-w-72 overflow-hidden rounded-md border border-white/10 bg-white/[0.04]">
                  <img src={preview.url} alt={preview.name} className="h-full w-full object-cover" />
                </span>
              <span className="text-sm font-semibold text-white">Photo importee</span>
              <span className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-white/10 px-4 text-sm font-bold text-white">
                <Upload size={17} />
                Changer la photo
              </span>
            </span>
          ) : (
            <span className="grid gap-4">
              <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-accent/15 text-accent">
                <Camera size={36} />
              </span>
              <span>
                <span className="block text-lg font-bold text-white">Photo du produit</span>
                <span className="mt-2 block text-sm leading-6 text-muted">Mets un vetement ou un objet reconnaissable. Par defaut, Vente traite la photo comme un vetement.</span>
              </span>
              <span className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-accent px-5 text-sm font-bold text-ink">
                <Upload size={17} />
                Importer une photo
              </span>
            </span>
          )}
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(event) => {
              setFile(event.currentTarget.files?.[0] || null);
              setListing(null);
              setQuestions([]);
              setNeedsDetails(false);
              setError("");
            }}
          />
        </label>

        <label className="grid gap-2 rounded-md border border-white/10 bg-white/[0.03] p-4">
          <span className="flex items-center gap-2 text-sm font-bold text-white">
            <AlertTriangle size={16} className="text-accent" />
            Probleme a souligner
          </span>
          <textarea
            value={problem}
            onChange={(event) => setProblem(event.target.value)}
            rows={3}
            className="rounded-md border border-white/10 bg-white/5 px-3 py-3 outline-none focus:border-accent"
            placeholder="Ex: petite tache, couture fatiguee, boite manquante, objet non teste... Laisse vide s'il n'y a rien."
          />
        </label>

        {needsDetails && (
          <label className="grid gap-2 rounded-md border border-accent/25 bg-accent/[0.05] p-4">
            <span className="text-sm font-bold text-white">Infos manquantes pour faire une vraie annonce</span>
            <textarea
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              rows={3}
              className="rounded-md border border-white/10 bg-white/5 px-3 py-3 outline-none focus:border-accent"
              placeholder="Ex: Ralph Lauren, pull homme taille M, bon etat, coton, pas de trou..."
            />
            {questions.length > 0 && (
              <ul className="grid gap-1 text-xs leading-5 text-muted">
                {questions.map((question) => <li key={question}>- {question}</li>)}
              </ul>
            )}
          </label>
        )}

        {error && <p className="rounded-md bg-rose-500/10 p-3 text-sm text-rose-200">{error}</p>}

        <Button type="button" disabled={loading} onClick={createListing} className="w-full">
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 size={18} className="animate-spin" />
              Creation de la fiche...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Wand2 size={18} />
              Faire toute la fiche de vente
            </span>
          )}
        </Button>
      </section>

      <section className="grid content-start gap-4">
        {loading && (
          <div className="rounded-lg border border-accent/20 bg-panel p-8 text-center shadow-glow">
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-full border border-accent/30 bg-accent/10">
              <Loader2 size={38} className="animate-spin text-accent" />
            </div>
            <h2 className="mt-5 text-2xl font-semibold">Fiche en creation</h2>
            <p className="mt-3 text-sm leading-6 text-muted">Vente lit la photo, cherche les prix comparables, puis prepare le prix et l'annonce.</p>
          </div>
        )}

        {!loading && !listing && (
          <div className="rounded-lg border border-white/10 bg-panel p-8 text-muted">
            Ajoute une photo de vetement ou d'objet reconnaissable. Si Vente hesite, il traite la photo comme un vetement.
          </div>
        )}

        {listing && !loading && (
          <>
            <div className="rounded-lg border border-accent/25 bg-panel p-5 shadow-glow">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="flex items-center gap-2 text-sm font-bold text-accent">
                    {listing.kind === "vetement" ? <Shirt size={16} /> : <PackageCheck size={16} />}
                    Type detecte : {listing.kindLabel}
                  </p>
                  <h2 className="mt-2 text-2xl font-bold">{listing.title}</h2>
                </div>
                <button
                  type="button"
                  onClick={copyListing}
                  className={cn(
                    "inline-flex h-11 items-center gap-2 rounded-md px-4 text-sm font-bold transition",
                    copied ? "bg-accent text-ink" : "border border-white/15 bg-white/10 text-white hover:bg-white/15"
                  )}
                >
                  {copied ? <Check size={17} /> : <Clipboard size={17} />}
                  {copied ? "Copie" : "Copier"}
                </button>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-4">
                <Metric icon={<Coins size={18} />} label="Prix conseille" value={euros(listing.price)} highlight />
                <Metric label="Prix pour partir vite" value={euros(listing.fastPrice)} />
                <Metric label="Prix ambitieux" value={euros(listing.highPrice)} />
                <Metric icon={<Timer size={18} />} label="Vente estimee" value={listing.expectedDelay} />
              </div>
            </div>

            {listing.marketResearch && (
              <div className="rounded-lg border border-white/10 bg-panel p-5">
                <h3 className="text-xl font-semibold">Recherche prix</h3>
                <div className="mt-4 grid gap-3 md:grid-cols-4">
                  <Metric label="Prix neuf estime" value={euros(listing.marketResearch.retailPrice)} />
                  <Metric label="Occasion bas" value={euros(listing.marketResearch.usedPriceLow)} />
                  <Metric label="Occasion haut" value={euros(listing.marketResearch.usedPriceHigh)} />
                  <Metric label="Comparables" value={`${listing.marketResearch.comparableCount}`} />
                </div>
                <p className="mt-3 text-sm leading-6 text-muted">{listing.marketResearch.reason}</p>
              </div>
            )}

            <div className="rounded-lg border border-white/10 bg-panel p-5">
              <h3 className="text-xl font-semibold">Description persuasive</h3>
              <pre className="mt-4 whitespace-pre-wrap rounded-md bg-white/[0.04] p-4 text-sm leading-7 text-slate-200">{listing.description}</pre>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <InfoBlock title="Arguments pour convaincre" items={listing.sellingAngles} />
              <InfoBlock title="Problemes potentiels a verifier" items={listing.potentialProblems} />
              <InfoBlock title="Problemes indiques" items={listing.defects} />
              <InfoBlock title="Mots-cles" items={listing.keywords} />
            </div>
            <InfoBlock title="Avant de poster" items={listing.checklist} />
          </>
        )}
      </section>
    </div>
  );
}

function Metric({ label, value, icon, highlight = false }: { label: string; value: string; icon?: React.ReactNode; highlight?: boolean }) {
  return (
    <div className={cn("rounded-md border p-3", highlight ? "border-accent/25 bg-accent/10" : "border-white/10 bg-white/[0.04]")}>
      <p className="flex items-center gap-2 text-xs text-muted">{icon}{label}</p>
      <p className={cn("mt-1 text-lg font-bold", highlight ? "text-accent" : "text-white")}>{value}</p>
    </div>
  );
}

function InfoBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-lg border border-white/10 bg-panel p-5">
      <h3 className="text-lg font-semibold">{title}</h3>
      <ul className="mt-3 grid gap-2 text-sm leading-6 text-slate-300">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <Check size={16} className="mt-1 shrink-0 text-accent" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
