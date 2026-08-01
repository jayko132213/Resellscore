import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { SessionDeviceTracker } from "@/components/session-device-tracker";
import { LoginSuccessToast } from "@/components/login-success-toast";

export const metadata: Metadata = {
  title: "Squishy Need You",
  description: "Boutique kawaii de squishies, dumplings et jouets anti-stress.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/squishy-dumpling.svg",
    shortcut: "/squishy-dumpling.svg",
    apple: "/squishy-dumpling.svg"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <SessionDeviceTracker />
        <LoginSuccessToast />
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
