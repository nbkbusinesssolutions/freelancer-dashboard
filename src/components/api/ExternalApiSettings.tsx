import * as React from "react";
import { Link2, PlugZap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function readLS(key: string, fallback = "") {
  if (typeof window === "undefined") return fallback;
  return window.localStorage.getItem(key) ?? fallback;
}

function writeLS(key: string, value: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, value);
}

function readBool(key: string) {
  return readLS(key, "0") === "1";
}

function writeBool(key: string, v: boolean) {
  writeLS(key, v ? "1" : "0");
}

export default function ExternalApiSettings() {
  const [open, setOpen] = React.useState(false);

  const [baseUrl, setBaseUrl] = React.useState(() => readLS("externalApiBaseUrl", ""));
  const [apiKeyHeader, setApiKeyHeader] = React.useState(() => readLS("externalApiKeyHeader", "X-API-Key"));
  const [apiKey, setApiKey] = React.useState(() => readLS("externalApiKey", ""));
  const [useMock, setUseMock] = React.useState(() => readBool("useMockApi"));

  const effectiveMode = React.useMemo(() => {
    const hasBase = baseUrl.trim().length > 0;
    if (useMock || !hasBase) return "Mock";
    return "External";
  }, [baseUrl, useMock]);

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-2">
        <PlugZap className="h-4 w-4" />
        <span className="hidden sm:inline">API</span>
        <span className="text-muted-foreground">({effectiveMode})</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" /> External REST API
            </DialogTitle>
            <DialogDescription>
              Lovable only builds UI. Your API must implement the endpoints the UI calls (e.g. <code>/account-vault</code>, <code>/projects</code>,
              <code> /ai-subscriptions</code>) behind the base URL.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="text-sm font-medium">Base URL (include your /api prefix)</div>
              <Input
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://your-service.com/api"
                autoComplete="off"
              />
              <div className="text-xs text-muted-foreground">
                Example: <code>https://example.com/api</code> so the UI request <code>/account-vault</code> becomes <code>.../api/account-vault</code>.
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <div className="text-sm font-medium">API key header name</div>
                <Input value={apiKeyHeader} onChange={(e) => setApiKeyHeader(e.target.value)} placeholder="X-API-Key" autoComplete="off" />
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">API key value</div>
                <Input value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="paste key" autoComplete="off" />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <div className="text-sm font-medium">Use mock API</div>
                <div className="text-xs text-muted-foreground">If enabled (or if Base URL is empty), the UI will read/write to local mock data.</div>
              </div>
              <Switch checked={useMock} onCheckedChange={setUseMock} />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setBaseUrl(readLS("externalApiBaseUrl", ""));
                setApiKeyHeader(readLS("externalApiKeyHeader", "X-API-Key"));
                setApiKey(readLS("externalApiKey", ""));
                setUseMock(readBool("useMockApi"));
                setOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                writeLS("externalApiBaseUrl", baseUrl.trim().replace(/\/$/, ""));
                writeLS("externalApiKeyHeader", apiKeyHeader.trim() || "X-API-Key");
                writeLS("externalApiKey", apiKey);
                writeBool("useMockApi", useMock);
                setOpen(false);
                // Simple way to ensure queries refetch with the new base URL.
                window.location.reload();
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
