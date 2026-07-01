"use client";

import { useEffect } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

function detectDevice() {
  if (typeof navigator === "undefined") return "desktop";
  const userAgent = navigator.userAgent.toLowerCase();
  const touchDevice = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
  const mobileAgent = /android|iphone|ipad|ipod|mobile|windows phone/.test(userAgent);
  return mobileAgent || touchDevice ? "mobile" : "desktop";
}

export function SessionDeviceTracker() {
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    async function sync() {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (!session) return;

      await fetch("/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_token: session.access_token,
          refresh_token: session.refresh_token
        })
      }).catch(() => {});

      const deviceType = detectDevice();
      const currentDevice = session.user.user_metadata?.lastDevice;
      if (currentDevice !== deviceType) {
        await supabase.auth.updateUser({
          data: {
            lastDevice: deviceType,
            lastDeviceLabel: deviceType === "mobile" ? "Téléphone" : "Ordinateur",
            lastDeviceAt: new Date().toISOString()
          }
        }).catch(() => {});
      }
    }

    sync();
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      sync();
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return null;
}
