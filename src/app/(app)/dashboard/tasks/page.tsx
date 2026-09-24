import { redirect } from "next/navigation";
import Link from "next/link";
import { TaskAttendanceCard } from "@/components/task-dashboard/task-attendance-card";
import { TaskList } from "@/components/task-dashboard/task-list";
import { TaskSummaryCards } from "@/components/task-dashboard/task-summary-cards";
import { buttonVariants } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import { serverApiFetch } from "@/lib/server-api";
import type { AuthUser } from "@/types/auth";
import type { TaskDashboardResponse } from "@/types/task-dashboard";

export const dynamic = "force-dynamic";

type TaskDashboardPageData = {
  dashboard: TaskDashboardResponse;
  user: AuthUser;
};

async function loadTaskDashboard(): Promise<TaskDashboardPageData> {
  const [dashboard, user] = await Promise.all([
    serverApiFetch<TaskDashboardResponse>("/task-dashboard"),
    serverApiFetch<AuthUser>("/auth/me"),
  ]);

  return { dashboard, user };
}

export default async function TaskDashboardPage() {
  let pageData: TaskDashboardPageData;

  try {
    pageData = await loadTaskDashboard();
  } catch (error) {
    if (error instanceof ApiError && error.status === 403) {
      redirect("/dashboard");
    }
    throw error;
  }

  const { dashboard, user } = pageData;
  const isKdkmpManager = user.role?.domain === "kdkmp" && user.role?.slug === "manager";

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Tugas Harian</h1>
          <p className="text-sm text-muted-foreground">
            Task aktif sesuai role Anda pada periode berjalan beserta status pengerjaannya.
          </p>
        </div>
        <Link href="/dashboard/tasks/completed" className={buttonVariants({ variant: "outline", size: "sm" })}>
          Riwayat 14 hari
        </Link>
      </div>

      <TaskSummaryCards summary={dashboard.summary} businessDate={dashboard.business_date} />

      {dashboard.operational_attendance ? (
        <TaskAttendanceCard attendance={dashboard.operational_attendance} inputHref={isKdkmpManager ? "/dashboard/kdkmp/input" : undefined} />
      ) : null}

      <TaskList
        tasks={dashboard.tasks}
        isKdkmpManager={isKdkmpManager}
        attendanceAvailable={dashboard.operational_attendance?.available ?? null}
      />
    </>
  );
}
