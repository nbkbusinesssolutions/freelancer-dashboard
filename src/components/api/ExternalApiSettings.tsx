import * as React from "react";
import { Link2, PlugZap } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import ExternalApiSettingsPanel from "@/components/api/ExternalApiSettingsPanel";

function readLS(key: string, fallback = "") {
  if (typeof window === "undefined") return fallback;
  return window.localStorage.getItem(key) ?? fallback;
}

function readBool(key: string) {
  return readLS(key, "0") === "1";
}

export default function ExternalApiSettings() {
  const [open, setOpen] = React.useState(false);

  const [baseUrl, setBaseUrl] = React.useState(() => readLS("externalApiBaseUrl", ""));
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

          <ExternalApiSettingsPanel
            onDone={() => {
              setBaseUrl(readLS("externalApiBaseUrl", ""));
              setUseMock(readBool("useMockApi"));
              setOpen(false);
            }}
          />

        </DialogContent>
      </Dialog>
    </>
  );
}
