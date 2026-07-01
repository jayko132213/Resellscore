import type { PlanKey } from "./plans";

export type Profile = {
  id: string;
  email: string | null;
  pseudo: string | null;
  avatar_url: string | null;
  plan: PlanKey;
  subscription_status: "inactive" | "active" | "past_due" | "cancelled";
  paypal_subscription_id: string | null;
  manual_expires_at: string | null;
  created_at: string;
};

export type AnalysisResult = {
  globalScore: number;
  priceScore: number;
  conditionScore: number;
  demandScore: number;
  resalePotentialScore: number;
  marginScore: number;
  riskScore: number;
  maxBuyPrice: number;
  recommendedResalePrice: number;
  priceRange: {
    low: number;
    medium: number;
    high: number;
  };
  estimatedMargin: number;
  decision: "Acheter" | "Négocier" | "Éviter";
  summary: string;
  market?: {
    detectedBrand: string;
    detectedCategory: string;
    retailPriceEstimate: number;
    vintedComparablePrice: number;
    demandLevel: "faible" | "moyenne" | "forte" | "très forte";
    conditionImpact: string;
  };
  basis?: {
    comparableListings: number;
    sources: string[];
    confidence: "faible" | "moyenne" | "haute";
  };
  listingWarnings?: {
    label: string;
    severity: "medium" | "high" | "critical";
    reason: string;
  }[];
  negotiationTips: string[];
  optimizedTitle: string;
  optimizedDescription: string;
  disclaimer: string;
};

export type AnalysisRow = {
  id: string;
  user_id: string;
  title: string;
  brand: string | null;
  seller_price: number;
  result: AnalysisResult;
  created_at: string;
};

