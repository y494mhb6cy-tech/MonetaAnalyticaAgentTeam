"use client";

import { Card, PageHeader, Button } from "../../components/ui";
import { useLocalStorageBoolean } from "../../lib/storage";
import { resetDemoData } from "../../lib/demo-data";

export default function SettingsPage() {
  const [deepModeEnabled, setDeepModeEnabled] = useLocalStorageBoolean("moneta-analytica-deep-mode", false);

  const handleReset = () => {
    resetDemoData();
    window.location.reload();
  };

  return (
    <div className="space-y-8">
      <PageHeader title="Settings" subtitle="Configure Moneta Analytica OS operational controls and deployment details." />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-4">
          <div className="text-lg font-semibold">API Keys</div>
          <p className="text-sm text-[var(--muted)]">
            Set <span className="text-[var(--text)]">OPENAI_API_KEY</span> as an environment variable. The app never stores keys in the UI.
          </p>
          <div className="text-xs text-[var(--muted)]">Netlify: add the key in Site settings → Environment variables.</div>
        </Card>

        <Card className="space-y-4">
          <div className="text-lg font-semibold">Run Controls</div>
          <p className="text-sm text-[var(--muted)]">Deep Mode is disabled by default to control cost exposure.</p>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Enable Deep Mode</div>
              <div className="text-xs text-[var(--muted)]">Unlock high-depth analysis runs.</div>
            </div>
            <Button variant="outline" onClick={() => setDeepModeEnabled(!deepModeEnabled)}>
              {deepModeEnabled ? "Disable" : "Enable"}
            </Button>
          </div>
        </Card>
      </div>

      <Card className="space-y-4">
        <div className="text-lg font-semibold">Demo Data</div>
        <p className="text-sm text-[var(--muted)]">Reset the local demo dataset to the default seeded state.</p>
        <Button variant="outline" onClick={handleReset}>
          Reset demo data
        </Button>
      </Card>

      <Card className="space-y-2">
        <div className="text-lg font-semibold">Template Management</div>
        <p className="text-sm text-[var(--muted)]">Upload and manage branded DOCX templates (placeholder for MVP).</p>
      </Card>
    </div>
  );
}
