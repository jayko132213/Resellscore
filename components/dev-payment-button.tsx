"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PlanKey } from "@/lib/plans";
import { Button } from "./ui/button";

export function DevPaymentButton({ plan, disabled }: { plan: PlanKey; disabled?: boolean }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function simulate() {
    setLoading(true);
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
    const demoMode = supabaseUrl.includes("example.supabase.co") || supabaseKey === "demo-key";

    if (demoMode) {
      const stored = localStorage.getItem("resellscore_demo_user");
      const user = stored ? JSON.parse(stored) : { email: "demo@resellscore.app" };
      localStorage.setItem("resellscore_demo_user", JSON.stringify({ ...user, plan }));
      window.dispatchEvent(new Event("resellscore-user-updated"));
      setLoading(false);
      router.push(plan === "elite" ? "/opportunities" : "/dashboard");
      router.refresh();
      return;
    }

    await fetch("/api/dev/simulate-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan })
    });
    setLoading(false);
    router.push("/dashboard");
    router.refresh();
  }

  return <Button onClick={simulate} disabled={disabled || loading}>{loading ? "Simulation..." : "Simulation paiement"}</Button>;
}
