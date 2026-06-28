export type ListingWarning = {
  label: string;
  severity: "medium" | "high" | "critical";
  reason: string;
};

const checks: Array<{ label: string; severity: ListingWarning["severity"]; reason: string; patterns: RegExp[] }> = [
  {
    label: "Objet non fonctionnel",
    severity: "critical",
    reason: "Le texte indique que l'article ne marche pas ou n'est pas teste correctement.",
    patterns: [/ne\s+marche\s+pas/i, /fonctionne\s+pas/i, /ne\s+s['’]?allume\s+pas/i, /hs\b/i, /hors\s+service/i, /pour\s+pieces/i, /pour\s+pi[eè]ces/i]
  },
  {
    label: "Pieces manquantes",
    severity: "critical",
    reason: "Le vendeur signale des composants ou accessoires manquants.",
    patterns: [/manque/i, /manquant/i, /sans\s+(?:cable|chargeur|bo[iî]te|boite|accessoire|composant|piece|pi[eè]ce)/i, /pas\s+complet/i]
  },
  {
    label: "Vendeur incertain",
    severity: "high",
    reason: "Le vendeur dit ne pas connaitre l'objet ou ne pas savoir pourquoi il y a un probleme.",
    patterns: [/je\s+m['’]?y\s+connais\s+pas/i, /je\s+ne\s+m['’]?y\s+connais\s+pas/i, /je\s+ne\s+sais\s+pas/i, /je\s+sais\s+pas/i, /aucune\s+idee/i]
  },
  {
    label: "Seulement accessoires",
    severity: "high",
    reason: "L'annonce peut parler d'accessoires, de facture ou de pieces au lieu du produit principal.",
    patterns: [/facture\s+seule/i, /vend\s+la\s+facture/i, /accessoires?\s+seuls?/i, /bo[iî]te\s+seule/i, /sans\s+carte\s+graphique/i]
  },
  {
    label: "Etat a clarifier",
    severity: "medium",
    reason: "Le texte contient un doute sur l'etat reel ou le test du produit.",
    patterns: [/non\s+test[eé]/i, /a\s+tester/i, /test\s+impossible/i, /a\s+reparer/i, /r[eé]paration/i]
  }
];

export function detectListingWarnings(text: string): ListingWarning[] {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return [];

  return checks
    .filter((check) => check.patterns.some((pattern) => pattern.test(normalized)))
    .map(({ label, severity, reason }) => ({ label, severity, reason }));
}

export function warningPenalty(warnings: ListingWarning[]) {
  return warnings.reduce((total, warning) => {
    if (warning.severity === "critical") return total + 3.4;
    if (warning.severity === "high") return total + 2.1;
    return total + 1.1;
  }, 0);
}
