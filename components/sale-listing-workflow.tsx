"use client";

import { useMemo, useState } from "react";
import { Camera, Check, Clipboard, Euro, ImagePlus, Loader2, PackageCheck, Sparkles, Upload, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, euros } from "@/lib/utils";

type SalePlan = {
  title: string;
  price: number;
  fastPrice: number;
  tryPrice: number;
  description: string;
  photoOrder: string[];
  strengths: string[];
  warnings: string[];
  checklist: string[];
  tags: string[];
};

function numberValue(value: string) {
  return Number(value.replace(",", ".")) || 0;
}

function marketPrice(brand: string, category: string, condition: string, wantedPrice: number) {
  const text = `${brand} ${category}`.toLowerCase();
  let base = 30;

  if (text.includes("ralph")) base = text.includes("pull") ? 48 : 38;
  else if (text.includes("lacoste")) base = 36;
  else if (text.includes("carhartt")) base = text.includes("veste") ? 85 : 42;
  else if (text.includes("stone island")) base = text.includes("veste") ? 170 : 120;
  else if (text.includes("arc")) base = text.includes("veste") ? 180 : 95;
  else if (text.includes("nike")) base = text.includes("chauss") || text.includes("sneaker") ? 55 : 34;
  else if (text.includes("adidas")) base = text.includes("chauss") || text.includes("sneaker") ? 45 : 30;
  else if (text.includes("levi")) base = text.includes("jean") ? 45 : 35;
  else if (text.includes("moncler")) base = text.includes("veste") ? 260 : 120;
  else if (text.includes("pull")) base = 32;
  else if (text.includes("veste") || text.includes("manteau")) base = 52;
  else if (text.includes("chauss") || text.includes("sneaker")) base = 42;

  const loweredCondition = condition.toLowerCase();
  if (loweredCondition.includes("neuf")) base *= 1.18;
  if (loweredCondition.includes("excellent")) base *= 1.1;
  if (loweredCondition.includes("bon")) base *= 1;
  if (loweredCondition.includes("correct") || loweredCondition.includes("us")) base *= 0.82;
  if (loweredCondition.includes("defaut") || loweredCondition.includes("tache") || loweredCondition.includes("trou")) base *= 0.7;

  const realistic = Math.max(6, Math.round(base));
  return wantedPrice > 0 ? Math.round(realistic * 0.7 + wantedPrice * 0.3) : realistic;
}

function buildSalePlan(data: {
  brand: string;
  category: string;
  size: string;
  material: string;
  condition: string;
  defects: string;
  measurements: string;
  wantedPrice: string;
  notes: string;
  photoCount: number;
}): SalePlan {
  const brand = data.brand.trim();
  const category = data.category.trim() || "Article";
  const size = data.size.trim();
  const condition = data.condition.trim() || "bon état";
  const wantedPrice = numberValue(data.wantedPrice);
  const price = marketPrice(brand, category, condition + " " + data.defects, wantedPrice);
  const fastPrice = Math.max(5, Math.round(price * 0.88));
  const tryPrice = Math.round(price * 1.15);
  const hasDefects = data.defects.trim().length > 0;
  const title = [brand, category, size && `taille ${size}`].filter(Boolean).join(" ").slice(0, 90) || "Article à vendre";

  return {
    title,
    price,
    fastPrice,
    tryPrice,
    description: [
      `${title} disponible, prêt à être envoyé rapidement.`,
      brand ? `C'est une pièce ${brand} facile à porter et simple à intégrer dans une tenue.` : "Pièce simple à porter, avec un style facile à vendre et à associer.",
      `État : ${condition}. ${hasDefects ? `Défaut(s) à signaler : ${data.defects.trim()}.` : "Aucun défaut important à signaler."}`,
      size ? `Taille : ${size}.` : "Taille à vérifier sur les photos ou à demander si besoin.",
      data.material.trim() ? `Matière / composition : ${data.material.trim()}.` : "",
      data.measurements.trim() ? `Mesures : ${data.measurements.trim()}.` : "",
      data.notes.trim() ? `Détail utile : ${data.notes.trim()}.` : "",
      "Les photos montrent l'état réel du produit. Envoi rapide et soigné."
    ].filter(Boolean).join("\n\n"),
    photoOrder: [
      "Photo 1 : vue complète du produit, bien éclairée",
      "Photo 2 : logo ou détail principal",
      "Photo 3 : étiquette marque / taille",
      hasDefects ? "Photo 4 : défaut visible en gros plan" : "Photo 4 : matière, coupe ou détail vendeur",
      "Dernière photo : porté, plié proprement ou mise en situation"
    ].slice(0, Math.max(3, Math.min(5, data.photoCount || 5))),
    strengths: [
      brand ? `Marque ${brand} à mettre en avant` : "Annonce claire même sans marque premium",
      `Prix conseillé cohérent : ${euros(price)}`,
      size ? `Taille indiquée : ${size}` : "Ajouter la taille augmente la confiance",
      data.material.trim() ? "Matière précisée, plus rassurant pour l'acheteur" : "Ajouter la matière si visible sur l'étiquette"
    ],
    warnings: [
      hasDefects ? "Montrer le défaut en photo pour éviter les litiges" : "Vérifier une dernière fois taches, trous, usure col/manches/semelles",
      wantedPrice > price * 1.25 ? "Prix voulu au-dessus du marché : risque de vente lente" : "Prix cohérent pour une vente normale",
      data.photoCount < 3 ? "Ajoute au moins 3 photos pour vendre plus vite" : "Photos suffisantes si elles sont nettes"
    ],
    checklist: [
      `Poster à ${euros(price)}`,
      `Essayer ${euros(tryPrice)} si tu veux tenter plus haut`,
      `Baisser vers ${euros(fastPrice)} si ça ne part pas`,
      "Mettre les photos dans l'ordre recommandé",
      "Ne pas cacher les défauts"
    ],
    tags: [brand, category, size, condition, data.material].filter(Boolean).flatMap((item) => item.split(/[,\s]+/)).filter(Boolean).slice(0, 10)
  };
}

export function SaleListingWorkflow() {
  const [photos, setPhotos] = useState<File[]>([]);
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [size, setSize] = useState("");
  const [material, setMaterial] = useState("");
  const [condition, setCondition] = useState("");
  const [defects, setDefects] = useState("");
  const [measurements, setMeasurements] = useState("");
  const [wantedPrice, setWantedPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<SalePlan | null>(null);
  const [copied, setCopied] = useState(false);

  const previews = useMemo(() => photos.map((file) => ({ name: file.name, url: URL.createObjectURL(file) })), [photos]);

  async function generate() {
    setLoading(true);
    setCopied(false);
    await new Promise((resolve) => setTimeout(resolve, 1100));
    setPlan(buildSalePlan({ brand, category, size, material, condition, defects, measurements, wantedPrice, notes, photoCount: photos.length }));
    setLoading(false);
  }

  async function copyListing() {
    if (!plan) return;
    await navigator.clipboard.writeText(`${plan.title}\n\nPrix : ${euros(plan.price)}\n\n${plan.description}`);
    setCopied(true);
  }

  return (
    <div className="mt-8 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <section className="grid content-start gap-5 rounded-lg border border-white/10 bg-panel p-5 shadow-glow">
        <label className="grid cursor-pointer gap-4 rounded-md border border-dashed border-accent/35 bg-accent/[0.05] p-5 text-center transition hover:border-accent">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-accent/15 text-accent">
            <Camera size={30} />
          </span>
          <span>
            <span className="block font-bold text-white">Photos du produit</span>
            <span className="mt-1 block text-sm text-muted">Ajoute les vraies photos. Le site te donnera l'ordre conseillé.</span>
          </span>
          <span className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-accent px-4 text-sm font-bold text-ink">
            <Upload size={17} />
            Importer les photos
          </span>
          <input
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={(event) => {
              setPhotos(Array.from(event.currentTarget.files || []));
              setPlan(null);
            }}
          />
        </label>

        {previews.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {previews.slice(0, 6).map((photo, index) => (
              <div key={`${photo.name}-${index}`} className="aspect-square overflow-hidden rounded-md border border-white/10 bg-white/[0.04]">
                <img src={photo.url} alt="" className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Marque" value={brand} onChange={setBrand} placeholder="Ex: Ralph Lauren" />
          <Field label="Produit" value={category} onChange={setCategory} placeholder="Ex: pull torsadé blanc" />
          <Field label="Taille" value={size} onChange={setSize} placeholder="Ex: S / M / 42" />
          <Field label="Matière" value={material} onChange={setMaterial} placeholder="Ex: coton, laine, cuir..." />
          <Field label="État" value={condition} onChange={setCondition} placeholder="Ex: très bon état" />
          <Field label="Prix voulu" value={wantedPrice} onChange={(value) => setWantedPrice(value.replace(/[^\d.,]/g, ""))} placeholder="Optionnel" />
        </div>

        <TextArea label="Défauts réels" value={defects} onChange={setDefects} placeholder="Ex: petite tache manche, couture fatiguée... Laisse vide si rien." />
        <TextArea label="Mesures" value={measurements} onChange={setMeasurements} placeholder="Ex: longueur 67 cm, largeur 54 cm..." />
        <TextArea label="Détails en plus" value={notes} onChange={setNotes} placeholder="Ex: coupe oversize, ancien logo, couleur plus claire en vrai..." />

        <Button type="button" disabled={loading || (!brand.trim() && !category.trim())} onClick={generate} className="w-full">
          {loading ? (
            <span className="flex items-center gap-2"><Loader2 size={18} className="animate-spin" />Création de l'annonce...</span>
          ) : (
            <span className="flex items-center gap-2"><Wand2 size={18} />Créer l'annonce complète</span>
          )}
        </Button>
      </section>

      <section className="grid content-start gap-4">
        {!plan && !loading && (
          <div className="rounded-lg border border-white/10 bg-panel p-8 text-muted">
            Remplis les infos réelles du produit reçu. Vente prépare ensuite l'annonce complète, le prix et l'ordre des photos.
          </div>
        )}

        {loading && (
          <div className="rounded-lg border border-accent/20 bg-panel p-8 text-center shadow-glow">
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-full border border-accent/30 bg-accent/10">
              <Loader2 size={38} className="animate-spin text-accent" />
            </div>
            <h2 className="mt-5 text-2xl font-semibold">Annonce en création</h2>
            <p className="mt-3 text-sm leading-6 text-muted">Vente prépare le prix, la description, les points forts et l'ordre des photos.</p>
          </div>
        )}

        {plan && !loading && (
          <>
            <div className="rounded-lg border border-accent/25 bg-panel p-5 shadow-glow">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="flex items-center gap-2 text-sm font-bold text-accent"><PackageCheck size={16} />Annonce prête à poster</p>
                  <h2 className="mt-2 text-2xl font-bold">{plan.title}</h2>
                </div>
                <button
                  type="button"
                  onClick={copyListing}
                  className={cn("inline-flex h-11 items-center gap-2 rounded-md px-4 text-sm font-bold transition", copied ? "bg-accent text-ink" : "border border-white/15 bg-white/10 text-white hover:bg-white/15")}
                >
                  {copied ? <Check size={17} /> : <Clipboard size={17} />}
                  {copied ? "Copié" : "Copier"}
                </button>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <Metric icon={<Euro size={17} />} label="Prix conseillé" value={euros(plan.price)} highlight />
                <Metric label="Prix à tenter" value={euros(plan.tryPrice)} />
                <Metric label="Prix rapide" value={euros(plan.fastPrice)} />
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-panel p-5">
              <p className="flex items-center gap-2 text-sm font-bold text-accent"><Sparkles size={16} />Description complète</p>
              <pre className="mt-4 whitespace-pre-wrap rounded-md bg-white/[0.04] p-4 text-sm leading-7 text-slate-200">{plan.description}</pre>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <InfoBlock title="Ordre des photos" items={plan.photoOrder} />
              <InfoBlock title="Points forts" items={plan.strengths} />
              <InfoBlock title="Points faibles" items={plan.warnings} />
              <InfoBlock title="Mots-clés" items={plan.tags} />
            </div>
            <InfoBlock title="Checklist avant publication" items={plan.checklist} />
          </>
        )}
      </section>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-bold text-white">{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} className="h-12 rounded-md border border-white/10 bg-white/5 px-3 outline-none focus:border-accent" placeholder={placeholder} />
    </label>
  );
}

function TextArea({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-bold text-white">{label}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={3} className="rounded-md border border-white/10 bg-white/5 px-3 py-3 outline-none focus:border-accent" placeholder={placeholder} />
    </label>
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
