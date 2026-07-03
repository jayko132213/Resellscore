import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/dashboard";
  const redirectTo = new URL(next.startsWith("/") ? next : "/dashboard", requestUrl.origin);
  let response = NextResponse.redirect(redirectTo);

  if (!code) {
    redirectTo.pathname = "/login";
    redirectTo.searchParams.set("error", "google_callback_missing");
    redirectTo.searchParams.set("reason", "missing_code");
    return NextResponse.redirect(redirectTo);
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        }
      }
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    const loginUrl = new URL("/login", requestUrl.origin);
    loginUrl.searchParams.set("error", "google_session_failed");
    loginUrl.searchParams.set("reason", error.message);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}
