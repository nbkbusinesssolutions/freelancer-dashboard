import * as React from "react";
import { Check, ChevronDown, Circle, AlertTriangle, AlertCircle, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

import { useUpsertProject, useUpsertAISubscription } from "@/hooks/useApiData";
import type { AttentionState } from "@/lib/types";

const ATTENTION_STATES: { value: AttentionState; label: string; icon: React.ReactNode; variant: "default" | "secondary" | "destructive" | "outline" }[] = [
  { value: "stable", label: "Stable", icon: <Circle className="h-3 w-3" />, variant: "outline" },
  { value: "review", label: "Review Soon", icon: <AlertTriangle className="h-3 w-3" />, variant: "secondary" },
  { value: "action", label: "Action Required", icon: <AlertCircle className="h-3 w-3" />, variant: "default" },
  { value: "risk", label: "At Risk", icon: <XCircle className="h-3 w-3" />, variant: "destructive" },
];

interface AttentionStateSelectorProps {
  value: AttentionState;
  onChange?: (value: AttentionState) => void;
  entityType: "project" | "ai-subscription";
  entityId: string;
}

export default function AttentionStateSelector({
  value,
  onChange,
  entityType,
  entityId,
}: AttentionStateSelectorProps) {
  const upsertProject = useUpsertProject();
  const upsertAISub = useUpsertAISubscription();

  const current = ATTENTION_STATES.find((s) => s.value === value) ?? ATTENTION_STATES[0];

  const handleSelect = (newValue: AttentionState) => {
    if (entityType === "project") {
      upsertProject.mutate({ id: entityId, attentionState: newValue });
    } else {
      upsertAISub.mutate({ id: entityId, attentionState: newValue });
    }
    onChange?.(newValue);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 gap-1 px-2">
          <Badge variant={current.variant} className="gap-1">
            {current.icon}
            {current.label}
          </Badge>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {ATTENTION_STATES.map((state) => (
          <DropdownMenuItem
            key={state.value}
            onClick={() => handleSelect(state.value)}
            className="gap-2"
          >
            {state.icon}
            {state.label}
            {state.value === value && <Check className="ml-auto h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AttentionBadge({ value }: { value: AttentionState }) {
  const state = ATTENTION_STATES.find((s) => s.value === value) ?? ATTENTION_STATES[0];
  return (
    <Badge variant={state.variant} className="gap-1">
      {state.icon}
      {state.label}
    </Badge>
  );
}
