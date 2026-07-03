import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/dashboard";
  const finishUrl = new URL("/auth/finish", requestUrl.origin);

  if (!code) {
    const loginUrl = new URL("/login", requestUrl.origin);
    loginUrl.searchParams.set("error", "google_callback_missing");
    loginUrl.searchParams.set("reason", "missing_code");
    return NextResponse.redirect(loginUrl);
  }

  finishUrl.searchParams.set("code", code);
  finishUrl.searchParams.set("next", next.startsWith("/") ? next : "/dashboard");
  return NextResponse.redirect(finishUrl);
}
