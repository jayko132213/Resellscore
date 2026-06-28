"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Check, Clipboard, HelpCircle, Loader2, MessageSquareText, ShieldCheck, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, euros } from "@/lib/utils";

type LevelKey = "rapide" | "avance" | "expert";
type AnswerState = "todo" | "answered" | "unknown";

type SellerQuestion = {
  id: string;
  text: string;
  reason: string;
};

type SellerAnswer = {
  state: AnswerState;
  value: string;
};

type PurchasePlan = {
  score: number;
  title: string;
  buyAdvice: string;
  estimatedResalePrice: number;
  maxSafeBuyPrice: number;
  targetNegotiationPrice: number;
  margin: number;
  actionPlan: string;
  strengths: string[];
  risks: string[];
  checks: string[];
};

const levels: { key: LevelKey; title: string; text: string }[] = [
  { key: "rapide", title: "Rapide", text: "Pour decider vite avec les infos essentielles." },
  { key: "avance", title: "Complet", text: "Plus precis pour vetements, sneakers et objets simples." },
  { key: "expert", title: "Expert", text: "Maximum de questions avant achat." }
];

const questionBank: Record<LevelKey, SellerQuestion[]> = {
  rapide: [
    { id: "state", text: "Est-ce que le produit est vraiment en bon etat ?", reason: "L'etat decide directement si la marge tient." },
    { id: "defects", text: "Il y a des taches, trous, rayures, usure ou pieces manquantes ?", reason: "Un defaut cache peut rendre l'achat mauvais." },
    { id: "photos", text: "Le vendeur peut envoyer une photo proche de l'etiquette et des defauts ?", reason: "Si le vendeur refuse, le risque monte." }
  ],
  avance: [
    { id: "state", text: "Est-ce que le produit est vraiment en bon etat ?", reason: "Base de la decision d'achat." },
    { id: "defects", text: "Il y a des taches, trous, rayures, usure ou pieces manquantes ?", reason: "A verifier avant de payer." },
    { id: "brand", text: "La marque et l'etiquette sont visibles ?", reason: "Indispensable pour confirmer la valeur." },
    { id: "size", text: "La taille est-elle bien indiquee et fiable ?", reason: "Les tailles font beaucoup varier la demande." },
    { id: "measurements", text: "Le vendeur peut donner les mesures principales ?", reason: "Mesures utiles pour eviter un achat invendable." },
    { id: "auth", text: "Authenticite, facture ou preuve possible ?", reason: "Important pour premium, tech et marques copiees." }
  ],
  expert: [
    { id: "state", text: "Est-ce que le produit est vraiment en bon etat ?", reason: "Base de la decision d'achat." },
    { id: "defects", text: "Il y a des taches, trous, rayures, usure ou pieces manquantes ?", reason: "A verifier avant de payer." },
    { id: "brand", text: "La marque, l'etiquette et le modele exact sont visibles ?", reason: "Permet de mieux estimer le marche." },
    { id: "size", text: "La taille est-elle bien indiquee et fiable ?", reason: "Taille facile = revente plus rapide." },
    { id: "measurements", text: "Le vendeur peut donner les mesures principales ?", reason: "Aisselle, longueur, taille, semelle selon produit." },
    { id: "material", text: "Quelle est la matiere ou composition ?", reason: "Lin, laine, cuir, Gore-Tex peuvent booster le prix." },
    { id: "auth", text: "Authenticite : facture, numero, etiquette interieure ou preuve ?", reason: "Obligatoire pour premium ou tech chere." },
    { id: "history", text: "Pourquoi le vendeur le vend et depuis combien de temps il l'a ?", reason: "Aide a detecter une annonce douteuse." }
  ]
};

function extractPrice(text: string) {
  const match = text.match(/(\d{1,5})(?:\s?(?:€|eur|euro|euros))/i);
  return match ? Number(match[1]) : 0;
}

function guessBrand(text: string) {
  const brands = ["Ralph Lauren", "Lacoste", "Nike", "Adidas", "Carhartt", "Stone Island", "Arc'teryx", "Levi's", "Patagonia", "Moncler", "Apple", "Sony", "Nintendo", "New Balance", "Burberry", "Dr. Martens"];
  const lowered = text.toLowerCase();
  return brands.find((brand) => lowered.includes(brand.toLowerCase().replace("'", "")) || lowered.includes(brand.toLowerCase())) || "";
}

function detectProductType(text: string) {
  const lowered = text.toLowerCase();
  if (/short|maillot/.test(lowered)) return "short";
  if (/pull|maille|sweat|hoodie/.test(lowered)) return "pull";
  if (/veste|manteau|blouson|jacket|doudoune/.test(lowered)) return "veste";
  if (/jean|pantalon|cargo/.test(lowered)) return "pantalon";
  if (/polo|chemise|shirt|tshirt|t-shirt|tee/.test(lowered)) return "haut";
  if (/chaussure|sneaker|paire|air max|jordan/.test(lowered)) return "paire";
  if (/console|ps5|switch|xbox|jeu|manette/.test(lowered)) return "objet gaming";
  return "article";
}

function cleanTitle(text: string, brand: string) {
  const firstLine = text.split(/\n|\.|,/).map((line) => line.trim()).find(Boolean) || "";
  const simple = firstLine.replace(/\d{1,5}\s?(€|eur|euro)/gi, "").trim();
  if (simple.length > 8) return simple.slice(0, 85);
  return brand ? `${brand} a verifier avant achat` : "Article a verifier avant achat";
}

function answerText(answers: Record<string, SellerAnswer>, id: string) {
  const answer = answers[id];
  return answer?.state === "answered" ? answer.value.trim() : "";
}

function estimateMarket(brand: string, productType: string, text: string, infoScore: number) {
  const lowered = text.toLowerCase();
  let base = 28;
  let season = "Demande normale : le prix depend surtout de l'etat, la marque et les photos.";

  if (brand === "Nike") base = productType === "short" ? 38 : productType === "paire" ? 55 : 34;
  else if (brand === "Ralph Lauren") base = productType === "pull" ? 48 : 38;
  else if (brand === "Lacoste") base = productType === "pull" || productType === "haut" ? 36 : 32;
  else if (brand === "Adidas") base = productType === "paire" ? 45 : 30;
  else if (brand === "Carhartt") base = productType === "veste" ? 85 : 42;
  else if (brand === "Stone Island") base = productType === "veste" ? 170 : 120;
  else if (brand === "Arc'teryx") base = productType === "veste" ? 180 : 95;
  else if (brand === "Levi's") base = productType === "pantalon" ? 45 : 35;
  else if (productType === "short") base = 26;
  else if (productType === "pull") base = 32;
  else if (productType === "veste") base = 48;
  else if (productType === "paire") base = 42;

  if (/fluo|rose|vert clair|vert|jaune|orange|pastel|bleu ciel|turquoise|color/.test(lowered) && /short|tee|tshirt|t-shirt|polo|chemise|maillot|robe|jupe|haut/.test(lowered)) {
    base *= 1.12;
    season = "Couleur estivale/tendance : bon point si tu revends vite avec des photos lumineuses.";
  }
  if (/lin|coton leger|leger|maillot|short/.test(lowered)) {
    base *= 1.08;
    season = "Produit ete : a vendre rapidement pendant la demande chaude, sans attendre trop longtemps.";
  }
  if (/doudoune|parka|grosse veste|manteau|laine|cachemire/.test(lowered)) {
    base *= 0.96;
    season = "Produit hiver : meilleur potentiel en automne/hiver, achat seulement si le prix est bas.";
  }
  if (/neuf|jamais porte|excellent/.test(lowered)) base *= 1.12;
  if (/tache|trou|rayure|abim|usure|manquant|panne|defaut/.test(lowered)) base *= 0.78;
  if (infoScore >= 8.4) base *= 1.08;
  if (infoScore < 6.6) base *= 0.92;

  const resale = Math.max(8, Math.round(base));
  return { resale, season };
}

function buildPlan(input: string, buyPriceText: string, answers: Record<string, SellerAnswer>, level: LevelKey): PurchasePlan {
  const fullText = `${input}\n${Object.values(answers).map((answer) => answer.value).join("\n")}`;
  const buyPrice = Number(buyPriceText) || extractPrice(input);
  const brand = guessBrand(fullText);
  const productType = detectProductType(fullText);
  const title = cleanTitle(input, brand);
  const answered = Object.values(answers).filter((answer) => answer.state === "answered" && answer.value.trim()).length;
  const unknown = Object.values(answers).filter((answer) => answer.state === "unknown").length;
  const levelBoost = level === "expert" ? 1.2 : level === "avance" ? 0.9 : 0.5;
  const infoScore = Math.max(4.2, Math.min(9.4, 6.2 + answered * 0.35 + levelBoost - unknown * 0.28));
  const market = estimateMarket(brand, productType, fullText, infoScore);
  const maxSafeBuyPrice = Math.max(1, Math.round(market.resale * 0.62));
  const targetNegotiationPrice = Math.max(1, Math.round(market.resale * 0.52));
  const margin = market.resale - buyPrice;
  const priceScore = Math.max(2.5, Math.min(9.6, 5.4 + (margin / Math.max(market.resale, 1)) * 5));
  const score = Math.max(3.8, Math.min(9.4, infoScore * 0.55 + priceScore * 0.45));
  const hasDefect = /tache|trou|rayure|abim|usure|manquant|panne|defaut/i.test(fullText);
  const sellerState = answerText(answers, "state");
  const sellerSize = answerText(answers, "size");
  const sellerMaterial = answerText(answers, "material");

  const buyAdvice = margin <= 0
    ? "Ne pas acheter a ce prix : marge trop faible."
    : buyPrice > maxSafeBuyPrice
      ? "A acheter seulement si tu negocies plus bas."
      : score >= 8
        ? "Bon pre-achat si les preuves vendeur sont propres."
        : "Interessant, mais securise les infos avant de payer.";

  const actionPlan = [
    `Objectif avant achat : confirmer que ${title} peut se revendre autour de ${euros(market.resale)} sans mauvaise surprise.`,
    brand ? `Marque detectee : ${brand}. Demande une photo de l'etiquette pour confirmer.` : "Marque non confirmee : ne paie pas avant d'avoir une photo de l'etiquette.",
    market.season,
    `Prix vendeur : ${euros(buyPrice)}. Prix max prudent : ${euros(maxSafeBuyPrice)}. Prix a tenter en negociation : ${euros(targetNegotiationPrice)}.`,
    sellerState ? `Etat annonce par le vendeur : ${sellerState}.` : "Etat pas assez clair : demande photos proches des zones usees.",
    sellerSize ? `Taille/coupe : ${sellerSize}.` : "Taille a confirmer, surtout si la piece taille petit/grand.",
    sellerMaterial ? `Matiere : ${sellerMaterial}. Cela peut justifier un prix plus haut si c'est qualitatif.` : "Matiere non confirmee : utile a demander si c'est un vetement.",
    hasDefect ? "Defaut mentionne : demande une photo precise et negocie plus fort." : "Aucun defaut clair detecte, mais demande quand meme etiquette + details avant paiement.",
    "Decision finale : achete seulement si le vendeur repond clairement et que les photos confirment l'etat."
  ].filter(Boolean).join("\n\n");

  const missingQuestions = Object.entries(answers)
    .filter(([, answer]) => answer.state === "unknown")
    .map(([id]) => questionBank[level].find((question) => question.id === id)?.text || "Information non confirmee")
    .slice(0, 5);

  return {
    score: Number(score.toFixed(1)),
    title,
    buyAdvice,
    estimatedResalePrice: market.resale,
    maxSafeBuyPrice,
    targetNegotiationPrice,
    margin,
    actionPlan,
    strengths: [
      margin > 0 ? `Marge theorique positive : environ ${euros(margin)}` : "Marge faible : achat a eviter sans negociation",
      brand ? `Marque ${brand} utile pour la demande` : "Marque a confirmer avant paiement",
      market.season,
      productType !== "article" ? `Type detecte : ${productType}` : "Type a preciser pour mieux estimer",
      `Prix max prudent : ${euros(maxSafeBuyPrice)}`
    ],
    risks: [
      ...(buyPrice > maxSafeBuyPrice ? ["Prix actuel trop haut pour une marge confortable."] : []),
      ...(hasDefect ? ["Defaut ou usure mentionne : preuve photo obligatoire."] : []),
      ...missingQuestions,
      ...(missingQuestions.length === 0 && buyPrice <= maxSafeBuyPrice && !hasDefect ? ["Pas de gros blocage detecte, mais verifie quand meme les photos reelles."] : [])
    ],
    checks: [
      "Demander etiquette marque/taille avant achat.",
      "Demander photo proche des zones d'usure.",
      `Negocier vers ${euros(targetNegotiationPrice)} si possible.`,
      "Acheter seulement si le vendeur repond clairement.",
      "Garder les messages vendeur comme preuve."
    ]
  };
}

export function PrePurchaseWorkflow({ initialItem = "" }: { initialItem?: string }) {
  const [level, setLevel] = useState<LevelKey>("avance");
  const [input, setInput] = useState(initialItem);
  const [buyPrice, setBuyPrice] = useState("");
  const [answers, setAnswers] = useState<Record<string, SellerAnswer>>({});
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<PurchasePlan | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const questions = questionBank[level];
  const missingCount = useMemo(() => questions.filter((question) => !answers[question.id]?.state || answers[question.id]?.state === "todo").length, [answers, questions]);

  function setAnswer(id: string, next: Partial<SellerAnswer>) {
    setAnswers((current) => ({
      ...current,
      [id]: { ...(current[id] || { state: "todo", value: "" }), ...next }
    }));
    setPlan(null);
  }

  async function generatePlan() {
    const detectedPrice = Number(buyPrice) || extractPrice(input);
    if (!detectedPrice) {
      setError("Mets le prix d'achat prevu ou ecris le prix dans l'annonce. Sans prix, je ne calcule plus une fausse marge.");
      setPlan(null);
      return;
    }

    setLoading(true);
    setCopied(false);
    setError("");
    await new Promise((resolve) => setTimeout(resolve, 900));
    setPlan(buildPlan(input, String(detectedPrice), answers, level));
    setLoading(false);
  }

  async function copyPlan() {
    if (!plan) return;
    await navigator.clipboard.writeText(`${plan.title}\n\n${plan.buyAdvice}\n\n${plan.actionPlan}`);
    setCopied(true);
  }

  return (
    <div className="mt-8 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <section className="grid content-start gap-5 rounded-lg border border-white/10 bg-panel p-5 shadow-glow">
        <div className="grid gap-3 md:grid-cols-3">
          {levels.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => {
                setLevel(item.key);
                setPlan(null);
              }}
              className={cn(
                "rounded-md border p-4 text-left transition",
                level === item.key ? "border-accent bg-accent/10 text-white" : "border-white/10 bg-white/[0.03] text-muted hover:border-white/25"
              )}
            >
              <span className="text-sm font-bold">{item.title}</span>
              <span className="mt-2 block text-xs leading-5">{item.text}</span>
            </button>
          ))}
        </div>

        <label className="grid gap-2">
          <span className="text-sm font-bold text-white">Annonce que tu veux acheter</span>
          <textarea
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              setError("");
              setPlan(null);
            }}
            rows={6}
            className="rounded-md border border-white/10 bg-white/5 px-3 py-3 outline-none focus:border-accent"
            placeholder="Colle le titre, description, marque, etat, taille, lien ou infos vendeur..."
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-bold text-white">Prix d'achat prevu</span>
          <input
            value={buyPrice}
            onChange={(event) => {
              setBuyPrice(event.target.value.replace(/[^\d.]/g, ""));
              setError("");
              setPlan(null);
            }}
            className="h-12 rounded-md border border-white/10 bg-white/5 px-3 outline-none focus:border-accent"
            placeholder="Ex: 25"
            inputMode="decimal"
          />
        </label>

        <div className="grid gap-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Questions vendeur</h2>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-muted">{missingCount} a traiter</span>
          </div>

          {questions.map((question) => {
            const answer = answers[question.id] || { state: "todo", value: "" };
            return (
              <article key={question.id} className="rounded-md border border-white/10 bg-white/[0.03] p-4">
                <p className="flex gap-2 text-sm font-semibold text-white">
                  <HelpCircle size={16} className="mt-0.5 shrink-0 text-accent" />
                  {question.text}
                </p>
                <p className="mt-1 text-xs leading-5 text-muted">{question.reason}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <ChoiceButton active={answer.state === "todo"} onClick={() => setAnswer(question.id, { state: "todo" })}>A demander</ChoiceButton>
                  <ChoiceButton active={answer.state === "answered"} onClick={() => setAnswer(question.id, { state: "answered" })}>Reponse vendeur</ChoiceButton>
                  <ChoiceButton active={answer.state === "unknown"} onClick={() => setAnswer(question.id, { state: "unknown", value: "" })}>Pas pu demander</ChoiceButton>
                </div>
                {answer.state === "answered" && (
                  <textarea
                    value={answer.value}
                    onChange={(event) => setAnswer(question.id, { value: event.target.value, state: "answered" })}
                    rows={2}
                    className="mt-3 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-accent"
                    placeholder="Colle la reponse du vendeur ici..."
                  />
                )}
              </article>
            );
          })}
        </div>

        {error && <p className="rounded-md bg-rose-500/10 p-3 text-sm text-rose-200">{error}</p>}

        <Button type="button" disabled={loading || input.trim().length < 8} onClick={generatePlan} className="w-full">
          {loading ? (
            <span className="flex items-center gap-2"><Loader2 size={18} className="animate-spin" />Verification...</span>
          ) : (
            <span className="flex items-center gap-2"><Wand2 size={18} />Creer le plan pre-achat</span>
          )}
        </Button>
      </section>

      <section className="grid content-start gap-4">
        {!plan && !loading && (
          <div className="rounded-lg border border-white/10 bg-panel p-8 text-muted">
            Remplis l'annonce et les reponses vendeur. ResellScore te dira quoi verifier, jusqu'ou negocier et si l'achat vaut le coup.
          </div>
        )}

        {loading && (
          <div className="rounded-lg border border-accent/20 bg-panel p-8 text-center shadow-glow">
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-full border border-accent/30 bg-accent/10">
              <Loader2 size={38} className="animate-spin text-accent" />
            </div>
            <h2 className="mt-5 text-2xl font-semibold">Verification pre-achat</h2>
            <p className="mt-3 text-sm leading-6 text-muted">Le site verifie marge, saison, risques vendeur et points a demander avant paiement.</p>
          </div>
        )}

        {plan && !loading && (
          <>
            <div className="rounded-lg border border-accent/25 bg-panel p-5 shadow-glow">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="flex items-center gap-2 text-sm font-bold text-accent"><ShieldCheck size={16} />Score pre-achat {plan.score}/10</p>
                  <h2 className="mt-2 text-2xl font-bold">{plan.buyAdvice}</h2>
                </div>
                <button
                  type="button"
                  onClick={copyPlan}
                  className={cn("inline-flex h-11 items-center gap-2 rounded-md px-4 text-sm font-bold transition", copied ? "bg-accent text-ink" : "border border-white/15 bg-white/10 text-white hover:bg-white/15")}
                >
                  {copied ? <Check size={17} /> : <Clipboard size={17} />}
                  {copied ? "Copie" : "Copier le plan"}
                </button>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-4">
                <Metric label="Revente probable" value={euros(plan.estimatedResalePrice)} highlight />
                <Metric label="Max achat prudent" value={euros(plan.maxSafeBuyPrice)} />
                <Metric label="Negociation cible" value={euros(plan.targetNegotiationPrice)} />
                <Metric label="Marge theorique" value={euros(plan.margin)} />
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-panel p-5">
              <p className="flex items-center gap-2 text-sm font-bold text-accent"><Sparkles size={16} />Plan avant achat</p>
              <h3 className="mt-2 text-xl font-semibold">{plan.title}</h3>
              <pre className="mt-4 whitespace-pre-wrap rounded-md bg-white/[0.04] p-4 text-sm leading-7 text-slate-200">{plan.actionPlan}</pre>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <InfoBlock icon={<MessageSquareText size={17} />} title="Points favorables" items={plan.strengths} />
              <InfoBlock icon={<AlertTriangle size={17} />} title="Risques avant achat" items={plan.risks} />
            </div>
            <InfoBlock icon={<Check size={17} />} title="Checklist avant paiement" items={plan.checks} />
          </>
        )}
      </section>
    </div>
  );
}

function ChoiceButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-9 rounded-md border px-3 text-xs font-semibold transition",
        active ? "border-accent bg-accent/10 text-accent" : "border-white/10 bg-white/[0.03] text-muted hover:border-white/25"
      )}
    >
      {children}
    </button>
  );
}

function Metric({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={cn("rounded-md border p-3", highlight ? "border-accent/25 bg-accent/10" : "border-white/10 bg-white/[0.04]")}>
      <p className="text-xs text-muted">{label}</p>
      <p className={cn("mt-1 text-lg font-bold", highlight ? "text-accent" : "text-white")}>{value}</p>
    </div>
  );
}

function InfoBlock({ icon, title, items }: { icon: React.ReactNode; title: string; items: string[] }) {
  return (
    <div className="rounded-lg border border-white/10 bg-panel p-5">
      <h3 className="flex items-center gap-2 text-lg font-semibold">{icon}{title}</h3>
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
