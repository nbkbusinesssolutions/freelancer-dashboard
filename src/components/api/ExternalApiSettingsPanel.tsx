import * as React from "react";

import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

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

export default function ExternalApiSettingsPanel({
  onDone,
}: {
  onDone?: () => void;
}) {
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
    <div className="space-y-4">
      <div className="rounded-md border p-3">
        <div className="text-sm font-medium">Current mode</div>
        <div className="text-sm text-muted-foreground">{effectiveMode}</div>
      </div>

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

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setBaseUrl(readLS("externalApiBaseUrl", ""));
            setApiKeyHeader(readLS("externalApiKeyHeader", "X-API-Key"));
            setApiKey(readLS("externalApiKey", ""));
            setUseMock(readBool("useMockApi"));
            onDone?.();
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
            onDone?.();
            // Simple way to ensure queries refetch with the new base URL.
            window.location.reload();
          }}
        >
          Save
        </Button>
      </div>
    </div>
  );
}
