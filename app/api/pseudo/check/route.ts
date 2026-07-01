import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function cleanPseudo(value: unknown) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, 24);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const pseudo = cleanPseudo(body.pseudo);

  if (!pseudo) return NextResponse.json({ available: true });

  if (!/^[a-zA-Z0-9_.-]{3,24}$/.test(pseudo)) {
    return NextResponse.json({
      available: false,
      error: "Pseudo invalide. Utilise 3 a 24 caracteres : lettres, chiffres, tiret, point ou underscore."
    }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("id")
    .ilike("pseudo", pseudo)
    .maybeSingle();

  return NextResponse.json({ available: !data });
}
