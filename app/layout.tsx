import "./globals.css";
import type { Metadata } from "next";
import { Sidebar } from "../components/Sidebar";
import { MaosProvider } from "../lib/maos-store";
import { CommandPalette } from "../components/CommandPalette";
import { ThemeProvider } from "../components/ThemeProvider";
import { TopBar } from "../components/TopBar";
import { AIPreviewDrawer } from "../components/AIPreviewDrawer";
import { ToastContainer } from "../components/Toast";

export const metadata: Metadata = {
  title: "MAOS — Real-time Operating System",
  description: "MAOS is a real-time operating system that gives leadership a bird's-eye view of an organization's capacity, workload, and outcomes. It clearly separates revenue-producing work from administrative drag, showing where time, people, and effort are actually being spent.",
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
              <ToastContainer />
            </div>
          </MaosProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
