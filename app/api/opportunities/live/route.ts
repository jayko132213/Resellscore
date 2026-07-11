import { NextResponse } from "next/server";

type LiveOpportunity = {
  id: string;
  title: string;
  category: string;
  score: number;
  buy: number;
  listingPrice: number;
  retail: number;
  resale: number;
  safeResale: number;
  maxSafeBuy: number;
  safetyReserve: number;
  x2Rule: boolean;
  margin: number;
  marginRate: number;
  demand: number;
  likes: number | null;
  likeVelocity: string;
  popularity: number;
  link: string;
  imageUrl: string;
  signal: string;
  reason: string;
  risk: string;
  condition: string;
  sellerSignal: string;
  spottedAt: string;
  postedLabel: string;
  quickDescription: string;
};

type Scan = {
  id?: string;
  niche?: string;
  subcategory?: string;
  q: string;
  min?: number;
  max: number;
  category: string;
  retail: number;
  resale: number;
  demand: number;
  minMargin: number;
  minRate: number;
  risk: string;
  season?: string;
};

type CatalogItem = {
  link: string;
  title: string;
  listingPrice?: number | null;
  likes?: number | null;
  imageUrl?: string;
  postedLabel?: string;
  condition?: string;
  source?: "api" | "catalog" | "detail";
};

type DetectedItem = CatalogItem & {
  listingPrice: number;
  likes: number | null;
  imageUrl: string;
  postedLabel: string;
  condition: string;
  source: "api" | "catalog" | "detail";
};

const scans: Scan[] = [
  { q: "Nike short vert", max: 25, category: "Ete", retail: 45, resale: 42, demand: 84, minMargin: 12, minRate: 0.45, risk: "Verifier etiquette et etat de l'elastique" },
  { q: "Adidas short vintage", max: 22, category: "Ete", retail: 40, resale: 38, demand: 80, minMargin: 10, minRate: 0.45, risk: "Verifier taches et cordon" },
  { q: "Ralph Lauren pull torsade", max: 32, category: "Vintage", retail: 149, resale: 62, demand: 82, minMargin: 20, minRate: 0.55, risk: "Verifier col, maille et etiquette" },
  { q: "Ralph Lauren chemise oxford", max: 25, category: "Classique", retail: 119, resale: 48, demand: 78, minMargin: 15, minRate: 0.5, risk: "Verifier col et poignets" },
  { q: "Carhartt Detroit jacket", max: 70, category: "Workwear", retail: 189, resale: 125, demand: 92, minMargin: 35, minRate: 0.55, risk: "Verifier zip, doublure et manches" },
  { q: "Levis 501 USA", max: 35, category: "Denim", retail: 110, resale: 68, demand: 89, minMargin: 20, minRate: 0.55, risk: "Verifier mesures et ourlet" },
  { q: "Adidas Samba cuir", max: 45, category: "Sneakers", retail: 120, resale: 75, demand: 91, minMargin: 18, minRate: 0.42, risk: "Verifier semelle et talon interieur" },
  { q: "Arc'teryx shell ancien logo", max: 110, category: "Outdoor", retail: 400, resale: 210, demand: 96, minMargin: 65, minRate: 0.65, risk: "Verifier membrane et coutures" },
  { q: "Stone Island maille badge", max: 115, category: "Designer", retail: 280, resale: 180, demand: 88, minMargin: 45, minRate: 0.45, risk: "Verifier certilogo et badge" },
  { q: "Patagonia Synchilla", max: 80, category: "Outdoor", retail: 150, resale: 135, demand: 86, minMargin: 35, minRate: 0.5, risk: "Verifier bouloches et taches" },
  { q: "maillot retro Nike", max: 45, category: "Sport", retail: 90, resale: 85, demand: 88, minMargin: 25, minRate: 0.6, risk: "Verifier authenticite et flocage" },
  { q: "Nike ACG polaire", max: 60, category: "Gorpcore", retail: 130, resale: 110, demand: 91, minMargin: 30, minRate: 0.55, risk: "Verifier zip et manches" }
];

const extraScans: Scan[] = [
  { id: "nike-running", niche: "nike", subcategory: "Nike running", q: "Nike running vintage", max: 35, category: "Nike", retail: 70, resale: 58, demand: 86, minMargin: 16, minRate: 0.48, risk: "Verifier logo, matiere technique et traces d'usure" },
  { id: "nike-sport", niche: "nike", subcategory: "Nike sport", q: "Nike sport vintage", max: 28, category: "Nike", retail: 55, resale: 48, demand: 84, minMargin: 14, minRate: 0.45, risk: "Verifier taches, logo et coupe" },
  { id: "nike-acg", niche: "nike", subcategory: "Nike ACG", q: "Nike ACG polaire", max: 60, category: "Gorpcore", retail: 130, resale: 110, demand: 91, minMargin: 30, minRate: 0.55, risk: "Verifier zip et manches" },
  { id: "ralph-knit", niche: "ralph", subcategory: "Pull torsade", q: "Ralph Lauren pull torsade", max: 32, category: "Ralph Lauren", retail: 149, resale: 62, demand: 82, minMargin: 20, minRate: 0.55, risk: "Verifier col, maille et etiquette" },
  { id: "ralph-oxford", niche: "ralph", subcategory: "Chemise Oxford", q: "Ralph Lauren chemise oxford", max: 25, category: "Ralph Lauren", retail: 119, resale: 48, demand: 78, minMargin: 15, minRate: 0.5, risk: "Verifier col et poignets" },
  { id: "ralph-cap", niche: "ralph", subcategory: "Casquette Ralph", q: "Ralph Lauren casquette", max: 18, category: "Accessoires", retail: 49, resale: 34, demand: 76, minMargin: 10, minRate: 0.55, risk: "Verifier forme, taches et logo" },
  { id: "adidas-samba", niche: "adidas", subcategory: "Adidas Samba", q: "Adidas Samba cuir", max: 45, category: "Sneakers", retail: 120, resale: 75, demand: 91, minMargin: 18, minRate: 0.42, risk: "Verifier semelle et talon interieur" },
  { id: "adidas-track", niche: "adidas", subcategory: "Survetement retro", q: "Adidas survetement vintage", max: 45, category: "Sportswear", retail: 90, resale: 78, demand: 83, minMargin: 22, minRate: 0.55, risk: "Verifier fermeture, bandes et bouloches" },
  { id: "football-psg", niche: "maillots", subcategory: "PSG", q: "maillot PSG vintage", max: 55, category: "Maillots", retail: 95, resale: 95, demand: 90, minMargin: 28, minRate: 0.55, risk: "Verifier saison, sponsor et flocage" },
  { id: "football-manchester", niche: "maillots", subcategory: "Manchester", q: "maillot Manchester United vintage", max: 55, category: "Maillots", retail: 95, resale: 92, demand: 87, minMargin: 25, minRate: 0.5, risk: "Verifier authenticite et etiquette" },
  { id: "outdoor-arcteryx", niche: "outdoor", subcategory: "Arc'teryx", q: "Arc'teryx shell ancien logo", max: 110, category: "Outdoor", retail: 400, resale: 210, demand: 96, minMargin: 65, minRate: 0.65, risk: "Verifier membrane et coutures" },
  { id: "outdoor-tnf", niche: "outdoor", subcategory: "The North Face", q: "The North Face fleece vintage", max: 65, category: "Outdoor", retail: 130, resale: 105, demand: 87, minMargin: 30, minRate: 0.52, risk: "Verifier zip, logo et manches" },
  { id: "workwear-carhartt", niche: "workwear", subcategory: "Carhartt Detroit", q: "Carhartt Detroit jacket", max: 70, category: "Workwear", retail: 189, resale: 125, demand: 92, minMargin: 35, minRate: 0.55, risk: "Verifier zip, doublure et manches" },
  { id: "denim-levis", niche: "denim", subcategory: "Levi's 501", q: "Levis 501 USA", max: 35, category: "Denim", retail: 110, resale: 68, demand: 89, minMargin: 20, minRate: 0.55, risk: "Verifier mesures et ourlet" },
  { id: "designer-stone", niche: "designer", subcategory: "Stone Island", q: "Stone Island maille badge", max: 115, category: "Designer", retail: 280, resale: 180, demand: 88, minMargin: 45, minRate: 0.45, risk: "Verifier certilogo et badge" },
  { id: "tech-iphone", niche: "tech", subcategory: "iPhone", q: "iPhone facture debloque", max: 350, category: "Tech", retail: 750, resale: 520, demand: 86, minMargin: 70, minRate: 0.25, risk: "Verifier facture, IMEI, batterie et compte retire" }
];

const seasonalScans: Scan[] = [
  { id: "summer-skirt-premium", niche: "ete", subcategory: "Jupes premium", q: "jupe vintage soie", min: 30, max: 65, category: "Ete", retail: 120, resale: 82, demand: 78, minMargin: 24, minRate: 0.48, risk: "Verifier doublure, taches et transparence", season: "ete" },
  { id: "summer-dress-premium", niche: "ete", subcategory: "Robes propres", q: "robe vintage ete", min: 30, max: 70, category: "Ete", retail: 130, resale: 88, demand: 80, minMargin: 25, minRate: 0.46, risk: "Verifier taille, fermeture et taches", season: "ete" },
  { id: "summer-blouse", niche: "ete", subcategory: "Chemisiers", q: "chemisier vintage brode", min: 25, max: 55, category: "Ete", retail: 95, resale: 64, demand: 77, minMargin: 18, minRate: 0.45, risk: "Verifier aisselles, boutons et matiere", season: "ete" },
  { id: "winter-knit", niche: "hiver", subcategory: "Mailles hiver", q: "pull laine vintage", min: 25, max: 60, category: "Hiver", retail: 120, resale: 82, demand: 82, minMargin: 24, minRate: 0.5, risk: "Verifier trous, bouloches et col", season: "hiver" },
  { id: "winter-puffer", niche: "hiver", subcategory: "Doudounes", q: "doudoune vintage plume", min: 60, max: 180, category: "Hiver", retail: 260, resale: 220, demand: 84, minMargin: 55, minRate: 0.42, risk: "Verifier zip, gonflant, taches et authenticite", season: "hiver" }
];

const internetNicheScans: Scan[] = [
  { id: "topshop-kate-moss", niche: "niche", subcategory: "Topshop Kate Moss", q: "Topshop Kate Moss", max: 45, category: "Niche mode", retail: 110, resale: 95, demand: 86, minMargin: 28, minRate: 0.75, risk: "Verifier etiquette Topshop et collaboration Kate Moss" },
  { id: "sweater-shop", niche: "niche", subcategory: "The Sweater Shop", q: "The Sweater Shop pull", max: 28, category: "Vintage", retail: 80, resale: 62, demand: 75, minMargin: 24, minRate: 0.85, risk: "Verifier motif, bouloches et trous" },
  { id: "patagonia-retro", niche: "niche", subcategory: "Patagonia retro", q: "Patagonia retro fleece", max: 70, category: "Gorpcore", retail: 170, resale: 140, demand: 88, minMargin: 45, minRate: 0.65, risk: "Verifier zip, bouloches et logo" },
  { id: "tommy-crest", niche: "niche", subcategory: "Tommy crest", q: "Tommy Hilfiger crest vintage", max: 32, category: "Vintage", retail: 95, resale: 70, demand: 80, minMargin: 26, minRate: 0.8, risk: "Verifier logo brode et etat du col" },
  { id: "levis-big-e", niche: "niche", subcategory: "Levi's Big E", q: "Levis Big E vintage", max: 90, category: "Denim rare", retail: 220, resale: 190, demand: 82, minMargin: 70, minRate: 0.75, risk: "Verifier etiquette Big E, mesures et authenticite" },
  { id: "oakley-y2k", niche: "niche", subcategory: "Oakley Y2K", q: "Oakley y2k vintage", max: 45, category: "Y2K", retail: 140, resale: 95, demand: 84, minMargin: 35, minRate: 0.8, risk: "Verifier rayures, branches et modele" },
  { id: "diesel-y2k", niche: "niche", subcategory: "Diesel Y2K", q: "Diesel y2k", max: 40, category: "Y2K", retail: 120, resale: 82, demand: 82, minMargin: 28, minRate: 0.7, risk: "Verifier taille, coupe et usure" },
  { id: "miss-sixty", niche: "niche", subcategory: "Miss Sixty", q: "Miss Sixty vintage", max: 38, category: "Y2K", retail: 110, resale: 78, demand: 78, minMargin: 26, minRate: 0.7, risk: "Verifier coupe, mesures et taches" },
  { id: "football-bucket", niche: "niche", subcategory: "Bucket foot", q: "bucket hat football vintage", max: 18, category: "Blokecore", retail: 45, resale: 38, demand: 76, minMargin: 14, minRate: 0.8, risk: "Verifier taches, forme et club" },
  { id: "balletcore-shoes", niche: "niche", subcategory: "Balletcore shoes", q: "ballerine satin sneaker", max: 35, category: "Balletcore", retail: 95, resale: 65, demand: 76, minMargin: 20, minRate: 0.55, risk: "Verifier semelle, odeur et taches" },
  { id: "animal-print-sneakers", niche: "niche", subcategory: "Sneakers animal print", q: "sneakers leopard", max: 45, category: "Sneakers", retail: 120, resale: 82, demand: 78, minMargin: 26, minRate: 0.6, risk: "Verifier usure semelle et tendances trop rapides" },
  { id: "metallic-sneakers", niche: "niche", subcategory: "Sneakers metalliques", q: "sneakers metallic silver", max: 45, category: "Sneakers", retail: 120, resale: 82, demand: 78, minMargin: 26, minRate: 0.6, risk: "Verifier plis, couleur et talon interieur" },
  { id: "coach-y2k-bag", niche: "sacs", subcategory: "Coach Y2K bags", q: "Coach sac vintage y2k", max: 70, category: "Sacs", retail: 220, resale: 145, demand: 86, minMargin: 45, minRate: 0.65, risk: "Verifier cuir, coins, doublure et numero de serie" },
  { id: "dior-saddle-inspired", niche: "niche", subcategory: "Saddle bags", q: "sac saddle vintage cuir", max: 65, category: "Sacs", retail: 180, resale: 125, demand: 82, minMargin: 38, minRate: 0.6, risk: "Verifier marque, cuir, bandouliere et contrefacons" },
  { id: "raffia-bag", niche: "sacs", subcategory: "Sacs raphia", q: "sac raphia vintage", max: 28, category: "Sacs ete", retail: 85, resale: 58, demand: 80, minMargin: 20, minRate: 0.75, risk: "Verifier anses, trous et odeur" },
  { id: "beaded-bag", niche: "sacs", subcategory: "Sacs perles", q: "sac perles vintage", max: 30, category: "Sacs soiree", retail: 90, resale: 65, demand: 78, minMargin: 24, minRate: 0.8, risk: "Verifier perles manquantes et fermeture" },
  { id: "denim-bag", niche: "sacs", subcategory: "Sac denim", q: "sac denim vintage", max: 25, category: "Sacs", retail: 70, resale: 48, demand: 74, minMargin: 18, minRate: 0.75, risk: "Verifier taches, zip et anses" },
  { id: "mini-pouch", niche: "sacs", subcategory: "Mini pouch", q: "mini pouch vintage", max: 22, category: "Sacs", retail: 65, resale: 45, demand: 74, minMargin: 16, minRate: 0.7, risk: "Verifier fermeture et matiere" },
  { id: "jellycat", niche: "objets", subcategory: "Jellycat", q: "Jellycat peluche", max: 25, category: "Objets collector", retail: 45, resale: 55, demand: 86, minMargin: 18, minRate: 0.75, risk: "Verifier etiquette, authenticite et propretete" },
  { id: "vintage-ipod", niche: "objets", subcategory: "iPod vintage", q: "iPod classic fonctionne", max: 70, category: "Tech vintage", retail: 180, resale: 135, demand: 84, minMargin: 45, minRate: 0.65, risk: "Verifier batterie, stockage, cable et compte retire" },
  { id: "walkman", niche: "objets", subcategory: "Walkman", q: "Sony Walkman vintage fonctionne", max: 45, category: "Tech vintage", retail: 140, resale: 95, demand: 80, minMargin: 32, minRate: 0.7, risk: "Verifier lecture cassette/CD, pile et corrosion" },
  { id: "pyrex-rare", niche: "objets", subcategory: "Pyrex rare", q: "Pyrex vintage rare", max: 35, category: "Maison collector", retail: 120, resale: 85, demand: 78, minMargin: 30, minRate: 0.85, risk: "Verifier motif, eclats, fissures et authenticite" },
  { id: "vaseline-glass", niche: "objets", subcategory: "Vaseline glass", q: "vaseline glass uranium", max: 35, category: "Maison collector", retail: 110, resale: 80, demand: 76, minMargin: 28, minRate: 0.8, risk: "Verifier photos UV, eclats et expedition fragile" },
  { id: "sterling-silver", niche: "objets", subcategory: "Argent massif", q: "argent massif poincon", max: 60, category: "Bijoux / maison", retail: 180, resale: 130, demand: 82, minMargin: 42, minRate: 0.7, risk: "Verifier poincons, poids et argent plaque vs massif" },
  { id: "vintage-ad-sign", niche: "objets", subcategory: "Plaques pub", q: "plaque publicitaire vintage metal", max: 55, category: "Deco collector", retail: 180, resale: 125, demand: 78, minMargin: 40, minRate: 0.75, risk: "Verifier reproduction moderne et etat" },
  { id: "brass-decor", niche: "objets", subcategory: "Deco laiton", q: "laiton vintage deco", max: 25, category: "Deco", retail: 80, resale: 55, demand: 74, minMargin: 20, minRate: 0.8, risk: "Verifier poids, oxydation et vraie matiere" },
  { id: "lucite-accessories", niche: "objets", subcategory: "Lucite", q: "lucite vintage", max: 30, category: "Deco / accessoire", retail: 95, resale: 68, demand: 74, minMargin: 24, minRate: 0.8, risk: "Verifier rayures et jaunissement" },
  { id: "vintage-board-games", niche: "objets", subcategory: "Jeux vintage", q: "jeu de societe vintage complet", max: 25, category: "Jeux collector", retail: 75, resale: 55, demand: 72, minMargin: 18, minRate: 0.75, risk: "Verifier pieces completes, boite et edition" },
  { id: "signed-cookbooks", niche: "objets", subcategory: "Livres signes", q: "livre cuisine signe", max: 22, category: "Livres collector", retail: 70, resale: 48, demand: 70, minMargin: 16, minRate: 0.7, risk: "Verifier signature, edition et etat pages" },
  { id: "paperboy-hat", niche: "accessoires", subcategory: "Paperboy hat", q: "casquette gavroche vintage", max: 18, category: "Accessoires", retail: 55, resale: 38, demand: 74, minMargin: 14, minRate: 0.75, risk: "Verifier taille, forme et taches" },
  { id: "fur-hat", niche: "accessoires", subcategory: "Bonnet/fur hat", q: "bonnet fourrure vintage", max: 22, category: "Accessoires", retail: 70, resale: 48, demand: 74, minMargin: 16, minRate: 0.7, risk: "Verifier matiere, odeur et etat interieur" },
  { id: "nike-pull", niche: "nike", subcategory: "Nike pull", q: "pull Nike vintage", max: 30, category: "Nike", retail: 70, resale: 58, demand: 84, minMargin: 20, minRate: 0.7, risk: "Verifier col, logo et bouloches" },
  { id: "nike-track", niche: "nike", subcategory: "Nike track jacket", q: "Nike track jacket vintage", max: 45, category: "Nike", retail: 95, resale: 78, demand: 86, minMargin: 28, minRate: 0.65, risk: "Verifier zip, manches et taches" },
  { id: "ralph-rugby", niche: "ralph", subcategory: "Rugby shirt", q: "Ralph Lauren rugby", max: 35, category: "Ralph Lauren", retail: 130, resale: 78, demand: 80, minMargin: 28, minRate: 0.75, risk: "Verifier col blanc et traces aux manches" },
  { id: "ralph-linen", niche: "ralph", subcategory: "Lin ete", q: "Ralph Lauren lin chemise", max: 25, category: "Ralph Lauren", retail: 120, resale: 55, demand: 78, minMargin: 18, minRate: 0.7, risk: "Verifier transparence, taches et etiquette matiere" },
  { id: "adidas-tokyo", niche: "adidas", subcategory: "Adidas Tokyo Paris", q: "Adidas Tokyo Paris", max: 55, category: "Sneakers", retail: 120, resale: 88, demand: 83, minMargin: 25, minRate: 0.5, risk: "Verifier semelle et modele exact" },
  { id: "adidas-football", niche: "adidas", subcategory: "Adidas football retro", q: "Adidas football vintage", max: 38, category: "Blokecore", retail: 85, resale: 70, demand: 84, minMargin: 24, minRate: 0.65, risk: "Verifier sponsor et etiquette" },
  { id: "football-inter", niche: "maillots", subcategory: "Inter Milan", q: "maillot Inter Milan vintage", max: 55, category: "Maillots", retail: 95, resale: 92, demand: 84, minMargin: 25, minRate: 0.5, risk: "Verifier authenticite, sponsor et flocage" },
  { id: "football-france", niche: "maillots", subcategory: "France retro", q: "maillot France vintage", max: 60, category: "Maillots", retail: 100, resale: 105, demand: 90, minMargin: 32, minRate: 0.55, risk: "Verifier etiquette, badge et flocage" },
  { id: "football-training", niche: "maillots", subcategory: "Training tops", q: "football training top vintage", max: 32, category: "Blokecore", retail: 70, resale: 58, demand: 80, minMargin: 18, minRate: 0.6, risk: "Verifier sponsor et zip" },
  { id: "outdoor-salomon", niche: "outdoor", subcategory: "Salomon", q: "Salomon gorpcore", max: 55, category: "Gorpcore", retail: 130, resale: 92, demand: 84, minMargin: 30, minRate: 0.6, risk: "Verifier semelle, lacets et usure" },
  { id: "outdoor-columbia", niche: "outdoor", subcategory: "Columbia Titanium", q: "Columbia Titanium vintage", max: 45, category: "Gorpcore", retail: 110, resale: 82, demand: 79, minMargin: 28, minRate: 0.65, risk: "Verifier zip, membrane et manches" },
  { id: "outdoor-fjallraven", niche: "outdoor", subcategory: "Fjallraven", q: "Fjallraven vintage", max: 55, category: "Gorpcore", retail: 140, resale: 95, demand: 78, minMargin: 32, minRate: 0.6, risk: "Verifier logo, zip et taches" },
  { id: "workwear-dickies", niche: "workwear", subcategory: "Dickies", q: "Dickies workwear vintage", max: 30, category: "Workwear", retail: 75, resale: 58, demand: 78, minMargin: 20, minRate: 0.7, risk: "Verifier taille, usure et coupe" },
  { id: "workwear-chore", niche: "workwear", subcategory: "Chore jacket", q: "chore jacket vintage", max: 45, category: "Workwear", retail: 120, resale: 82, demand: 76, minMargin: 28, minRate: 0.65, risk: "Verifier boutons, manches et taches" },
  { id: "denim-trucker", niche: "denim", subcategory: "Trucker jacket", q: "Levis trucker jacket vintage", max: 45, category: "Denim", retail: 120, resale: 82, demand: 82, minMargin: 28, minRate: 0.65, risk: "Verifier mesures et usure col" },
  { id: "denim-jorts", niche: "denim", subcategory: "Jorts", q: "Levis jorts vintage", max: 25, category: "Denim", retail: 65, resale: 45, demand: 78, minMargin: 15, minRate: 0.6, risk: "Verifier longueur et entrejambe" },
  { id: "designer-cp", niche: "designer", subcategory: "CP Company", q: "CP Company vintage", max: 90, category: "Designer", retail: 220, resale: 155, demand: 82, minMargin: 45, minRate: 0.55, risk: "Verifier lentilles, etiquette et authenticite" },
  { id: "designer-fred-perry", niche: "designer", subcategory: "Fred Perry Oxford", q: "Fred Perry oxford shirt", max: 30, category: "Designer", retail: 95, resale: 62, demand: 76, minMargin: 22, minRate: 0.75, risk: "Verifier col, logo et coupe" },
  { id: "puma-speedcat", niche: "sneakers", subcategory: "Puma Speedcat", q: "Puma Speedcat", max: 55, category: "Sneakers", retail: 110, resale: 88, demand: 85, minMargin: 25, minRate: 0.5, risk: "Verifier semelle fine et talon" },
  { id: "puma-h-street", niche: "sneakers", subcategory: "Puma H-Street", q: "Puma H Street", max: 50, category: "Sneakers", retail: 100, resale: 82, demand: 78, minMargin: 22, minRate: 0.5, risk: "Verifier modele exact et usure" },
  { id: "fila-vintage", niche: "sneakers", subcategory: "Fila vintage", q: "Fila vintage sneakers", max: 35, category: "Sneakers", retail: 85, resale: 62, demand: 74, minMargin: 20, minRate: 0.65, risk: "Verifier semelle et jaunissement" },
  { id: "slim-sneakers", niche: "sneakers", subcategory: "Slim sneakers", q: "slim sneakers vintage", max: 35, category: "Sneakers", retail: 85, resale: 62, demand: 76, minMargin: 20, minRate: 0.6, risk: "Verifier usure et marque lisible" },
  { id: "bum-bag-vintage", niche: "accessoires", subcategory: "Sac banane vintage", q: "sac banane vintage logo", max: 16, category: "Accessoires", retail: 45, resale: 34, demand: 76, minMargin: 12, minRate: 0.8, risk: "Verifier zip, taches et sangle" },
  { id: "cap-vintage-logo", niche: "accessoires", subcategory: "Casquette logo", q: "casquette vintage logo", max: 16, category: "Accessoires", retail: 40, resale: 32, demand: 74, minMargin: 10, minRate: 0.7, risk: "Verifier forme, traces et scratch" },
  { id: "sunglasses-y2k", niche: "accessoires", subcategory: "Lunettes Y2K", q: "lunettes y2k vintage", max: 18, category: "Accessoires", retail: 50, resale: 38, demand: 76, minMargin: 14, minRate: 0.8, risk: "Verifier rayures, branches et style portable" }
];

const allScans = Array.from(new Map([...internetNicheScans, ...seasonalScans, ...extraScans, ...scans].map((scan) => [scan.id || scan.q, scan])).values());

const badListingWords = [
  "facture",
  "boite",
  "box",
  "recu",
  "ticket",
  "notice",
  "accessoire",
  "piece",
  "pieces",
  "cass",
  "hs",
  "ne marche pas",
  "defectueux",
  "pour pieces"
];

const aestheticBoostWords = [
  "vintage",
  "retro",
  "brode",
  "logo",
  "ancien",
  "rare",
  "oversize",
  "y2k",
  "gorpcore",
  "acg",
  "torsade",
  "oxford",
  "usa",
  "made in",
  "cuir",
  "vert",
  "bleu",
  "rouge",
  "rose",
  "creme",
  "beige",
  "marine",
  "noir",
  "blanc"
];

const aestheticPenaltyWords = [
  "delave",
  "delavé",
  "tache",
  "taches",
  "trou",
  "troue",
  "troué",
  "abime",
  "abîme",
  "abimee",
  "abîmée",
  "use",
  "usé",
  "sale",
  "sans marque",
  "lot",
  "basique",
  "simple",
  "ancien mais",
  "a reparer",
  "à réparer"
];

function cleanText(value: string) {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&quot;/g, "\"")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function titleFromHref(href: string) {
  const slug = href.split("/items/")[1]?.split("?")[0] || "";
  return decodeURIComponent(slug)
    .replace(/^\d+-?/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function absoluteVintedLink(href: string) {
  if (href.startsWith("http")) return href.split("?")[0];
  return `https://www.vinted.fr${href.split("?")[0]}`;
}

function looksReliable(title: string) {
  const value = title.toLowerCase();
  return !badListingWords.some((word) => value.includes(word));
}

function sellabilityScore(title: string, scan: Scan) {
  const value = title.toLowerCase();
  const titleWords = value.split(/\s+/).filter(Boolean);
  const hasScanBrand = scan.q.toLowerCase().split(/\s+/).some((word) => word.length > 3 && value.includes(word));
  const boosts = aestheticBoostWords.filter((word) => value.includes(word)).length;
  const penalties = aestheticPenaltyWords.filter((word) => value.includes(word)).length;
  const detailScore = Math.min(1.2, Math.max(0, titleWords.length - 3) * 0.18);
  const brandScore = hasScanBrand ? 1.25 : -0.8;
  const styleScore = Math.min(1.6, boosts * 0.35);
  const penaltyScore = penalties * 0.65;
  const categoryScore = ["Outdoor", "Gorpcore", "Workwear", "Sport", "Classique", "Vintage", "Designer"].includes(scan.category) ? 0.45 : 0.2;
  return Math.max(1, Math.min(10, 5.3 + brandScore + styleScore + detailScore + categoryScore - penaltyScore));
}

function extractLinks(html: string) {
  const links = new Map<string, CatalogItem>();
  const regex = /href=["']([^"']*\/items\/[^"']+)["'][^>]*>(.*?)<\/a>/gi;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(html))) {
    const href = absoluteVintedLink(match[1]);
    const title = cleanText(match[2]) || titleFromHref(href);
    const fragment = html.slice(Math.max(0, match.index - 2500), Math.min(html.length, match.index + 3500));
    if (title.length > 4 && looksReliable(title)) {
      links.set(href, {
        link: href,
        title,
        listingPrice: parseNearbyPrice(fragment),
        likes: parseNearbyLikes(fragment),
        imageUrl: parseNearbyImage(fragment),
        postedLabel: parseNearbyPostedLabel(fragment),
        condition: parseNearbyCondition(fragment),
        source: "catalog"
      });
    }
  }

  const bareRegex = /https?:\/\/www\.vinted\.[a-z.]+\/items\/[0-9]+-[^"'\\\s]+/gi;
  while ((match = bareRegex.exec(html))) {
    const href = absoluteVintedLink(match[0]);
    const title = titleFromHref(href);
    const fragment = html.slice(Math.max(0, match.index - 2500), Math.min(html.length, match.index + 3500));
    if (title.length > 4 && looksReliable(title) && !links.has(href)) {
      links.set(href, {
        link: href,
        title,
        listingPrice: parseNearbyPrice(fragment),
        likes: parseNearbyLikes(fragment),
        imageUrl: parseNearbyImage(fragment),
        postedLabel: parseNearbyPostedLabel(fragment),
        condition: parseNearbyCondition(fragment),
        source: "catalog"
      });
    }
  }

  return [...links.values()].slice(0, 5);
}

function parseNearbyPrice(fragment: string) {
  const patterns = [
    /"amount"\s*:\s*"?(\d{1,5}(?:[,.]\d{1,2})?)"?\s*,\s*"currency_code"\s*:\s*"EUR"/i,
    /"price"\s*:\s*\{\s*"amount"\s*:\s*"?(\d{1,5}(?:[,.]\d{1,2})?)"?/i,
    /(\d{1,4}(?:[,.]\d{1,2})?)\s*(?:€|EUR)/i
  ];

  for (const pattern of patterns) {
    const value = Number((pattern.exec(fragment)?.[1] || "").replace(",", "."));
    if (Number.isFinite(value) && value > 0 && value < 5000) return Math.round(value);
  }

  return null;
}

function parseNearbyLikes(fragment: string) {
  return parseFavoriteCount(fragment);
}

function parseNearbyImage(fragment: string) {
  const decoded = fragment
    .replace(/\\u002F/g, "/")
    .replace(/\\\//g, "/")
    .replace(/&amp;/g, "&");
  const patterns = [
    /"(?:url|image_url|image|src)"\s*:\s*"(https?:\/\/[^"]*(?:vinted|vinted\.net|images)[^"]+)"/i,
    /(https?:\/\/images\d*\.vinted\.net\/[^"'\s<>\\]+)/i,
    /(https?:\/\/[^"'\s<>\\]+(?:\.jpg|\.jpeg|\.png|\.webp)(?:\?[^"'\s<>\\]+)?)/i
  ];

  for (const pattern of patterns) {
    const match = decoded.match(pattern);
    if (match?.[1]) return cleanImageUrl(match[1]);
  }

  const srcMatch = decoded.match(/(?:src|data-src)=["']([^"']+)["']/i);
  if (srcMatch?.[1] && srcMatch[1].includes("vinted")) return cleanImageUrl(srcMatch[1]);
  return "";
}

function cleanImageUrl(value: string) {
  return value
    .replace(/\\\//g, "/")
    .replace(/&quot;.*$/g, "")
    .replace(/[),]+$/g, "")
    .trim();
}

function parseNearbyPostedLabel(fragment: string) {
  return parsePostedLabel(fragment);
}

function parseNearbyCondition(fragment: string) {
  return parseConditionLabel(fragment);
}

function extractMetaContent(html: string, property: string) {
  const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i");
  return cleanText(regex.exec(html)?.[1] || "");
}

function parseDetailPrice(html: string) {
  const metaPrice = extractMetaContent(html, "product:price:amount");
  const metaValue = Number(metaPrice.replace(",", "."));
  if (Number.isFinite(metaValue) && metaValue > 0 && metaValue < 5000) return Math.round(metaValue);

  const jsonLd = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const match of jsonLd) {
    try {
      const data = JSON.parse(match[1]);
      const offers = Array.isArray(data.offers) ? data.offers[0] : data.offers;
      const price = Number(String(offers?.price || offers?.lowPrice || "").replace(",", "."));
      if (Number.isFinite(price) && price > 0 && price < 5000) return Math.round(price);
    } catch {}
  }

  const strictPatterns = [
    /"price"\s*:\s*\{\s*"amount"\s*:\s*"?(\d{1,5}(?:[,.]\d{1,2})?)"?/i,
    /"price"\s*:\s*"?(\d{1,5}(?:[,.]\d{1,2})?)"?\s*,\s*"currency/i,
    /"amount"\s*:\s*"?(\d{1,5}(?:[,.]\d{1,2})?)"?\s*,\s*"currency_code"\s*:\s*"EUR"/i
  ];

  for (const pattern of strictPatterns) {
    const value = Number((pattern.exec(html)?.[1] || "").replace(",", "."));
    if (Number.isFinite(value) && value > 0 && value < 5000) return Math.round(value);
  }

  return null;
}

function parseDetailTitle(html: string, fallback: string) {
  return extractMetaContent(html, "og:title")
    .replace(/\s*\|\s*Vinted.*$/i, "")
    .trim() || fallback;
}

function parseDetailImage(html: string) {
  return extractMetaContent(html, "og:image") || extractMetaContent(html, "twitter:image");
}

function parseFavoriteCount(html: string) {
  const patterns = [
    /"favourite_count"\s*:\s*(\d+)/i,
    /"favorite_count"\s*:\s*(\d+)/i,
    /"favorites_count"\s*:\s*(\d+)/i,
    /"likes_count"\s*:\s*(\d+)/i
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(html);
    if (!match?.[1]) continue;
    const value = Number(match[1]);
    if (Number.isFinite(value) && value > 0 && value < 100000) return value;
  }

  return null;
}

function parsePostedLabel(html: string) {
  const text = cleanText(html).toLowerCase();
  const match = text.match(/il y a\s+(?:environ\s+)?[0-9]+\s*(?:seconde|secondes|minute|minutes|heure|heures|jour|jours)/i);
  if (match?.[0]) return match[0].replace(/^./, (letter) => letter.toUpperCase());
  return "";
}

function freshnessScore(postedLabel: string) {
  const value = postedLabel.toLowerCase();
  if (!value) return 0.5;
  if (value.includes("seconde")) return 1;
  const number = Number(value.match(/[0-9]+/)?.[0] || 0);
  if (value.includes("minute")) return number <= 30 ? 1 : 0.85;
  if (value.includes("heure")) return number <= 2 ? 0.82 : number <= 8 ? 0.62 : 0.35;
  if (value.includes("jour")) return number <= 1 ? 0.25 : 0.05;
  return 0.5;
}

function heatSignal(likes: number | null, postedLabel: string, demand: number) {
  const fresh = freshnessScore(postedLabel);
  if (likes !== null) {
    const ratio = likes * fresh;
    if (likes >= 20 && fresh >= 0.6) return "Signal tres chaud: beaucoup de likes recents";
    if (likes >= 8 && fresh >= 0.6) return "Signal chaud: likes rapides";
    if (likes >= 4 && fresh >= 0.35) return "Signal correct: premiers likes";
    return "Signal faible: likes trop bas";
  }
  if (demand >= 88 && fresh >= 0.6) return "Likes masques, mais niche forte + annonce fraiche";
  if (demand >= 84 && fresh >= 0.6) return "Likes masques, niche correcte a verifier";
  return "Signal likes masque: a verifier avant achat";
}

function parseConditionLabel(html: string) {
  const text = cleanText(html).toLowerCase();
  if (text.includes("neuf avec etiquette") || text.includes("neuf avec étiquette")) return "Neuf avec etiquette";
  if (text.includes("neuf sans etiquette") || text.includes("neuf sans étiquette")) return "Neuf sans etiquette";
  if (text.includes("tres bon etat") || text.includes("très bon état")) return "Tres bon etat";
  if (text.includes("bon etat") || text.includes("bon état")) return "Bon etat";
  if (text.includes("satisfaisant")) return "Satisfaisant";
  return "A verifier";
}

function quickDescription(scan: Scan, listingPrice: number, resale: number, likes: number | null, condition: string) {
  const safe = safeBuyPrice(resale);
  const likeText = likes === null ? "likes masques par Vinted" : `${likes} likes lus`;
  return `${scan.subcategory || scan.q}: annonce a ${listingPrice} EUR, revente prudente ${safe.safeResale} EUR, achat max ${safe.maxSafeBuy} EUR, ${likeText}, etat ${condition.toLowerCase()}.`;
}

function likeVelocityLabel(likes: number | null, demand: number) {
  if (likes === null) return demand >= 86 ? "Demande probable forte, likes non lisibles" : "Likes non lisibles";
  if (likes >= 20) return "Tres fort: deja 20+ likes";
  if (likes >= 10) return "Fort: 10+ likes";
  if (likes >= 4) return "Correct: premiers likes visibles";
  return "Faible: peu de likes visibles";
}

function safeBuyPrice(resale: number) {
  const safeResale = Math.round(resale * 0.85);
  return {
    safeResale,
    maxSafeBuy: Math.max(1, Math.floor(safeResale / 2)),
    safetyReserve: Math.max(1, resale - safeResale)
  };
}

function normalizeCatalogItem(item: CatalogItem): DetectedItem | null {
  if (!item.listingPrice) return null;
  return {
    ...item,
    listingPrice: item.listingPrice,
    likes: item.likes ?? null,
    imageUrl: item.imageUrl || "",
    postedLabel: item.postedLabel || "",
    condition: item.condition || "A verifier",
    source: item.source || "catalog"
  };
}

function isDetectedItem(item: DetectedItem | null): item is DetectedItem {
  return Boolean(item?.listingPrice);
}

function readApiPrice(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return Math.round(value);
  if (typeof value === "string") {
    const number = Number(value.replace(",", "."));
    if (Number.isFinite(number)) return Math.round(number);
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return readApiPrice(record.amount || record.value || record.price);
  }
  return null;
}

function readApiText(value: unknown) {
  return typeof value === "string" ? cleanText(value) : "";
}

function readApiImage(item: Record<string, unknown>) {
  const photo = item.photo && typeof item.photo === "object" ? item.photo as Record<string, unknown> : null;
  const photos = Array.isArray(item.photos) ? item.photos : [];
  const firstPhoto = photos[0] && typeof photos[0] === "object" ? photos[0] as Record<string, unknown> : null;
  const source = photo || firstPhoto;
  if (!source) return "";

  const high = source.high_resolution && typeof source.high_resolution === "object" ? source.high_resolution as Record<string, unknown> : null;
  return cleanImageUrl(
    readApiText(source.url)
    || readApiText(source.full_size_url)
    || readApiText(high?.url)
    || readApiText(source.thumbnail_url)
  );
}

function readApiLikes(item: Record<string, unknown>) {
  const raw = item.favourite_count ?? item.favorite_count ?? item.favorites_count ?? item.likes_count;
  const value = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

function readApiCondition(item: Record<string, unknown>) {
  const status = item.status && typeof item.status === "object" ? item.status as Record<string, unknown> : null;
  return readApiText(status?.title) || readApiText(item.status_title) || readApiText(item.status) || "A verifier";
}

function readApiPosted(item: Record<string, unknown>) {
  return readApiText(item.created_at_ts)
    || readApiText(item.created_at)
    || readApiText(item.bumped_at)
    || "Annonce recente";
}

function apiItemToCatalogItem(raw: unknown): CatalogItem | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;
  const id = readApiText(item.id);
  const title = readApiText(item.title);
  const url = readApiText(item.url);
  const price = readApiPrice(item.price) || readApiPrice(item.total_item_price);
  const link = url || (id ? `https://www.vinted.fr/items/${id}` : "");
  const imageUrl = readApiImage(item);
  if (!link || !title || !price || !looksReliable(title)) return null;

  const brand = readApiText(item.brand_title);
  const size = readApiText(item.size_title);
  const fullTitle = [brand, title, size].filter(Boolean).join(" - ");

  return {
    link,
    title: fullTitle || title,
    listingPrice: price,
    likes: readApiLikes(item),
    imageUrl,
    postedLabel: readApiPosted(item),
    condition: readApiCondition(item),
    source: "api"
  };
}

async function fetchApiSearch(scan: Scan) {
  const params = new URLSearchParams({
    search_text: scan.q,
    price_to: String(scan.max),
    order: "newest_first",
    per_page: "48"
  });
  if (scan.min) params.set("price_from", String(scan.min));

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4500);
  try {
    const response = await fetch(`https://www.vinted.fr/api/v2/catalog/items?${params.toString()}`, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.7",
        "Referer": "https://www.vinted.fr/"
      },
      cache: "no-store"
    });
    clearTimeout(timeout);
    if (!response.ok) return [];
    const data = await response.json() as { items?: unknown[] };
    return (data.items || []).map(apiItemToCatalogItem).filter((item): item is CatalogItem => Boolean(item));
  } catch {
    clearTimeout(timeout);
    return [];
  }
}

async function fetchListingDetail(item: CatalogItem): Promise<DetectedItem | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4500);

  try {
    const response = await fetch(item.link, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.7"
      },
      cache: "no-store"
    });
    clearTimeout(timeout);
    if (!response.ok) return null;
    const html = await response.text();
    const listingPrice = parseDetailPrice(html) || item.listingPrice || null;
    const title = parseDetailTitle(html, item.title);
    const imageUrl = parseDetailImage(html) || item.imageUrl || "";
    const likes = parseFavoriteCount(html) ?? item.likes ?? null;
    const postedLabel = parsePostedLabel(html) || item.postedLabel || "";
    const condition = parseConditionLabel(html) || item.condition || "A verifier";
    if (!listingPrice || !looksReliable(title)) return null;
    return { ...item, title, listingPrice, likes, imageUrl, postedLabel, condition, source: "detail" as const };
  } catch {
    clearTimeout(timeout);
    return null;
  }
}

async function fetchSearch(scan: Scan) {
  try {
    const apiItems = await fetchApiSearch(scan);
    if (apiItems.length > 0) {
      return buildOpportunities(scan, apiItems.map(normalizeCatalogItem).filter(isDetectedItem));
    }

    const params = new URLSearchParams({
      search_text: scan.q,
      price_to: String(scan.max),
      order: "newest_first"
    });
    if (scan.min) params.set("price_from", String(scan.min));
    const url = `https://www.vinted.fr/catalog?${params.toString()}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.7"
      },
      cache: "no-store"
    });
    clearTimeout(timeout);
    if (!response.ok) return [];

    const html = await response.text();
    const checkedItems = await Promise.all(extractLinks(html).map(fetchListingDetail));
    return buildOpportunities(scan, checkedItems.filter(isDetectedItem));
  } catch {
    return [];
  }
}

function buildOpportunities(scan: Scan, items: DetectedItem[]) {
  return items
      .filter(isDetectedItem)
      .filter((item) => {
        const price = item.listingPrice;
        const safe = safeBuyPrice(scan.resale);
        const margin = scan.resale - price;
        const marginRate = margin / Math.max(price, 1);
        const sellable = sellabilityScore(item.title, scan);
        const fresh = freshnessScore(item.postedLabel);
        const hasRealSignals = (item.source === "api" || item.source === "detail") && Boolean(item.imageUrl);
        const hasHotLikes = item.likes !== null && item.likes >= 2 && fresh >= 0.25;
        const isUltraFreshMargin = fresh >= 0.75 && marginRate >= Math.max(scan.minRate, 0.6);
        const premiumPrice = price <= safe.maxSafeBuy || marginRate >= Math.max(scan.minRate, 0.55);
        return hasRealSignals && (hasHotLikes || isUltraFreshMargin) && price > 0 && price <= scan.max && premiumPrice && margin >= Math.max(10, Math.round(scan.minMargin * 0.7)) && sellable >= 6.1;
      })
      .map((item, index): LiveOpportunity => {
        const listingPrice = item.listingPrice;
        const likes = item.likes ?? 0;
        const resaleTarget = Math.max(
          listingPrice + 1,
          Math.round(scan.resale * (likes >= 10 ? 1 : 0.9))
        );
        const safe = safeBuyPrice(resaleTarget);
        const margin = resaleTarget - listingPrice;
        const marginRate = margin / Math.max(listingPrice, 1);
        const sellable = sellabilityScore(item.title, scan);
        const likeBoost = likes === null ? 0 : Math.min(0.8, likes / 30);
        const freshBoost = Math.min(0.5, freshnessScore(item.postedLabel) * 0.5);
        const score = Math.max(6.9, Math.min(9.6, 5.9 + marginRate * 0.95 + sellable * 0.2 + likeBoost + freshBoost + (listingPrice <= safe.maxSafeBuy ? 0.6 : 0) - index * 0.1));
        const demandScore = Math.min(98, Math.round(52 + likes * 2.4 + freshnessScore(item.postedLabel) * 18));

        return {
          id: `${scan.q}-${index}-${item.link}`.replace(/\W+/g, "-").slice(0, 90),
          title: item.title || scan.q,
          category: scan.category,
          score: Number(score.toFixed(1)),
          buy: listingPrice,
          listingPrice,
          retail: scan.retail,
          resale: resaleTarget,
          safeResale: safe.safeResale,
          maxSafeBuy: safe.maxSafeBuy,
          safetyReserve: safe.safetyReserve,
          x2Rule: listingPrice * 2 <= safe.safeResale,
          margin,
          marginRate: Number(marginRate.toFixed(2)),
          demand: demandScore,
          likes,
          likeVelocity: heatSignal(likes, item.postedLabel || "", demandScore),
          popularity: Math.min(98, demandScore + 4 - index),
          link: item.link,
          imageUrl: item.imageUrl || "",
          signal: `${item.source === "api" ? "Catalogue Vinted lu" : "Fiche Vinted lue"} + image + prix + style vendable ${sellable.toFixed(1)}/10`,
          reason: `Prix annonce: ${listingPrice} EUR. Likes lus: ${likes}. Revente visee prudente: ${resaleTarget} EUR. Achat max conseille: ${safe.maxSafeBuy} EUR.`,
          risk: scan.risk,
          condition: item.condition || "A verifier",
          sellerSignal: `Si le prix est un peu haut, regarde le dressing vendeur pour tenter un lot et viser -30% a -40%.`,
          spottedAt: `Live ${new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`,
          postedLabel: item.postedLabel || `Detecte a ${new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`,
          quickDescription: quickDescription(scan, listingPrice, resaleTarget, likes, item.condition || "A verifier")
        };
      });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const requestedNiches = (url.searchParams.get("niches") || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const requestedSearches = (url.searchParams.get("searches") || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const selectedScans = allScans
    .filter((scan) => requestedNiches.length === 0 || requestedNiches.includes(scan.niche || ""))
    .filter((scan) => requestedSearches.length === 0 || requestedSearches.includes(scan.id || scan.q))
    .slice(0, 12);
  const activeScans = selectedScans.length > 0 ? selectedScans : allScans.slice(0, 12);
  const results = (await Promise.all(activeScans.map(fetchSearch))).flat();
  const unique = Array.from(new Map(results.map((item) => [item.link, item])).values())
    .sort((a, b) => (b.score - a.score) || (b.margin - a.margin))
    .slice(0, 10);

  return NextResponse.json({
    items: unique,
    checkedAt: new Date().toISOString(),
    live: unique.length > 0,
    message: unique.length > 0
      ? `${unique.length} annonces strictes: prix, image et likes lus sur la fiche.`
      : `Bot actif: ${activeScans.length} filtres scannes. Rien n'est affiche tant que prix + image + vrais likes ne sont pas lus.`,
    activeScans: activeScans.map((scan) => ({ id: scan.id || scan.q, niche: scan.niche || "general", label: scan.subcategory || scan.q, q: scan.q }))
  });
}
