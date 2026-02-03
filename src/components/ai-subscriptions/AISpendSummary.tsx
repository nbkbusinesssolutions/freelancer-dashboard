import { Zap, TrendingUp, ArrowUpDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface AISpendSummaryProps {
  totalMonthlySpend: number;
  activeSubscriptions: number;
  sortByCost: boolean;
  onToggleSortByCost: () => void;
}

export default function AISpendSummary({
  totalMonthlySpend,
  activeSubscriptions,
  sortByCost,
  onToggleSortByCost,
}: AISpendSummaryProps) {
  return (
    <Card className="bg-gradient-to-r from-purple-500/10 via-purple-500/5 to-transparent border-purple-500/20">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-purple-500/20 p-3">
              <Zap className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Total Monthly AI Spend
              </p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                ₹{totalMonthlySpend.toLocaleString("en-IN")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 sm:gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{activeSubscriptions}</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
            
            <Button
              variant={sortByCost ? "secondary" : "outline"}
              size="sm"
              onClick={onToggleSortByCost}
              className="gap-2"
            >
              <ArrowUpDown className="h-4 w-4" />
              {sortByCost ? "Sorted by Cost" : "View by Cost"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
