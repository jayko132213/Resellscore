import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getProfilePlan } from "@/lib/subscription";
import type { Profile } from "@/lib/types";

const OWNER_EMAIL = "jayko9045@gmail.com";

function cleanPseudo(value: unknown) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, 24);
}

function isValidPseudo(pseudo: string) {
  return /^[a-zA-Z0-9_.-]{3,24}$/.test(pseudo);
}

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non connecte." }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  let { data: profile } = await admin
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  if (!profile) {
    const { data } = await admin
      .from("profiles")
      .insert({ id: user.id, email: user.email })
      .select("*")
      .single<Profile>();
    profile = data || null;
  }

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      isAdmin: user.email?.toLowerCase() === OWNER_EMAIL
    },
    profile,
    plan: getProfilePlan(profile)
  });
}

export async function PATCH(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non connecte." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const pseudo = cleanPseudo(body.pseudo);
  const avatarUrl = String(body.avatarUrl || "").trim();
  const avatarZoom = Number(body.avatarZoom || 1);

  if (pseudo && !isValidPseudo(pseudo)) {
    return NextResponse.json({
      error: "Pseudo invalide. Utilise 3 a 24 caracteres : lettres, chiffres, tiret, point ou underscore."
    }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();

  if (pseudo) {
    const { data: existing } = await admin
      .from("profiles")
      .select("id")
      .ilike("pseudo", pseudo)
      .neq("id", user.id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "Ce pseudo est deja pris." }, { status: 409 });
    }
  }

  const { data: profile, error } = await admin
    .from("profiles")
    .upsert({
      id: user.id,
      email: user.email,
      pseudo: pseudo || null,
      avatar_url: avatarUrl || null
    }, { onConflict: "id" })
    .select("*")
    .single<Profile>();

  if (error) {
    const duplicate = error.code === "23505";
    return NextResponse.json({
      error: duplicate ? "Ce pseudo est deja pris." : "Impossible de sauvegarder le profil."
    }, { status: duplicate ? 409 : 500 });
  }

  return NextResponse.json({
    profile: {
      ...profile,
      avatarZoom
    },
    plan: getProfilePlan(profile)
  });
}
