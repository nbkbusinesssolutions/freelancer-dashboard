import { CheckCircle2, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface AllClearCardProps {
  revenueThisMonth: number;
  completedTasks?: number;
}

export default function AllClearCard({ revenueThisMonth, completedTasks }: AllClearCardProps) {
  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-green-500/10 via-emerald-500/5 to-transparent border-2 border-green-500/30">
      <CardContent className="p-8 sm:p-12 text-center">
        <div className="inline-flex items-center justify-center rounded-full bg-green-500/20 p-4 mb-6">
          <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
        </div>
        
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          All systems stable
        </h2>
        <p className="mt-2 text-lg text-muted-foreground">
          Everything is under control.
        </p>

        <div className="mt-8 flex items-center justify-center gap-2 text-sm">
          <Sparkles className="h-4 w-4 text-amber-500" />
          <span className="font-medium">
            You've invoiced ₹{revenueThisMonth.toLocaleString("en-IN")} this month.
          </span>
        </div>

        {completedTasks !== undefined && completedTasks > 0 && (
          <p className="mt-2 text-sm text-muted-foreground">
            Keep up the great work!
          </p>
        )}
      </CardContent>
    </Card>
  );
}
