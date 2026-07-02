"use client";

import { useEffect } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type DeviceType = "iphone" | "samsung" | "android" | "pc";

function detectDevice(): { type: DeviceType; label: string } {
  if (typeof navigator === "undefined") return { type: "pc", label: "PC" };

  const userAgent = navigator.userAgent.toLowerCase();
  const platform = navigator.platform?.toLowerCase() || "";
  const touchDevice = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
  const isIphone = /iphone|ipod/.test(userAgent) || (platform === "macintel" && touchDevice);
  const isSamsung = /samsung|sm-|gt-|galaxy/.test(userAgent);
  const isAndroid = /android|mobile|windows phone/.test(userAgent);

  if (isIphone) return { type: "iphone", label: "iPhone" };
  if (isSamsung) return { type: "samsung", label: "Samsung" };
  if (isAndroid || touchDevice) return { type: "android", label: "Android" };
  return { type: "pc", label: "PC" };
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

      const device = detectDevice();
      const currentDevice = session.user.user_metadata?.lastDevice;
      if (currentDevice !== device.type) {
        await supabase.auth.updateUser({
          data: {
            lastDevice: device.type,
            lastDeviceLabel: device.label,
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
