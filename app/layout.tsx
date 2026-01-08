import "./globals.css";
import type { Metadata } from "next";
import { Sidebar } from "../components/Sidebar";

export const metadata: Metadata = {
  title: "Moneta Analytica — Task Rabbits",
  description: "Moneta Analytica Task Rabbits MVP"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex">
          <Sidebar />
          <main className="flex-1 bg-ink-900">
            <div className="px-10 py-8">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
