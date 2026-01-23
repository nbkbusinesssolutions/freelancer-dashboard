import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import MicroSparkline, { type MicroSparklinePoint } from "@/components/dashboard/MicroSparkline";

function toSparkline(values: number[], maxPoints = 14): MicroSparklinePoint[] {
  const trimmed = values.slice(-maxPoints);
  return trimmed.map((y, idx) => ({ x: idx, y }));
}

export type DashboardKpi = {
  title: string;
  value: number;
  actionLabel: string;
  actionTo: string;
  sparkline?: number[];
  tone?: "primary" | "muted" | "destructive";
};

export default function DashboardKpiGrid({ items }: { items: DashboardKpi[] }) {
  const navigate = useNavigate();

  const cards = useMemo(() => items.slice(0, 4), [items]);

  return (
    <section className="grid grid-cols-1 gap-3 md:grid-cols-4">
      {cards.map((kpi) => (
        <Card key={kpi.title} className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">{kpi.title}</CardDescription>
            <div className="flex items-end justify-between gap-3">
              <CardTitle className="font-mono text-3xl tabular-nums">{kpi.value}</CardTitle>
              {kpi.sparkline?.length ? (
                <MicroSparkline
                  tone={kpi.tone ?? "primary"}
                  data={toSparkline(kpi.sparkline)}
                  className="h-10 w-24 opacity-90"
                />
              ) : null}
            </div>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="min-h-11 w-full justify-between"
              onClick={() => navigate(kpi.actionTo)}
            >
              <span>{kpi.actionLabel}</span>
              <span aria-hidden>→</span>
            </Button>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
