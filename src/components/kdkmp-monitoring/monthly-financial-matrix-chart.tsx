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
import { CalendarDays } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDate, formatRupiah } from "@/lib/formatters";
import type { KdkmpMonitoringMatrix, KdkmpMonitoringMatrixPoint, KdkmpMonitoringSelected } from "@/types/kdkmp-monitoring";

type Props = {
  kdkmp: KdkmpMonitoringSelected;
  matrix: KdkmpMonitoringMatrix;
  detailDate: string | null;
  onDateClick: (date: string) => void;
};

function compactMoney(value: number | string) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "-";

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    notation: "compact",
    maximumFractionDigits: 1,
  })
    .format(amount)
    .replace(/\s/g, "");
}

function axisDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short" }).format(new Date(`${value}T00:00:00`));
}

function money(value: number) {
  return Number.isFinite(value) ? formatRupiah(value) : "-";
}

function MonthlyMatrixTooltip({ active, payload }: Partial<TooltipContentProps>) {
  const point = payload?.[0]?.payload as KdkmpMonitoringMatrixPoint | undefined;
  if (!active || !point) return null;

  const rows = [
    ["Plan Cost", money(point.plan_cost)],
    ["Actual Cost", money(point.actual_cost)],
    ["Plan Cost Kumulatif", money(point.cumulative_plan_cost)],
    ["Actual Cost Kumulatif", money(point.cumulative_actual_cost)],
    ["Plan Revenue", money(point.plan_revenue)],
    ["Actual Revenue", money(point.actual_revenue)],
  ];

  return (
    <div className="w-72 rounded-lg border bg-card p-3 text-sm shadow-lg">
      <p className="font-semibold text-foreground">{formatDate(point.date)}</p>
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

export function MonthlyFinancialMatrixChart({ kdkmp, matrix, detailDate, onDateClick }: Props) {
  const handleChartClick = (event: unknown) => {
    const point = (event as { activePayload?: Array<{ payload?: KdkmpMonitoringMatrixPoint }> }).activePayload?.[0]?.payload;
    if (point?.date) {
      onDateClick(point.date);
    }
  };

  return (
    <Card>
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Grafik Akumulasi Harian: {kdkmp.name ?? "-"}</CardTitle>
            <CardDescription>
              KDKMP di Desa {kdkmp.desa ?? "-"}, {formatDate(matrix.start_date)} sampai {formatDate(matrix.end_date)}. Klik titik atau batang
              pada tanggal tertentu untuk membuka rincian KDKMP.
            </CardDescription>
          </div>
          <div className="w-full space-y-2 sm:w-52">
            <Label htmlFor="monitoring-detail-date" className="flex items-center gap-2">
              <CalendarDays className="size-4 text-muted-foreground" aria-hidden="true" />
              Tanggal rincian
            </Label>
            <Select
              items={[{ value: "none", label: "Pilih tanggal" }, ...matrix.points.map((point) => ({ value: point.date, label: formatDate(point.date) }))]}
              value={detailDate ?? "none"}
              onValueChange={(value) => {
                if (value) onDateClick(value);
              }}
            >
              <SelectTrigger id="monitoring-detail-date" className="w-full">
                <SelectValue placeholder="Pilih tanggal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none" disabled>
                  Pilih tanggal
                </SelectItem>
                {matrix.points.map((point) => (
                  <SelectItem key={point.date} value={point.date}>
                    {formatDate(point.date)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!matrix.has_data ? (
          <div className="flex h-72 items-center justify-center rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            Belum ada KDKMP pada cakupan wilayah ini.
          </div>
        ) : (
          <div className="overflow-x-auto pb-2">
            <div className="h-125 min-w-270">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={matrix.points}
                  margin={{ top: 24, right: 28, left: 12, bottom: 30 }}
                  onClick={handleChartClick}
                  className="cursor-pointer"
                  aria-label={`Grafik akumulasi harian ${kdkmp.name ?? ""}`}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={axisDate}
                    minTickGap={22}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                  />
                  <YAxis tickFormatter={compactMoney} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
                  <Tooltip content={<MonthlyMatrixTooltip />} />
                  <Legend verticalAlign="top" height={56} />
                  <Bar dataKey="plan_cost" name="Plan Cost" fill="var(--chart-4)" maxBarSize={28} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="actual_cost" name="Actual Cost" fill="var(--chart-1)" maxBarSize={28} radius={[4, 4, 0, 0]} />
                  <Line
                    type="linear"
                    dataKey="cumulative_plan_cost"
                    name="Plan Cost Kumulatif"
                    stroke="var(--chart-5)"
                    strokeWidth={3}
                    strokeDasharray="2 7"
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="linear"
                    dataKey="cumulative_actual_cost"
                    name="Actual Cost Kumulatif"
                    stroke="var(--chart-2)"
                    strokeWidth={3}
                    strokeDasharray="2 7"
                    dot={{ r: 3 }}
                  />
                  <Line type="linear" dataKey="plan_revenue" name="Plan Revenue" stroke="var(--foreground)" strokeWidth={3} dot={false} />
                  <Line type="linear" dataKey="actual_revenue" name="Actual Revenue" stroke="var(--primary)" strokeWidth={3} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
