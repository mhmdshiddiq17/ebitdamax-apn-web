import { notFound, redirect } from "next/navigation";
import { TaskReportsView } from "@/components/kdkmp-monitoring/task-reports-view";
import { ApiError } from "@/lib/api";
import { serverApiFetch } from "@/lib/server-api";
import type { KdkmpMonitoringTasksResponse } from "@/types/kdkmp-monitoring";

export const dynamic = "force-dynamic";

type PageParams = {
  entryID: string;
  date: string;
};

export default async function KdkmpMonitoringTasksPage({ params }: { params: Promise<PageParams> }) {
  const { entryID, date } = await params;

  let data: KdkmpMonitoringTasksResponse;

  try {
    data = await serverApiFetch<KdkmpMonitoringTasksResponse>(`/admin/kdkmp-dashboard/${entryID}/tasks/${date}`);
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 403) {
        redirect("/dashboard");
      }
      if (error.status === 404 || error.status === 422) {
        notFound();
      }
    }
    throw error;
  }

  return <TaskReportsView data={data} />;
}
