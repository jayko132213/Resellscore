import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { SessionDeviceTracker } from "@/components/session-device-tracker";

export const metadata: Metadata = {
  title: "ResellScore",
  description: "Analyse une annonce Vinted en quelques secondes et decouvre si elle vaut le coup.",
  icons: {
    icon: "/resellscore-icon.svg",
    shortcut: "/resellscore-icon.svg",
    apple: "/resellscore-icon.svg"
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
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
