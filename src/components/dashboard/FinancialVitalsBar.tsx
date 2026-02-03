import { CreditCard, TrendingUp, CalendarClock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface FinancialVitalsBarProps {
  totalPendingPayments: number;
  revenueThisMonth: number;
  thirtyDayExpenseHorizon: number;
}

export default function FinancialVitalsBar({
  totalPendingPayments,
  revenueThisMonth,
  thirtyDayExpenseHorizon,
}: FinancialVitalsBarProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Card>
        <CardContent className="flex items-center gap-4 p-4">
          <div className={`rounded-lg p-2.5 ${totalPendingPayments > 0 ? "bg-red-500/10 text-red-600 dark:text-red-400" : "bg-muted"}`}>
            <CreditCard className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Total Pending
            </p>
            <p className={`text-lg font-bold ${totalPendingPayments > 0 ? "text-red-600 dark:text-red-400" : ""}`}>
              ₹{totalPendingPayments.toLocaleString("en-IN")}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center gap-4 p-4">
          <div className="rounded-lg bg-green-500/10 p-2.5 text-green-600 dark:text-green-400">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Revenue This Month
            </p>
            <p className="text-lg font-bold text-green-600 dark:text-green-400">
              ₹{revenueThisMonth.toLocaleString("en-IN")}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center gap-4 p-4">
          <div className="rounded-lg bg-blue-500/10 p-2.5 text-blue-600 dark:text-blue-400">
            <CalendarClock className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              30-Day Expenses
            </p>
            <p className="text-lg font-bold">
              ₹{thirtyDayExpenseHorizon.toLocaleString("en-IN")}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
