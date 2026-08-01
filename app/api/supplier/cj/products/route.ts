import { NextResponse } from "next/server";
import { cjSeedQueries, squishyProducts } from "@/lib/squishy-products";

const cjBaseUrl = "https://developers.cjdropshipping.com/api2.0/v1";

function token() {
  return process.env.CJ_ACCESS_TOKEN || process.env.CJDROPSHIPPING_ACCESS_TOKEN || "";
}

export async function GET(request: Request) {
  const apiToken = token();
  const url = new URL(request.url);
  const keyword = url.searchParams.get("keyword") || cjSeedQueries[0];

  if (!apiToken) {
    return NextResponse.json({
      connected: false,
      message: "Ajoute CJ_ACCESS_TOKEN dans Vercel pour chercher les vrais produits fournisseur.",
      seedQueries: cjSeedQueries,
      products: squishyProducts
    });
  }

  const params = new URLSearchParams({
    page: "1",
    size: "20",
    keyWord: keyword,
    features: "enable_category"
  });

  const response = await fetch(`${cjBaseUrl}/product/listV2?${params.toString()}`, {
    headers: {
      "CJ-Access-Token": apiToken,
      "Accept": "application/json"
    },
    cache: "no-store"
  });

  const payload = await response.json().catch(() => null);
  return NextResponse.json({
    connected: response.ok,
    keyword,
    payload
  }, { status: response.ok ? 200 : 502 });
}
