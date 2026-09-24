import Link from "next/link";
import { redirect } from "next/navigation";
import { FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiError } from "@/lib/api";
import { formatDate } from "@/lib/formatters";
import { serverApiFetch } from "@/lib/server-api";
import type { Paginated } from "@/types/api";
import type { HistoryDay } from "@/types/task-history";

export const dynamic = "force-dynamic";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export default async function TaskHistoryPage() {
  let history: Paginated<HistoryDay>;

  try {
    history = await serverApiFetch<Paginated<HistoryDay>>("/task-dashboard/completed");
  } catch (error) {
    if (error instanceof ApiError && error.status === 403) {
      redirect("/dashboard");
    }
    throw error;
  }

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Riwayat Tugas</h1>
          <p className="text-sm text-muted-foreground">
            Laporan task selesai 14 hari terakhir beserta ringkasan harian.
          </p>
        </div>
        <Link href="/dashboard/tasks" className={buttonVariants({ variant: "outline", size: "sm" })}>
          Kembali ke Tugas Harian
        </Link>
      </div>

      {history.data.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Belum ada laporan task selesai pada 14 hari terakhir.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {history.data.map((day) => (
            <Card key={day.date}>
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-base">{formatDate(day.date)}</CardTitle>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="outline">Total {day.total_tasks}</Badge>
                    <Badge variant="secondary">Tepat waktu {day.on_time_tasks}</Badge>
                    {day.late_tasks > 0 ? <Badge variant="destructive">Terlambat {day.late_tasks}</Badge> : null}
                  </div>
                </div>
                {day.not_worked_tasks.length > 0 ? (
                  <CardDescription>
                    Tidak dikerjakan: {day.not_worked_tasks.map((item) => item.task?.name ?? "-").join(", ")}
                  </CardDescription>
                ) : null}
              </CardHeader>
              <CardContent className="space-y-2">
                {day.completed_reports.map((report) => (
                  <div
                    key={report.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/70 px-3 py-2"
                  >
                    <div className="space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium">{report.task?.name ?? "Task"}</span>
                        <Badge variant={report.timing_status === "on_time" ? "secondary" : "destructive"}>
                          {report.timing_label}
                        </Badge>
                        {report.manager_self_assigned ? <Badge variant="outline">Dikerjakan manager</Badge> : null}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {report.user ? `${report.user.name} · ` : ""}
                        Durasi: {report.duration_minutes ?? "-"} menit
                        {report.finished_at ? ` · Selesai ${new Date(report.finished_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {report.documents.map((document) => (
                        <a
                          key={`${document.phase}-${document.name}`}
                          href={`${API_BASE}${document.preview_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={buttonVariants({ variant: "outline", size: "sm" })}
                        >
                          <FileText />
                          {document.phase_label}: {document.name}
                        </a>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}

          {history.meta.total_pages > 1 ? (
            <p className="text-sm text-muted-foreground">
              Halaman {history.meta.page} dari {history.meta.total_pages} · {history.meta.total} hari
            </p>
          ) : null}
        </div>
      )}
    </>
  );
}
