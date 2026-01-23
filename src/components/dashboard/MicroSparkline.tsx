import { Line, LineChart } from "recharts";

import { ChartContainer } from "@/components/ui/chart";

export type MicroSparklinePoint = { x: number; y: number };

export default function MicroSparkline({
  data,
  tone = "primary",
  className,
}: {
  data: MicroSparklinePoint[];
  tone?: "primary" | "muted" | "destructive";
  className?: string;
}) {
  const color =
    tone === "destructive"
      ? "hsl(var(--destructive))"
      : tone === "muted"
        ? "hsl(var(--muted-foreground))"
        : "hsl(var(--primary))";

  if (!data.length) return null;

  return (
    <ChartContainer
      className={className}
      config={{
        series: {
          label: "series",
          color,
        },
      }}
    >
      <LineChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
        <Line
          type="monotone"
          dataKey="y"
          stroke="var(--color-series)"
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ChartContainer>
  );
}
