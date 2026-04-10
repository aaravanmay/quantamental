import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { TopNav } from "@/components/TopNav";
import { SettingsProvider } from "@/lib/settings-context";
import { KeyboardShortcuts } from "@/components/KeyboardShortcuts";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains", display: "swap" });

export const metadata: Metadata = {
  title: "Quantamental Architect",
  description: "Quantamental trading system for 4-5 month swing trades",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📊</text></svg>",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrains.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body className="bg-black font-sans text-white antialiased overflow-x-hidden">
        <SettingsProvider>
          <KeyboardShortcuts />
          <TopNav />
          <main>{children}</main>
          <footer className="text-center py-6 text-[11px] text-[#555]" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
            Quantamental Architect — Personal Trading System
          </footer>
        </SettingsProvider>
      </body>
    </html>
  );
}
