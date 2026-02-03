import * as React from "react";
import { Copy, Check, Mail } from "lucide-react";
import { format, parseISO } from "date-fns";

import { Button } from "@/components/ui/button";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import type { InvoiceItem } from "@/lib/types";

interface SendReminderModalProps {
  invoice: InvoiceItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessName?: string;
}

function generateReminderEmail(invoice: InvoiceItem, businessName: string): string {
  const invoiceDate = format(parseISO(invoice.invoiceDate), "MMMM d, yyyy");
  const dueDate = invoice.dueDate ? format(parseISO(invoice.dueDate), "MMMM d, yyyy") : null;
  
  return `Subject: Friendly Reminder - Invoice ${invoice.invoiceNumber}

Hi ${invoice.clientName},

I hope this message finds you well.

I wanted to follow up regarding Invoice ${invoice.invoiceNumber} dated ${invoiceDate}${dueDate ? `, which was due on ${dueDate}` : ""}.

Invoice Details:
- Invoice Number: ${invoice.invoiceNumber}
- Amount Due: ₹${invoice.balanceDue.toLocaleString("en-IN")}
${invoice.projectName ? `- Project: ${invoice.projectName}` : ""}

If you've already processed this payment, please disregard this reminder. Otherwise, I'd appreciate it if you could arrange for the payment at your earliest convenience.

If you have any questions or need any clarification regarding the invoice, please don't hesitate to reach out.

Thank you for your continued partnership.

Best regards,
${businessName}`;
}

export default function SendReminderModal({
  invoice,
  open,
  onOpenChange,
  businessName = "NBK Business Solutions",
}: SendReminderModalProps) {
  const [copied, setCopied] = React.useState(false);
  const emailContent = generateReminderEmail(invoice, businessName);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(emailContent);
      setCopied(true);
      toast({ title: "Copied to clipboard" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Failed to copy", variant: "destructive" });
    }
  };

  const handleOpenEmailClient = () => {
    const subject = encodeURIComponent(`Friendly Reminder - Invoice ${invoice.invoiceNumber}`);
    const body = encodeURIComponent(emailContent.split("\n\n").slice(1).join("\n\n"));
    const mailto = invoice.clientEmail
      ? `mailto:${invoice.clientEmail}?subject=${subject}&body=${body}`
      : `mailto:?subject=${subject}&body=${body}`;
    window.open(mailto, "_blank");
  };

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title="Send Payment Reminder"
      description={`Invoice ${invoice.invoiceNumber} • ₹${invoice.balanceDue.toLocaleString("en-IN")} due`}
      contentClassName="max-w-2xl"
    >
      <div className="space-y-4">
        <div className="rounded-md border bg-muted/30 p-4">
          <Textarea
            value={emailContent}
            readOnly
            className="min-h-[300px] resize-none border-0 bg-transparent p-0 text-sm focus-visible:ring-0"
          />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={handleCopy} className="gap-2">
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy to Clipboard
              </>
            )}
          </Button>
          <Button onClick={handleOpenEmailClient} className="gap-2">
            <Mail className="h-4 w-4" />
            Open in Email App
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          This reminder will be logged to the invoice history
        </p>
      </div>
    </ResponsiveModal>
  );
}
