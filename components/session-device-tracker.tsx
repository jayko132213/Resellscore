"use client";

import { useEffect } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type DeviceType = "iphone" | "samsung" | "android" | "pc";

function detectDevice(): { type: DeviceType; label: string } {
  if (typeof navigator === "undefined") return { type: "pc", label: "PC" };
  const forcedType = localStorage.getItem("resellscore_device_type");
  const forcedLabel = localStorage.getItem("resellscore_device_label");
  if ((forcedType === "iphone" || forcedType === "samsung" || forcedType === "android" || forcedType === "pc") && forcedLabel) {
    return { type: forcedType, label: forcedLabel };
  }

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
      const currentChoice = session.user.user_metadata?.deviceChoice;
      const deviceChoice = localStorage.getItem("resellscore_device_choice") || "auto";
      if (currentDevice !== device.type || currentChoice !== deviceChoice) {
        await supabase.auth.updateUser({
          data: {
            deviceChoice,
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
