export type SquishyProduct = {
  slug: string;
  name: string;
  tagline: string;
  category: string;
  mood: string;
  cost: number;
  price: number;
  compareAt: number;
  colors: string[];
  image: string;
  cjKeyword: string;
  copy: string;
  bullets: string[];
};

export const squishyProducts: SquishyProduct[] = [
  {
    slug: "dumpling-mochi-squish",
    name: "Dumpling Mochi Squish",
    tagline: "Le petit dumpling tout rond qu'on presse sans reflechir.",
    category: "Dumplings",
    mood: "Ultra mignon",
    cost: 2.4,
    price: 11.9,
    compareAt: 16.9,
    colors: ["#fff4d8", "#ffb3cf", "#94f5c4"],
    image: "/squishy-dumpling.svg",
    cjKeyword: "dumpling squishy toy",
    copy: "Un squishy mochi doux, rebondissant et facile a glisser dans un sac. Parfait pour les bureaux, les trousses, les cadeaux surprise et les petites pauses anti-stress.",
    bullets: ["Texture lente et moelleuse", "Format poche", "Cadeau kawaii facile"]
  },
  {
    slug: "bear-bubble-squishy",
    name: "Bear Bubble Squishy",
    tagline: "Un ourson pastel avec une bouille qui vend toute seule.",
    category: "Animaux",
    mood: "Best-seller potentiel",
    cost: 2.9,
    price: 13.9,
    compareAt: 18.9,
    colors: ["#ffc7e8", "#b8f7ff", "#fff59d"],
    image: "/squishy-bear.svg",
    cjKeyword: "bear squishy slow rising",
    copy: "Un ourson squishy tres visuel, pense pour les photos TikTok et les paniers cadeaux. Sa forme ronde et ses couleurs douces donnent tout de suite envie de le tester.",
    bullets: ["Look cadeau", "Bon pour reels/TikTok", "Marge forte"]
  },
  {
    slug: "peach-cream-stress-ball",
    name: "Peach Cream Stress Ball",
    tagline: "La petite boule peche creme pour les mains nerveuses.",
    category: "Anti-stress",
    mood: "Bureau et cours",
    cost: 1.8,
    price: 8.9,
    compareAt: 12.9,
    colors: ["#ffb199", "#ffe29f", "#ffd6e9"],
    image: "/squishy-peach.svg",
    cjKeyword: "peach stress ball squishy",
    copy: "Un anti-stress simple, coloré et addictif. Prix bas, facile a acheter en pack, parfait pour les commandes impulsives et les petits cadeaux.",
    bullets: ["Petit prix", "Achat impulsif", "Packable"]
  },
  {
    slug: "cat-paw-pudding",
    name: "Cat Paw Pudding",
    tagline: "Une patte de chat pudding, douce et trop satisfaisante.",
    category: "Kawaii",
    mood: "Cute max",
    cost: 2.2,
    price: 10.9,
    compareAt: 15.9,
    colors: ["#f9a8d4", "#fde68a", "#bfdbfe"],
    image: "/squishy-paw.svg",
    cjKeyword: "cat paw squishy toy",
    copy: "Un squishy patte de chat qui marche bien en cadeau, en deco de bureau ou en anti-stress. C'est lisible en une seconde: mignon, doux, facile a offrir.",
    bullets: ["Forme tres claire", "Bon cadeau", "Visuel mignon"]
  },
  {
    slug: "jelly-duck-squeeze",
    name: "Jelly Duck Squeeze",
    tagline: "Un canard jelly transparent pour un effet wow direct.",
    category: "Jelly",
    mood: "Satisfaisant",
    cost: 3.1,
    price: 14.9,
    compareAt: 19.9,
    colors: ["#fde047", "#67e8f9", "#fb7185"],
    image: "/squishy-duck.svg",
    cjKeyword: "jelly duck stress toy",
    copy: "Un jouet anti-stress avec un aspect jelly brillant, parfait pour se demarquer des squishies classiques. Le genre de produit qu'on comprend tout de suite en photo.",
    bullets: ["Effet jelly", "Tres photogenique", "Differenciant"]
  },
  {
    slug: "mini-boba-squish-pack",
    name: "Mini Boba Squish Pack",
    tagline: "Un pack de mini boba a offrir ou collectionner.",
    category: "Packs",
    mood: "Panier moyen",
    cost: 4.6,
    price: 19.9,
    compareAt: 26.9,
    colors: ["#c084fc", "#f0abfc", "#86efac"],
    image: "/squishy-boba.svg",
    cjKeyword: "boba squishy pack",
    copy: "Un pack plus rentable qu'un seul squishy: plusieurs couleurs, plus de valeur percue et meilleur panier moyen. Ideal pour les cadeaux d'anniversaire.",
    bullets: ["Pack rentable", "Plusieurs couleurs", "Cadeau pret"]
  }
];

export const cjSeedQueries = [
  "dumpling squishy toy",
  "bear squishy slow rising",
  "mochi squishy animal",
  "cat paw squishy toy",
  "kawaii stress ball",
  "boba squishy pack",
  "jelly stress toy",
  "cute squeeze toy",
  "food squishy slow rising",
  "mini squishy bulk"
];

export function margin(product: SquishyProduct) {
  return Number((product.price - product.cost).toFixed(2));
}

export function marginRate(product: SquishyProduct) {
  return Math.round((margin(product) / product.price) * 100);
}
