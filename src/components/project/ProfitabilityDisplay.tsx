import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ProfitabilityDisplayProps {
  projectAmount: number | null | undefined;
  totalHours: number;
  hourlyRate: number | null | undefined;
}

export default function ProfitabilityDisplay({
  projectAmount,
  totalHours,
  hourlyRate,
}: ProfitabilityDisplayProps) {
  if (!projectAmount || !hourlyRate || hourlyRate <= 0) {
    return null;
  }

  const effortCost = totalHours * hourlyRate;
  const profitability = projectAmount - effortCost;
  const marginPercentage = projectAmount > 0 ? (profitability / projectAmount) * 100 : 0;

  let colorClass = "";
  let Icon = Minus;
  let variant: "default" | "secondary" | "destructive" = "secondary";

  if (marginPercentage > 50) {
    colorClass = "text-green-600 dark:text-green-400";
    Icon = TrendingUp;
    variant = "default";
  } else if (marginPercentage >= 20) {
    colorClass = "text-amber-600 dark:text-amber-400";
    Icon = Minus;
    variant = "secondary";
  } else {
    colorClass = "text-red-600 dark:text-red-400";
    Icon = TrendingDown;
    variant = "destructive";
  }

  return (
    <div className="flex items-center gap-2">
      <Icon className={`h-4 w-4 ${colorClass}`} />
      <span className={`text-sm font-medium ${colorClass}`}>
        ₹{profitability.toLocaleString("en-IN")}
      </span>
      <Badge variant={variant} className="text-xs">
        {marginPercentage.toFixed(0)}% margin
      </Badge>
    </div>
  );
}
