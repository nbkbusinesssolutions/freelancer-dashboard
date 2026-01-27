import * as React from "react";
import { Link2, PlugZap } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DialogDescription,
} from "@/components/ui/dialog";

import ExternalApiSettingsPanel from "@/components/api/ExternalApiSettingsPanel";
import { ResponsiveModal } from "@/components/ui/responsive-modal";

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
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)} className="gap-1.5 text-muted-foreground hover:text-foreground">
        <PlugZap className="h-4 w-4" />
        <span className="hidden sm:inline text-xs">
          {effectiveMode === "Mock" ? "Local" : "Synced"}
        </span>
      </Button>

      <ResponsiveModal
        open={open}
        onOpenChange={setOpen}
        title={
          <span className="flex items-center gap-2">
            <Link2 className="h-5 w-5" /> External REST API
          </span>
        }
        description={
          <DialogDescription>
            Configure external API settings. The API must implement the endpoints the UI calls (e.g. <code>/account-vault</code>, <code>/projects</code>,
            <code> /ai-subscriptions</code>) behind the base URL.
          </DialogDescription>
        }
        contentClassName="max-w-xl"
      >
        <ExternalApiSettingsPanel
          onDone={() => {
            setBaseUrl(readLS("externalApiBaseUrl", ""));
            setUseMock(readBool("useMockApi"));
            setOpen(false);
          }}
        />
      </ResponsiveModal>
    </>
  );
}
