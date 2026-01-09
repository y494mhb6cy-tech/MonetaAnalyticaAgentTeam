import "./globals.css";
import type { Metadata } from "next";
import { Sidebar } from "../components/Sidebar";
import { MaosProvider } from "../lib/maos-store";
import { CommandPalette } from "../components/CommandPalette";
import { ThemeProvider } from "../components/ThemeProvider";

export const metadata: Metadata = {
  title: "Moneta Analytica OS — Agents",
  description: "Moneta Analytica OS Agents MVP"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <MaosProvider>
            <div className="min-h-screen flex bg-[var(--bg)] text-[color:var(--text)]">
              <Sidebar />
              <div className="flex-1 min-w-0">
                {children}
              </div>
              <CommandPalette />
            </div>
          </MaosProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
