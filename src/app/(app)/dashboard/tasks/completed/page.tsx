import Link from "next/link";
import { redirect } from "next/navigation";
import { TaskHistoryWorkspace } from "@/components/task-dashboard/task-history-workspace";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ApiError } from "@/lib/api";
import { serverApiFetch } from "@/lib/server-api";
import type { Paginated } from "@/types/api";
import type { HistoryDay } from "@/types/task-history";

export const dynamic = "force-dynamic";

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
          <h1 className="font-heading text-2xl font-semibold">Tugas Selesai</h1>
          <p className="text-sm text-muted-foreground">Ringkasan tugas selesai per tanggal dalam 14 hari terakhir.</p>
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
      ) : <TaskHistoryWorkspace days={history.data} />}
    </>
  );
}
