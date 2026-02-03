import { Link2, Settings as SettingsIcon, Download, Upload, AlertTriangle, Building2 } from "lucide-react";
import * as React from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import ExternalApiSettingsPanel from "@/components/api/ExternalApiSettingsPanel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useBusinessBranding } from "@/hooks/useBusinessBranding";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
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
  "nbk.emailAccounts",
  "nbk.invoices",
  "nbk.businessBranding",
  "nbk.remindersShown",
  "mockApiDb:v1",
  "externalApiBaseUrl",
  "externalApiKey",
  "externalApiKeyHeader",
  "useMockApi",
];

const brandingSchema = z.object({
  businessName: z.string().min(1, "Business name required").max(100),
  tagline: z.string().max(200).optional(),
  logoUrl: z.string().url().optional().or(z.literal("")),
  upiQrUrl: z.string().url().optional().or(z.literal("")),
  upiId: z.string().max(100).optional(),
  mobile: z.string().max(20).optional(),
  address: z.string().max(500).optional(),
  email: z.string().email().optional().or(z.literal("")),
  defaultHourlyRate: z.coerce.number().min(0).optional(),
});

function exportAllData() {
  const exportData: Record<string, unknown> = {
    exportedAt: new Date().toISOString(),
    version: "2.0",
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
  const { branding, update: updateBranding } = useBusinessBranding();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof brandingSchema>>({
    resolver: zodResolver(brandingSchema),
    defaultValues: {
      businessName: branding.businessName,
      tagline: branding.tagline ?? "",
      logoUrl: branding.logoUrl ?? "",
      upiQrUrl: branding.upiQrUrl ?? "",
      upiId: branding.upiId ?? "",
      mobile: branding.mobile ?? "",
      address: branding.address ?? "",
      email: branding.email ?? "",
      defaultHourlyRate: branding.defaultHourlyRate ?? 0,
    },
  });

  React.useEffect(() => {
    form.reset({
      businessName: branding.businessName,
      tagline: branding.tagline ?? "",
      logoUrl: branding.logoUrl ?? "",
      upiQrUrl: branding.upiQrUrl ?? "",
      upiId: branding.upiId ?? "",
      mobile: branding.mobile ?? "",
      address: branding.address ?? "",
      email: branding.email ?? "",
      defaultHourlyRate: branding.defaultHourlyRate ?? 0,
    });
  }, [branding, form]);

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

  function onBrandingSubmit(values: z.infer<typeof brandingSchema>) {
    updateBranding({
      businessName: values.businessName,
      tagline: values.tagline || null,
      logoUrl: values.logoUrl || null,
      upiQrUrl: values.upiQrUrl || null,
      upiId: values.upiId || null,
      mobile: values.mobile || null,
      address: values.address || null,
      email: values.email || null,
      defaultHourlyRate: values.defaultHourlyRate || null,
    });
    toast({ title: "Business branding updated" });
  }

  return (
    <main className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Configure your NBK Control Center.</p>
      </header>

      {/* Business Branding */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" /> Business Branding
          </CardTitle>
          <CardDescription>Configure your business details for invoices and documents.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onBrandingSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="businessName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Name</FormLabel>
                      <FormControl>
                        <Input className="min-h-11" placeholder="Your Business Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tagline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tagline (optional)</FormLabel>
                      <FormControl>
                        <Input className="min-h-11" placeholder="Professional Web Development" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Email (optional)</FormLabel>
                      <FormControl>
                        <Input type="email" className="min-h-11" placeholder="contact@business.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="mobile"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mobile Number (optional)</FormLabel>
                      <FormControl>
                        <Input type="tel" className="min-h-11" placeholder="+91 98765 43210" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="defaultHourlyRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Hourly Rate (for profitability)</FormLabel>
                    <FormControl>
                      <Input type="number" className="min-h-11 max-w-xs" placeholder="500" {...field} />
                    </FormControl>
                    <FormDescription>Your target hourly rate in INR. Used to calculate project profitability.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Address (optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Your business address..." rows={2} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="logoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Logo URL (optional)</FormLabel>
                      <FormControl>
                        <Input className="min-h-11" placeholder="https://example.com/logo.png" {...field} />
                      </FormControl>
                      <FormDescription>Direct URL to your logo image</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="upiQrUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>UPI QR Code URL (optional)</FormLabel>
                      <FormControl>
                        <Input className="min-h-11" placeholder="https://example.com/upi-qr.png" {...field} />
                      </FormControl>
                      <FormDescription>Direct URL to your UPI QR image</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="upiId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>UPI ID (optional)</FormLabel>
                    <FormControl>
                      <Input className="min-h-11" placeholder="yourname@upi" {...field} />
                    </FormControl>
                    <FormDescription>Your UPI payment ID for invoices</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="min-h-11">
                Save Branding
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Data Backup */}
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
            Includes: Projects, invoices, email accounts, action items, and business branding.
          </p>
        </CardContent>
      </Card>

      {/* External API */}
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

      {/* Notes */}
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
            <li>Business branding appears on all generated invoices.</li>
          </ul>
        </CardContent>
      </Card>
    </main>
  );
}
