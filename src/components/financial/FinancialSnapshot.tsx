import { DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { startOfMonth, endOfMonth, addDays, parseISO, isWithinInterval } from "date-fns";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { useBillingLog } from "@/hooks/useServicesData";
import { useAISubscriptions } from "@/hooks/useApiData";

export default function FinancialSnapshot() {
  const billingQ = useBillingLog();
  const aiSubsQ = useAISubscriptions();

  const billing = billingQ.data?.items ?? [];
  const aiSubs = aiSubsQ.data?.items ?? [];

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const next30Days = addDays(now, 30);

  const revenueThisMonth = billing
    .filter((b) => {
      if (!b.serviceDate || b.paymentStatus !== "Paid") return false;
      try {
        const date = parseISO(b.serviceDate);
        return isWithinInterval(date, { start: monthStart, end: monthEnd });
      } catch {
        return false;
      }
    })
    .reduce((sum, b) => sum + (b.amount ?? 0), 0);

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

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Financial Snapshot</CardTitle>
        <CardDescription>Quick overview of money in & out</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Revenue (This Month)
            </div>
            <div className="text-2xl font-semibold text-green-600">
              ${revenueThisMonth.toLocaleString()}
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
