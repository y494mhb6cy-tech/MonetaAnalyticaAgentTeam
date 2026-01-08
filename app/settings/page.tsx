"use client";

import { Card, PageHeader, Button } from "../../components/ui";
import { useLocalStorageBoolean } from "../../lib/storage";

export default function SettingsPage() {
  const [deepModeEnabled, setDeepModeEnabled] = useLocalStorageBoolean("moneta-analytica-deep-mode", false);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Settings"
        subtitle="Configure Moneta Analytica operational controls and deployment details."
      />

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="space-y-4">
          <div className="text-lg font-semibold">API Keys</div>
          <p className="text-sm text-slate-400">
            Set <span className="text-white">OPENAI_API_KEY</span> as an environment variable. The app never stores keys in the UI.
          </p>
          <div className="text-xs text-slate-500">
            Netlify: add the key in Site settings → Environment variables.
          </div>
        </Card>

        <Card className="space-y-4">
          <div className="text-lg font-semibold">Run Controls</div>
          <p className="text-sm text-slate-400">Deep Mode is disabled by default to control cost exposure.</p>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Enable Deep Mode</div>
              <div className="text-xs text-slate-500">Unlock high-depth analysis runs.</div>
            </div>
            <Button variant="ghost" onClick={() => setDeepModeEnabled(!deepModeEnabled)}>
              {deepModeEnabled ? "Disable" : "Enable"}
            </Button>
          </div>
        </Card>
      </div>

      <Card className="space-y-2">
        <div className="text-lg font-semibold">Template Management</div>
        <p className="text-sm text-slate-400">Upload and manage branded DOCX templates (placeholder for MVP).</p>
      </Card>
    </div>
  );
}
