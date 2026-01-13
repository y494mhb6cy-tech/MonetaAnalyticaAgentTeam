"use client";

import { Card, PageHeader, Button } from "../../components/ui";
import { SectionLayout } from "../../components/SectionLayout";
import { useMaosStore } from "../../lib/maos-store";
import { useLocalStorageBoolean } from "../../lib/storage";

export default function SettingsPage() {
  const [deepModeEnabled, setDeepModeEnabled] = useLocalStorageBoolean("moneta-analytica-deep-mode", false);
  const { resetDemoData } = useMaosStore();

  return (
    <SectionLayout
      sidebar={
        <div className="space-y-6">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">Settings</div>
            <div className="mt-2 text-lg font-semibold text-[color:var(--text)]">System controls</div>
          </div>
          <div className="space-y-2 text-sm text-[color:var(--muted)]">
            <div>Theme</div>
            <div>Demo data</div>
            <div>Templates</div>
          </div>
        </div>
      }
    >
      <div className="space-y-8">
        <PageHeader
          title="Settings"
          subtitle="Configure MAOS operational controls and deployment details."
        />

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="space-y-4">
            <div className="text-lg font-semibold text-[color:var(--text)]">API Keys</div>
            <p className="text-sm text-[color:var(--muted)]">
              Set <span className="text-[color:var(--text)]">OPENAI_API_KEY</span> as an environment variable. The app never stores keys in the UI.
            </p>
            <div className="text-xs text-[color:var(--muted)]">
              Netlify: add the key in Site settings → Environment variables.
            </div>
          </Card>

          <Card className="space-y-4">
            <div className="text-lg font-semibold text-[color:var(--text)]">Run Controls</div>
            <p className="text-sm text-[color:var(--muted)]">Deep Mode is disabled by default to control cost exposure.</p>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-[color:var(--text)]">Enable Deep Mode</div>
                <div className="text-xs text-[color:var(--muted)]">Unlock high-depth analysis runs.</div>
              </div>
              <Button variant="ghost" onClick={() => setDeepModeEnabled(!deepModeEnabled)}>
                {deepModeEnabled ? "Disable" : "Enable"}
              </Button>
            </div>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="space-y-2">
            <div className="text-lg font-semibold text-[color:var(--text)]">Demo Data</div>
            <p className="text-sm text-[color:var(--muted)]">Reset the seeded demo data and topology links.</p>
            <Button variant="ghost" onClick={resetDemoData}>
              Reset demo data
            </Button>
          </Card>
          <Card className="space-y-2">
            <div className="text-lg font-semibold text-[color:var(--text)]">First-Time Experience</div>
            <p className="text-sm text-[color:var(--muted)]">Reset the MAOS intro to show it again on next visit.</p>
            <Button variant="ghost" onClick={() => {
              localStorage.removeItem("maos_intro_seen");
              window.location.href = "/home";
            }}>
              Reset intro
            </Button>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="space-y-2">
            <div className="text-lg font-semibold text-[color:var(--text)]">Template Management</div>
            <p className="text-sm text-[color:var(--muted)]">Upload and manage branded DOCX templates (placeholder for MVP).</p>
          </Card>
        </div>
      </div>
    </SectionLayout>
  );
}
