import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "ResellScore",
  description: "Analyse une annonce Vinted en quelques secondes et decouvre si elle vaut le coup.",
  icons: {
    icon: "/resellscore-icon.svg",
    shortcut: "/resellscore-icon.svg",
    apple: "/resellscore-icon.svg"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
