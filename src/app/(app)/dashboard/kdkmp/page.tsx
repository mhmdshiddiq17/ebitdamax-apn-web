import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, BarChart3, CalendarDays, CheckCircle2, Clock3, Coins, ClipboardCheck, History, ListChecks, TrendingDown, TrendingUp } from "lucide-react";
import { FinancialMatrix } from "@/components/kdkmp-dashboard/financial-matrix";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ApiError } from "@/lib/api";
import { formatDate, formatRupiah } from "@/lib/formatters";
import { serverApiFetch } from "@/lib/server-api";
import type { KdkmpDashboardResponse } from "@/types/kdkmp-dashboard";

export const dynamic = "force-dynamic";

function money(value: string | null | undefined) {
  const number = Number(value ?? 0);
  return formatRupiah(Number.isFinite(number) ? number : 0);
}

export default async function KdkmpDashboardPage({ searchParams }: { searchParams: Promise<{ date?: string; page?: string }> }) {
  const params = await searchParams;
  const query = new URLSearchParams();
  if (params.date) query.set("date", params.date);
  if (params.page) query.set("page", params.page);

  let dashboard: KdkmpDashboardResponse;
  try {
    dashboard = await serverApiFetch<KdkmpDashboardResponse>(`/kdkmp-dashboard${query.size ? `?${query}` : ""}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 403) redirect("/dashboard");
    throw error;
  }

  if (!dashboard.kdkmp) {
    return <Card><CardHeader><CardTitle>Data KDKMP belum terhubung</CardTitle><CardDescription>Hubungi administrator untuk menghubungkan akun Manager dengan data KDKMP.</CardDescription></CardHeader></Card>;
  }

  const values = dashboard.computed_values;
  const entry = dashboard.today_entry;

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2"><Badge>Manager KDKMP</Badge><span className="text-sm text-muted-foreground">{dashboard.kdkmp.name}</span></div>
          <h1 className="flex items-center gap-2 font-heading text-2xl font-semibold"><BarChart3 className="size-6 text-primary" aria-hidden="true" />Dashboard Gerai</h1>
          <p className="text-sm text-muted-foreground">Ringkasan kinerja {formatDate(dashboard.business_date)}.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard/kdkmp/input" className={buttonVariants()}><ClipboardCheck className="size-4" aria-hidden="true" />Input harian</Link>
          <Link href="/dashboard/tasks" className={buttonVariants({ variant: "outline", className: "border-2 bg-background shadow-sm" })}><ListChecks className="size-4" aria-hidden="true" />Tugas harian</Link>
          <Link href="/meeting-minutes" className={buttonVariants({ variant: "outline", className: "border-2 bg-background shadow-sm" })}><CalendarDays className="size-4" aria-hidden="true" />Meeting</Link>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" data-tour="kdkmp-metrics">
        <Metric icon={TrendingUp} label="Actual revenue" value={money(values.actual_revenue)} />
        <Metric icon={TrendingDown} label="Actual cost" value={money(values.actual_cost)} />
        <Metric icon={CheckCircle2} label="Penyelesaian task" value={`${values.task_completion_rate}%`} />
        <Metric icon={Clock3} label="Ketepatan waktu" value={`${values.time_compliance_rate}%`} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Clock3 className="size-5 text-primary" aria-hidden="true" />Status hari ini</CardTitle>
          <CardDescription>Target revenue {money(values.target_revenue)} · Durasi total {values.total_duration}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-3">
          <div><p className="flex items-center gap-2 text-muted-foreground"><TrendingUp className="size-4" aria-hidden="true" />Plan revenue</p><p className="font-medium tabular-nums">{money(entry?.plan_revenue)}</p>{entry?.plan_revenue_requires_review ? <p className="mt-1 text-xs text-destructive">Perlu review: di bawah target harian.</p> : null}</div>
          <div><p className="flex items-center gap-2 text-muted-foreground"><Coins className="size-4" aria-hidden="true" />EBITDA margin aktual</p><p className="font-medium tabular-nums">{entry?.actual_ebitda_margin ?? "-"}</p></div>
          <div><p className="flex items-center gap-2 text-muted-foreground"><CheckCircle2 className="size-4" aria-hidden="true" />Performance scoring</p><p className="font-medium tabular-nums">{values.performance_scoring ?? "-"}</p></div>
        </CardContent>
      </Card>

      <section className="space-y-3" data-tour="financial-matrix">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="flex items-center gap-2 font-heading text-lg font-semibold"><Coins className="size-5 text-primary" aria-hidden="true" />Matrix biaya</h2><p className="text-sm text-muted-foreground">Pilih tanggal untuk melihat perhitungan harian sebelumnya.</p></div><form className="flex items-center gap-2"><label htmlFor="financial-matrix-date" className="sr-only">Tanggal financial matrix</label><input id="financial-matrix-date" type="date" name="date" aria-label="Tanggal financial matrix" defaultValue={dashboard.financial_matrix_date} max={dashboard.business_date} className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm" /><button type="submit" className={buttonVariants({ variant: "outline", size: "sm" })}><ArrowRight className="size-4" aria-hidden="true" />Tampilkan</button></form></div>
        <FinancialMatrix matrix={dashboard.financial_matrix} />
      </section>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><History className="size-5 text-primary" aria-hidden="true" />Riwayat harian</CardTitle><CardDescription>{dashboard.history.total} catatan sebelum hari ini.</CardDescription></CardHeader>
        <CardContent>
          <Table className="min-w-[640px]">
            <TableHeader><TableRow><TableHead><span className="flex items-center gap-2"><CalendarDays className="size-4" aria-hidden="true" />Tanggal</span></TableHead><TableHead className="text-right"><span className="flex items-center justify-end gap-2"><TrendingUp className="size-4" aria-hidden="true" />Plan revenue</span></TableHead><TableHead className="text-right"><span className="flex items-center justify-end gap-2"><Coins className="size-4" aria-hidden="true" />Actual revenue</span></TableHead><TableHead className="text-right"><span className="flex items-center justify-end gap-2"><CheckCircle2 className="size-4" aria-hidden="true" />Scoring</span></TableHead></TableRow></TableHeader>
            <TableBody>
              {dashboard.history.data.map((item) => <TableRow key={item.id}><TableCell><Link className={buttonVariants({ variant: "outline", size: "sm" })} href={`/dashboard/kdkmp?date=${item.report_date}`}>Lihat {formatDate(item.report_date)}</Link></TableCell><TableCell className="text-right tabular-nums">{money(item.plan_revenue)}</TableCell><TableCell className="text-right tabular-nums">{money(item.actual_revenue)}</TableCell><TableCell className="text-right tabular-nums">{item.performance_scoring ?? "-"}</TableCell></TableRow>)}
              {!dashboard.history.data.length ? <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">Belum ada riwayat harian.</TableCell></TableRow> : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof TrendingUp; label: string; value: string }) {
  return <Card size="sm"><CardContent className="space-y-1"><p className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="size-4" aria-hidden="true" />{label}</p><p className="text-lg font-semibold tabular-nums">{value}</p></CardContent></Card>;
}
