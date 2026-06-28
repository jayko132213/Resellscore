import { NextResponse } from "next/server";

export async function GET() {
  const unavailableIds = (process.env.OPPORTUNITY_SOLD_IDS || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  return NextResponse.json({
    unavailableIds,
    checkedAt: new Date().toISOString(),
    nextCheckInSeconds: 45,
    source: "scanner-ready",
    mode: process.env.OPPORTUNITY_LIVE_MODE === "true" ? "live" : "local-preview",
    note: process.env.OPPORTUNITY_LIVE_MODE === "true"
      ? "Scanner Vinted actif cote serveur."
      : "Mode local: le site affiche les meilleures recherches. Le scanner live sera actif une fois deploye avec acces reseau."
  });
}
