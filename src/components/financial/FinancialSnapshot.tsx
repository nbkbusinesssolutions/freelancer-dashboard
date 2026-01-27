import * as React from "react";
import { TrendingUp, TrendingDown, Eye, EyeOff, IndianRupee } from "lucide-react";
import { startOfMonth, endOfMonth, addDays, parseISO, isWithinInterval } from "date-fns";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { useInvoices } from "@/hooks/useInvoices";
import { useAISubscriptions } from "@/hooks/useApiData";

const VISIBILITY_KEY = "nbk.financialVisibility";

export default function FinancialSnapshot() {
  const { items: invoices } = useInvoices();
  const aiSubsQ = useAISubscriptions();

  const [showAmounts, setShowAmounts] = React.useState(() => {
    const saved = localStorage.getItem(VISIBILITY_KEY);
    return saved !== "hidden";
  });

  const toggleVisibility = () => {
    const newValue = !showAmounts;
    setShowAmounts(newValue);
    localStorage.setItem(VISIBILITY_KEY, newValue ? "visible" : "hidden");
  };

  const aiSubs = aiSubsQ.data?.items ?? [];

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const next30Days = addDays(now, 30);

  const revenueThisMonth = invoices
    .filter((inv) => {
      if (inv.paymentStatus !== "Paid") return false;
      try {
        const date = parseISO(inv.invoiceDate);
        return isWithinInterval(date, { start: monthStart, end: monthEnd });
      } catch {
        return false;
      }
    })
    .reduce((sum, inv) => sum + (inv.paidAmount ?? 0), 0);

  const upcomingCosts = aiSubs
    .filter((s) => {
      if (!s.endDate || s.manualStatus === "Cancelled") return false;
      try {
        const date = parseISO(s.endDate);
        return isWithinInterval(date, { start: now, end: next30Days });
      } catch {
        return false;
      }
    })
    .length;

  const formatAmount = (amount: number) => {
    if (!showAmounts) return "••••••";
    return `₹${amount.toLocaleString("en-IN")}`;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <IndianRupee className="h-4 w-4" />
              Financial Snapshot
            </CardTitle>
            <CardDescription>Quick overview of money in & out</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleVisibility}
            className="h-8 w-8"
            title={showAmounts ? "Hide amounts" : "Show amounts"}
          >
            {showAmounts ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Revenue (This Month)
            </div>
            <div className="text-2xl font-semibold text-green-600">
              {formatAmount(revenueThisMonth)}
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingDown className="h-4 w-4 text-orange-600" />
              Renewals (Next 30 Days)
            </div>
            <div className="text-2xl font-semibold text-orange-600">
              {upcomingCosts} items
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
