import * as React from "react";
import { format } from "date-fns";
import { Printer, FileDown, Image, Loader2 } from "lucide-react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

import type { InvoiceItem } from "@/lib/types";
import { useBusinessBranding } from "@/hooks/useBusinessBranding";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

function statusVariant(status: string) {
  switch (status) {
    case "Paid":
      return "default";
    case "Partial":
      return "secondary";
    case "Overdue":
      return "destructive";
    default:
      return "outline";
  }
}

export default function InvoicePreview({
  invoice,
  open,
  onOpenChange,
}: {
  invoice: InvoiceItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { branding } = useBusinessBranding();
  const { toast } = useToast();
  const printRef = React.useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = React.useState<"pdf" | "image" | null>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = async () => {
    if (!printRef.current) return;
    setExporting("pdf");
    
    try {
      const element = printRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
      });
      
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10;
      
      pdf.addImage(imgData, "PNG", imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`Invoice-${invoice.invoiceNumber}.pdf`);
      
      toast({
        title: "PDF Downloaded",
        description: `Invoice ${invoice.invoiceNumber} saved as PDF`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Could not generate PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setExporting(null);
    }
  };

  const handleExportImage = async () => {
    if (!printRef.current) return;
    setExporting("image");
    
    try {
      const element = printRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
      });
      
      const link = document.createElement("a");
      link.download = `Invoice-${invoice.invoiceNumber}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      
      toast({
        title: "Image Downloaded",
        description: `Invoice ${invoice.invoiceNumber} saved as PNG`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Could not generate image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setExporting(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto p-0">
        <DialogHeader className="sticky top-0 z-10 bg-background border-b px-6 py-4 flex flex-row items-center justify-between">
          <DialogTitle>Invoice Preview</DialogTitle>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExportPDF}
              disabled={exporting !== null}
            >
              {exporting === "pdf" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileDown className="mr-2 h-4 w-4" />
              )}
              PDF
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExportImage}
              disabled={exporting !== null}
            >
              {exporting === "image" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Image className="mr-2 h-4 w-4" />
              )}
              Image
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" /> Print
            </Button>
          </div>
        </DialogHeader>

        {/* Print-friendly invoice layout */}
        <div ref={printRef} className="p-8 bg-white print:p-0" id="invoice-print-area">
          <style>
            {`
              @media print {
                body * { visibility: hidden; }
                #invoice-print-area, #invoice-print-area * { visibility: visible; }
                #invoice-print-area { position: absolute; left: 0; top: 0; width: 100%; }
              }
            `}
          </style>

          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div className="space-y-2">
              {branding.logoUrl ? (
                <img src={branding.logoUrl} alt={branding.businessName} className="h-12 w-auto" />
              ) : (
                <h1 className="text-2xl font-bold text-primary">{branding.businessName}</h1>
              )}
              {branding.tagline && (
                <p className="text-sm text-muted-foreground">{branding.tagline}</p>
              )}
              {branding.address && (
                <p className="text-sm text-muted-foreground whitespace-pre-line">{branding.address}</p>
              )}
              {branding.email && (
                <p className="text-sm text-muted-foreground">{branding.email}</p>
              )}
              {branding.mobile && (
                <p className="text-sm text-muted-foreground">Tel: {branding.mobile}</p>
              )}
            </div>
            <div className="text-right">
              <h2 className="text-3xl font-bold text-primary mb-2">INVOICE</h2>
              <p className="text-lg font-semibold">{invoice.invoiceNumber}</p>
              <Badge variant={statusVariant(invoice.paymentStatus)} className="mt-2">
                {invoice.paymentStatus}
              </Badge>
            </div>
          </div>

          {/* Invoice Details */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Bill To</h3>
              <p className="font-semibold text-lg">{invoice.clientName}</p>
              {invoice.clientEmail && (
                <p className="text-sm text-muted-foreground">{invoice.clientEmail}</p>
              )}
              {invoice.clientAddress && (
                <p className="text-sm text-muted-foreground whitespace-pre-line">{invoice.clientAddress}</p>
              )}
            </div>
            <div className="text-right space-y-2">
              <div>
                <span className="text-sm text-muted-foreground">Invoice Date: </span>
                <span className="font-medium">{format(new Date(invoice.invoiceDate), "MMM dd, yyyy")}</span>
              </div>
              {invoice.dueDate && (
                <div>
                  <span className="text-sm text-muted-foreground">Due Date: </span>
                  <span className="font-medium">{format(new Date(invoice.dueDate), "MMM dd, yyyy")}</span>
                </div>
              )}
              {invoice.projectName && (
                <div>
                  <span className="text-sm text-muted-foreground">Project: </span>
                  <span className="font-medium">{invoice.projectName}</span>
                </div>
              )}
            </div>
          </div>

          {/* Line Items Table */}
          <div className="border rounded-lg overflow-hidden mb-8">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-sm">Description</th>
                  <th className="text-right py-3 px-4 font-medium text-sm w-24">Qty</th>
                  <th className="text-right py-3 px-4 font-medium text-sm w-32">Rate</th>
                  <th className="text-right py-3 px-4 font-medium text-sm w-32">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.lineItems.map((item, idx) => (
                  <tr key={item.id} className={idx % 2 === 0 ? "bg-white" : "bg-muted/20"}>
                    <td className="py-3 px-4">{item.description}</td>
                    <td className="py-3 px-4 text-right">{item.quantity}</td>
                    <td className="py-3 px-4 text-right">₹{item.rate.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right font-medium">₹{item.total.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-8">
            <div className="w-80 space-y-2">
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Subtotal</span>
                <span>₹{invoice.subtotal.toLocaleString()}</span>
              </div>
              {invoice.taxAmount && invoice.taxAmount > 0 && (
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Tax ({invoice.taxRate}%)</span>
                  <span>₹{invoice.taxAmount.toLocaleString()}</span>
                </div>
              )}
              {invoice.discountAmount && invoice.discountAmount > 0 && (
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="text-destructive">-₹{invoice.discountAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between py-3 border-t font-semibold text-lg">
                <span>Grand Total</span>
                <span>₹{invoice.grandTotal.toLocaleString()}</span>
              </div>
              {invoice.paidAmount > 0 && (
                <div className="flex justify-between py-2 text-green-600">
                  <span>Paid Amount</span>
                  <span>₹{invoice.paidAmount.toLocaleString()}</span>
                </div>
              )}
              {invoice.balanceDue > 0 && (
                <div className="flex justify-between py-3 border-t font-bold text-lg text-primary">
                  <span>Balance Due</span>
                  <span>₹{invoice.balanceDue.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Payment Information */}
          {(branding.upiId || branding.upiQrUrl || branding.mobile) && (
            <div className="border-t pt-6 mb-6">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">Payment Information</h3>
              <div className="flex gap-8 items-start">
                {branding.upiQrUrl && (
                  <div className="flex-shrink-0">
                    <img src={branding.upiQrUrl} alt="UPI QR Code" className="w-32 h-32 border rounded" />
                    <p className="text-xs text-center text-muted-foreground mt-1">Scan to pay</p>
                  </div>
                )}
                <div className="space-y-2">
                  {branding.upiId && (
                    <div>
                      <span className="text-sm text-muted-foreground">UPI ID: </span>
                      <span className="font-mono font-medium">{branding.upiId}</span>
                    </div>
                  )}
                  {branding.mobile && (
                    <div>
                      <span className="text-sm text-muted-foreground">Phone: </span>
                      <span className="font-medium">{branding.mobile}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          {invoice.notes && (
            <div className="border-t pt-6">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2">Notes</h3>
              <p className="text-sm whitespace-pre-line">{invoice.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="border-t pt-6 mt-8 text-center text-sm text-muted-foreground">
            <p>Thank you for your business!</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
