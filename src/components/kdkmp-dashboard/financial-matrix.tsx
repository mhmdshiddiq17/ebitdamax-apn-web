"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TooltipContentProps } from "recharts";
import { BarChart3, Coins, Gauge, TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRupiah } from "@/lib/formatters";
import type { KdkmpFinancialMatrix, KdkmpFinancialMatrixPoint } from "@/types/kdkmp-dashboard";

type ChartPoint = KdkmpFinancialMatrixPoint & {
  label: string;
  plan_revenue: number | null;
  actual_revenue: number | null;
};

function money(value: number | null) {
  return value == null ? "-" : formatRupiah(value);
}

function compactMoney(value: number | string) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "-";

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount).replace(/\s/g, "");
}

function duration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (!hours) return `${remainder} menit`;
  return remainder ? `${hours} jam ${remainder} menit` : `${hours} jam`;
}

function MatrixTooltip({ active, payload }: Partial<TooltipContentProps>) {
  const point = payload?.[0]?.payload as ChartPoint | undefined;
  if (!active || !point) return null;

  const rows = [
    ["Estimasi", duration(point.estimated_minutes)],
    ["Durasi selesai", duration(point.actual_duration_minutes)],
    ["Plan cost", money(point.plan_cost)],
    ["Actual cost", money(point.actual_cost)],
    ["Plan kumulatif", money(point.cumulative_plan_cost)],
    ["Actual kumulatif", money(point.cumulative_actual_cost)],
  ];

  return (
    <div className="w-64 rounded-lg border bg-card p-3 text-sm shadow-lg">
      <p className="font-semibold text-foreground">Proses {point.process}: {point.task_name}</p>
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-muted-foreground">
        {rows.map(([label, value]) => (
          <div key={label} className="contents">
            <dt>{label}</dt>
            <dd className="text-right font-medium tabular-nums text-foreground">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function FinancialMatrix({ matrix }: { matrix: KdkmpFinancialMatrix }) {
  const chartData: ChartPoint[] = matrix.points.map((point) => ({
    ...point,
    label: `${point.process}. ${point.task_name}`,
    plan_revenue: matrix.plan_revenue,
    actual_revenue: matrix.actual_revenue,
  }));

  return (
    <Card>
      <CardHeader className="gap-3">
        <div>
          <CardTitle className="flex items-center gap-2"><BarChart3 className="size-5 text-primary" aria-hidden="true" />Financial Matrix</CardTitle>
          <CardDescription>Perbandingan biaya dan revenue rencana serta realisasi berdasarkan task hari ini.</CardDescription>
        </div>
        <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <Metric icon={Coins} label="Fixed cost" value={money(matrix.fixed_cost)} />
          <Metric icon={TrendingDown} label="Variable cost" value={money(matrix.total_variable_cost)} />
          <Metric icon={TrendingUp} label="Plan EBITDA" value={money(matrix.plan_ebitda)} />
          <Metric icon={Gauge} label="Actual EBITDA" value={money(matrix.actual_ebitda)} />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {chartData.length ? (
          <div className="overflow-x-auto pb-2" aria-label="Grafik financial matrix">
            <div className="h-115 min-w-240">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 24, right: 28, left: 12, bottom: 88 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis
                    dataKey="label"
                    angle={-42}
                    height={108}
                    interval={0}
                    textAnchor="end"
                    tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                  />
                  <YAxis tickFormatter={compactMoney} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
                  <Tooltip content={<MatrixTooltip />} />
                  <Legend verticalAlign="top" height={48} />
                  <Bar dataKey="plan_cost" name="Plan Cost" fill="var(--chart-4)" maxBarSize={28} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="actual_cost" name="Actual Cost" fill="var(--chart-1)" maxBarSize={28} radius={[4, 4, 0, 0]} />
                  <Line type="linear" dataKey="cumulative_plan_cost" name="Plan Cost Kumulatif" stroke="var(--chart-5)" strokeWidth={3} strokeDasharray="2 7" dot={{ r: 3 }} />
                  <Line type="linear" dataKey="cumulative_actual_cost" name="Actual Cost Kumulatif" stroke="var(--chart-2)" strokeWidth={3} strokeDasharray="2 7" dot={{ r: 3 }} />
                  <Line type="linear" dataKey="plan_revenue" name="Plan Revenue" stroke="var(--foreground)" strokeWidth={3} dot={false} connectNulls={false} />
                  <Line type="linear" dataKey="actual_revenue" name="Actual Revenue" stroke="var(--primary)" strokeWidth={3} dot={false} connectNulls={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">Belum ada task terpilih untuk ditampilkan pada matrix.</p>
        )}

      </CardContent>
    </Card>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Coins; label: string; value: string }) {
  return <div className="rounded-lg bg-muted px-3 py-2"><p className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="size-4" aria-hidden="true" />{label}</p><p className="font-medium tabular-nums">{value}</p></div>;
}
