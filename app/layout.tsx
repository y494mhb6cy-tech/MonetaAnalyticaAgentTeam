import "./globals.css";
import type { Metadata } from "next";
import { Sidebar } from "../components/Sidebar";
import { MaosProvider } from "../lib/maos-store";
import { CommandPalette } from "../components/CommandPalette";
import { ThemeProvider } from "../components/ThemeProvider";
import { TopBar } from "../components/TopBar";
import { AIPreviewDrawer } from "../components/AIPreviewDrawer";

export const metadata: Metadata = {
  title: "MAOS — Moneta Analytica Agent Team",
  description: "MAOS (Moneta Analytica Agent Team) Agents MVP",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <MaosProvider>
            <div className="min-h-screen flex bg-[var(--bg)] text-[color:var(--text)]">
              <Sidebar />
              <div className="flex-1 min-w-0 pb-20 md:pb-0">
                <TopBar />
                {children}
              </div>
              <CommandPalette />
              <AIPreviewDrawer />
            </div>
          </MaosProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
