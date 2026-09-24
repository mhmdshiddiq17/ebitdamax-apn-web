import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatRupiah } from "@/lib/formatters";
import type { KdkmpFinancialMatrix } from "@/types/kdkmp-dashboard";

function money(value: number | null) {
  return value == null ? "-" : formatRupiah(value);
}

export function FinancialMatrix({ matrix }: { matrix: KdkmpFinancialMatrix }) {
  const maximum = Math.max(...matrix.points.flatMap((point) => [point.cumulative_plan_cost, point.cumulative_actual_cost]), 1);

  return (
    <Card>
      <CardHeader className="gap-3">
        <div>
          <CardTitle>Financial Matrix</CardTitle>
          <CardDescription>Perbandingan akumulasi biaya rencana dan realisasi berdasarkan task hari ini.</CardDescription>
        </div>
        <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Fixed cost" value={money(matrix.fixed_cost)} />
          <Metric label="Variable cost" value={money(matrix.total_variable_cost)} />
          <Metric label="Plan EBITDA" value={money(matrix.plan_ebitda)} />
          <Metric label="Actual EBITDA" value={money(matrix.actual_ebitda)} />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {matrix.points.length ? (
          <div className="space-y-3" aria-label="Grafik cumulative cost financial matrix">
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              <Legend className="bg-primary" label="Plan cost" />
              <Legend className="bg-muted-foreground" label="Actual cost" />
            </div>
            <div className="space-y-3">
              {matrix.points.map((point) => (
                <div key={point.task_id} className="grid gap-1 sm:grid-cols-[minmax(10rem,1fr)_minmax(14rem,2fr)] sm:items-center sm:gap-4">
                  <p className="truncate text-sm" title={point.task_name}>
                    {point.process}. {point.task_name}
                  </p>
                  <div className="space-y-1.5">
                    <Bar label="Plan" value={point.cumulative_plan_cost} maximum={maximum} className="bg-primary" />
                    <Bar label="Actual" value={point.cumulative_actual_cost} maximum={maximum} className="bg-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">Belum ada task terpilih untuk ditampilkan pada matrix.</p>
        )}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task</TableHead>
              <TableHead className="text-right">Estimasi</TableHead>
              <TableHead className="text-right">Plan cost</TableHead>
              <TableHead className="text-right">Actual cost</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {matrix.points.map((point) => (
              <TableRow key={point.task_id}>
                <TableCell className="font-medium">{point.task_name}</TableCell>
                <TableCell className="text-right tabular-nums">{point.estimated_minutes} mnt</TableCell>
                <TableCell className="text-right tabular-nums">{money(point.plan_cost)}</TableCell>
                <TableCell className="text-right tabular-nums">{money(point.actual_cost)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg bg-muted px-3 py-2"><p className="text-xs text-muted-foreground">{label}</p><p className="font-medium tabular-nums">{value}</p></div>;
}

function Legend({ className, label }: { className: string; label: string }) {
  return <span className="flex items-center gap-1.5"><span className={`size-2 rounded-full ${className}`} />{label}</span>;
}

function Bar({ label, value, maximum, className }: { label: string; value: number; maximum: number; className: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-10 text-xs text-muted-foreground">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
        <div className={`h-full rounded-full ${className}`} style={{ width: `${Math.max(0, Math.min(100, value / maximum * 100))}%` }} />
      </div>
      <span className="w-24 text-right text-xs tabular-nums text-muted-foreground">{formatRupiah(value)}</span>
    </div>
  );
}
