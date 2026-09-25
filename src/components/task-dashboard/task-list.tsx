"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TaskReportDialog, type TaskReportMode } from "@/components/task-dashboard/task-report-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { DashboardTask, DashboardTaskStatus } from "@/types/task-dashboard";

const STATUS_VARIANT: Record<DashboardTaskStatus, "outline" | "default" | "secondary"> = {
  pending: "outline",
  in_progress: "default",
  completed: "secondary",
};

type Props = {
  tasks: DashboardTask[];
  isKdkmpManager: boolean;
  attendanceAvailable: Record<string, number> | null;
};

export function TaskList({ tasks, isKdkmpManager, attendanceAvailable }: Props) {
  const router = useRouter();
  const [dialog, setDialog] = useState<{ task: DashboardTask; mode: TaskReportMode } | null>(null);

  if (tasks.length === 0) {
    return (
      <section data-tour="task-list">
        <Card>
          <CardContent className="space-y-3 py-10 text-center text-sm text-muted-foreground">
            <p>Belum ada task untuk periode ini.</p>
            {isKdkmpManager ? <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/kdkmp/input")}>Atur pilihan task</Button> : null}
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <>
      <section data-tour="task-list">
        <ul className="space-y-3" aria-label="Daftar task hari ini">
          {tasks.map((task) => (
            <li key={task.id}>
              <Card>
                <CardContent className="space-y-3 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-muted-foreground tabular-nums">{task.sort_order ?? "-"}.</span>
                        <h3 className="font-medium">{task.name}</h3>
                        {task.is_mandatory ? <Badge variant="secondary">Wajib</Badge> : null}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {task.task_category?.name ?? "-"} · {task.bmc_status_label}
                        {task.description ? ` · ${task.description}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={STATUS_VARIANT[task.status]}>{task.status_label}</Badge>
                      {task.status === "pending" ? (
                        <Button size="sm" onClick={() => setDialog({ task, mode: "start" })}>
                          Mulai
                        </Button>
                      ) : null}
                      {task.status === "in_progress" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDialog({ task, mode: "finish" })}
                        >
                          Selesaikan
                        </Button>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
                    <span>Periode: {task.period_label}</span>
                    <span>Estimasi: {task.time_require} menit</span>
                    <span>Jam: {task.execution_time ?? "tanpa jam"}</span>
                    {task.lower_time_threshold_minutes != null && task.upper_time_threshold_minutes != null ? (
                      <span>
                        Ambang: {task.lower_time_threshold_minutes}-{task.upper_time_threshold_minutes} menit
                      </span>
                    ) : null}
                    <span>Field laporan: {task.additional_fields.length}</span>
                    <span>Dokumen: {task.documents.length}</span>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      {dialog ? (
        <TaskReportDialog
          key={`${dialog.task.id}-${dialog.mode}`}
          open
          onOpenChange={(open) => (!open ? setDialog(null) : undefined)}
          task={dialog.task}
          mode={dialog.mode}
          isKdkmpManager={isKdkmpManager}
          attendanceAvailable={attendanceAvailable}
          onDone={() => router.refresh()}
        />
      ) : null}
    </>
  );
}
