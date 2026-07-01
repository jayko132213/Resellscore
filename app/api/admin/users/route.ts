import { NextResponse } from "next/server";
import { getAdminAccess } from "@/lib/admin-owner";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type ProfileRow = {
  id: string;
  email: string | null;
  pseudo: string | null;
  avatar_url: string | null;
  plan: string;
  subscription_status: string;
  manual_expires_at: string | null;
  created_at: string;
};

type AnalysisRow = {
  id: string;
  user_id: string;
  title: string;
  brand: string | null;
  seller_price: number;
  vinted_url: string | null;
  created_at: string;
  result: {
    globalScore?: number;
    decision?: string;
    recommendedResalePrice?: number;
  } | null;
};

export async function GET() {
  const owner = await getAdminAccess();
  if (!owner.allowed) {
    return NextResponse.json({ error: owner.error || "Acces refuse." }, { status: 403 });
  }

  if (owner.demo) {
    return NextResponse.json({
      users: [
        {
          id: "demo-owner",
          email: "jayko9045@gmail.com",
          pseudo: "jayko",
          avatarUrl: "",
          plan: "elite",
          status: "active",
          createdAt: new Date().toISOString(),
          lastSignInAt: new Date().toISOString(),
          analysesCount: 2,
          recentAnalyses: [
            {
              id: "demo-analysis-1",
              title: "Pull Ralph Lauren torsade",
              brand: "Ralph Lauren",
              sellerPrice: 25,
              score: 8.7,
              decision: "Acheter",
              resalePrice: 55,
              url: "",
              createdAt: new Date().toISOString()
            }
          ]
        }
      ]
    });
  }

  const admin = createSupabaseAdminClient();
  const [{ data: authUsers }, { data: profiles }, { data: analyses }] = await Promise.all([
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    admin.from("profiles").select("id,email,pseudo,avatar_url,plan,subscription_status,manual_expires_at,created_at").order("created_at", { ascending: false }).returns<ProfileRow[]>(),
    admin.from("analyses").select("id,user_id,title,brand,seller_price,vinted_url,created_at,result").order("created_at", { ascending: false }).limit(300).returns<AnalysisRow[]>()
  ]);

  const profileById = new Map((profiles || []).map((profile) => [profile.id, profile]));
  const analysesByUser = new Map<string, AnalysisRow[]>();
  for (const analysis of analyses || []) {
    const list = analysesByUser.get(analysis.user_id) || [];
    list.push(analysis);
    analysesByUser.set(analysis.user_id, list);
  }

  const users = (authUsers.users || []).map((authUser) => {
    const profile = profileById.get(authUser.id);
    const userAnalyses = analysesByUser.get(authUser.id) || [];

    return {
      id: authUser.id,
      email: profile?.email || authUser.email || "",
      pseudo: profile?.pseudo || "",
      avatarUrl: profile?.avatar_url || "",
      plan: profile?.plan || "free",
      status: profile?.subscription_status || "inactive",
      manualExpiresAt: profile?.manual_expires_at || null,
      createdAt: profile?.created_at || authUser.created_at,
      lastSignInAt: authUser.last_sign_in_at || null,
      analysesCount: userAnalyses.length,
      recentAnalyses: userAnalyses.slice(0, 5).map((analysis) => ({
        id: analysis.id,
        title: analysis.title,
        brand: analysis.brand,
        sellerPrice: Number(analysis.seller_price || 0),
        score: Number(analysis.result?.globalScore || 0),
        decision: analysis.result?.decision || "",
        resalePrice: Number(analysis.result?.recommendedResalePrice || 0),
        url: analysis.vinted_url || "",
        createdAt: analysis.created_at
      }))
    };
  });

  return NextResponse.json({ users });
}
