import { Link2, Settings as SettingsIcon } from "lucide-react";

import ExternalApiSettingsPanel from "@/components/api/ExternalApiSettingsPanel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <main className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Configure your External REST API connection for NBK Business Dashboard.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" /> External REST API
          </CardTitle>
          <CardDescription>These values are stored in your browser (localStorage) for this device.</CardDescription>
        </CardHeader>
        <CardContent>
          <ExternalApiSettingsPanel />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5" /> Notes
          </CardTitle>
          <CardDescription>Deployment reminders (UI-only).</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            <li>
              For Netlify + React Router, make sure your Netlify site has an SPA redirect (e.g. <code>/*</code> → <code>/index.html</code>).
            </li>
            <li>Keep your API key safe — this UI stores it locally in the browser.</li>
          </ul>
        </CardContent>
      </Card>
    </main>
  );
}
