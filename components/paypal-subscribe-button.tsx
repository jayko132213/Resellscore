"use client";

import { Button } from "./ui/button";
import type { PlanKey } from "@/lib/plans";

export function PaypalSubscribeButton({ plan, disabled }: { plan: PlanKey; disabled?: boolean }) {
  async function createSubscription() {
    const response = await fetch("/api/paypal/create-subscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan })
    });
    const json = await response.json();
    if (json.approveUrl) {
      window.location.href = json.approveUrl;
    }
  }

  return <Button onClick={createSubscription} disabled={disabled}>S'abonner</Button>;
}
