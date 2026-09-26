import { redirect } from "next/navigation";
import { KdkmpMonitoringDashboard } from "@/components/kdkmp-monitoring/monitoring-dashboard";
import { ApiError } from "@/lib/api";
import { serverApiFetch } from "@/lib/server-api";
import type { KdkmpMonitoringResponse } from "@/types/kdkmp-monitoring";

export const dynamic = "force-dynamic";

export default async function KdkmpMonitoringPage() {
  let data: KdkmpMonitoringResponse;

  try {
    data = await serverApiFetch<KdkmpMonitoringResponse>("/admin/kdkmp-dashboard");
  } catch (error) {
    if (error instanceof ApiError && error.status === 403) {
      redirect("/dashboard");
    }
    throw error;
  }

  return (
    <>
      <div>
        <h1 className="font-heading text-2xl font-semibold">Monitoring KDKMP</h1>
        <p className="text-sm text-muted-foreground">Pantau pengisian dan pencapaian harian KDKMP sesuai cakupan wilayah Anda.</p>
      </div>

      <KdkmpMonitoringDashboard initialData={data} />
    </>
  );
}
