import { NextResponse } from "next/server";
import { buildProductPreview, isVintedUrl, readVintedListing } from "@/lib/vinted";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const vintedUrl = String(body.vintedUrl || "").trim();

    if (!vintedUrl) {
      return NextResponse.json({ error: "Colle un lien Vinted." }, { status: 400 });
    }

    if (!isVintedUrl(vintedUrl)) {
      return NextResponse.json({ error: "Le lien doit venir de Vinted." }, { status: 400 });
    }

    const listing = await readVintedListing(vintedUrl);
    if (!listing) {
      return NextResponse.json({ error: "Impossible de lire ce lien Vinted." }, { status: 422 });
    }

    return NextResponse.json({ preview: buildProductPreview(listing) });
  } catch {
    return NextResponse.json({ error: "Lecture du lien impossible." }, { status: 500 });
  }
}
