import { useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowRight, Clock, CreditCard, Globe, Server, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { UrgencyItem } from "@/lib/urgencyScore";

interface OneThingCardProps {
  item: UrgencyItem;
  onActionComplete?: () => void;
}

function getIcon(type: UrgencyItem["type"]) {
  switch (type) {
    case "overdue_invoice":
    case "pending_invoice":
      return CreditCard;
    case "domain_renewal":
      return Globe;
    case "hosting_renewal":
      return Server;
    case "ai_subscription":
      return Zap;
    case "action_item":
      return Clock;
    default:
      return AlertTriangle;
  }
}

function getTypeLabel(type: UrgencyItem["type"]) {
  switch (type) {
    case "overdue_invoice":
      return "Overdue Invoice";
    case "pending_invoice":
      return "Pending Invoice";
    case "domain_renewal":
      return "Domain Renewal";
    case "hosting_renewal":
      return "Hosting Renewal";
    case "ai_subscription":
      return "AI Subscription";
    case "action_item":
      return "Action Item";
    default:
      return "Urgent";
  }
}

function getGradient(type: UrgencyItem["type"]) {
  switch (type) {
    case "overdue_invoice":
      return "from-red-500/10 via-red-500/5 to-transparent border-red-500/30";
    case "pending_invoice":
      return "from-amber-500/10 via-amber-500/5 to-transparent border-amber-500/30";
    case "domain_renewal":
    case "hosting_renewal":
      return "from-blue-500/10 via-blue-500/5 to-transparent border-blue-500/30";
    case "ai_subscription":
      return "from-purple-500/10 via-purple-500/5 to-transparent border-purple-500/30";
    case "action_item":
      return "from-orange-500/10 via-orange-500/5 to-transparent border-orange-500/30";
    default:
      return "from-muted/50 to-transparent";
  }
}

export default function OneThingCard({ item, onActionComplete }: OneThingCardProps) {
  const navigate = useNavigate();
  const Icon = getIcon(item.type);
  const gradient = getGradient(item.type);

  const handleAction = () => {
    navigate(item.actionLink);
    onActionComplete?.();
  };

  return (
    <Card className={`relative overflow-hidden bg-gradient-to-br ${gradient} border-2`}>
      <CardContent className="p-6 sm:p-8">
        <div className="flex flex-col gap-6">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-background/80 p-3 shadow-sm">
              <Icon className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {getTypeLabel(item.type)}
                </span>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground">
                  Priority Score: {item.urgencyScore.toLocaleString()}
                </span>
              </div>
              <h2 className="mt-2 text-lg font-semibold tracking-tight sm:text-xl">
                {item.title}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {item.context}
              </p>
            </div>
          </div>

          <Button size="lg" className="w-full sm:w-auto sm:self-end gap-2" onClick={handleAction}>
            {item.actionLabel}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
