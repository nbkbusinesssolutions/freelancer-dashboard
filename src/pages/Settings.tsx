import { Link2, Settings as SettingsIcon, Download, Upload, AlertTriangle } from "lucide-react";
import * as React from "react";

import ExternalApiSettingsPanel from "@/components/api/ExternalApiSettingsPanel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const STORAGE_KEYS = [
  "nbk.actions",
  "nbk.projectLogs",
  "nbk.masterList.servicesCatalog",
  "nbk.masterList.billingLog",
  "nbk.emailAccounts",
  "nbk.remindersShown",
  "externalApiBaseUrl",
  "externalApiKey",
  "externalApiKeyHeader",
  "useMockApi",
];

function exportAllData() {
  const exportData: Record<string, unknown> = {
    exportedAt: new Date().toISOString(),
    version: "1.0",
    data: {},
  };

  STORAGE_KEYS.forEach((key) => {
    const value = localStorage.getItem(key);
    if (value) {
      try {
        (exportData.data as Record<string, unknown>)[key] = JSON.parse(value);
      } catch {
        (exportData.data as Record<string, unknown>)[key] = value;
      }
    }
  });

  return exportData;
}

function downloadJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function SettingsPage() {
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const data = exportAllData();
    const date = new Date().toISOString().split("T")[0];
    downloadJson(data, `nbk-backup-${date}.json`);
    toast({
      title: "Data Exported",
      description: "Your data has been downloaded as a JSON file.",
    });
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        
        if (!json.data || typeof json.data !== "object") {
          throw new Error("Invalid backup file format");
        }

        Object.entries(json.data).forEach(([key, value]) => {
          if (STORAGE_KEYS.includes(key)) {
            localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value));
          }
        });

        toast({
          title: "Data Imported",
          description: "Your data has been restored. Refreshing page...",
        });

        setTimeout(() => window.location.reload(), 1500);
      } catch (err) {
        toast({
          title: "Import Failed",
          description: "The file format is invalid or corrupted.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <main className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Configure your NBK Control Center.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" /> Data Backup
          </CardTitle>
          <CardDescription>Export or import your local data to prevent data loss.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button onClick={handleExport} className="gap-2">
              <Download className="h-4 w-4" />
              Export All Data
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Upload className="h-4 w-4" />
                  Import Data
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    Import Data
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This will replace your current local data with the imported backup. 
                    This action cannot be undone. Make sure to export your current data first if needed.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleImportClick}>
                    Choose File
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Includes: Action items, project logs, billing records, email accounts, and settings.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" /> External REST API
          </CardTitle>
          <CardDescription>Connect to an external API for data persistence across devices.</CardDescription>
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
          <CardDescription>Deployment reminders.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            <li>This app stores data locally in your browser by default.</li>
            <li>Export your data regularly to prevent data loss.</li>
            <li>Configure an external API for cloud sync if needed.</li>
          </ul>
        </CardContent>
      </Card>
    </main>
  );
}
