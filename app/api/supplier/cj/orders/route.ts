import { NextResponse } from "next/server";
import { z } from "zod";

const cjBaseUrl = "https://developers.cjdropshipping.com/api2.0/v1";

const orderSchema = z.object({
  orderNumber: z.string().min(3),
  shippingCountryCode: z.string().min(2),
  shippingCountry: z.string().min(2),
  shippingProvince: z.string().optional().default(""),
  shippingCity: z.string().min(1),
  shippingAddress: z.string().min(3),
  shippingZip: z.string().min(2),
  shippingPhone: z.string().optional().default(""),
  shippingCustomerName: z.string().min(2),
  products: z.array(z.object({
    productId: z.string().min(1),
    variantId: z.string().min(1),
    sku: z.string().min(1),
    quantity: z.number().int().positive()
  })).min(1)
});

function token() {
  return process.env.CJ_ACCESS_TOKEN || process.env.CJDROPSHIPPING_ACCESS_TOKEN || "";
}

export async function POST(request: Request) {
  const apiToken = token();
  if (!apiToken) {
    return NextResponse.json({
      created: false,
      message: "CJ_ACCESS_TOKEN manque. La commande est gardee cote site, mais pas encore envoyee chez CJ."
    }, { status: 400 });
  }

  const parsed = orderSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ created: false, error: parsed.error.flatten() }, { status: 400 });
  }

  const order = parsed.data;
  const response = await fetch(`${cjBaseUrl}/shopping/order/createOrderV3`, {
    method: "POST",
    headers: {
      "CJ-Access-Token": apiToken,
      "platformToken": "",
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: JSON.stringify({
      ...order,
      productList: order.products
    })
  });

  const payload = await response.json().catch(() => null);
  return NextResponse.json({ created: response.ok, payload }, { status: response.ok ? 200 : 502 });
}
