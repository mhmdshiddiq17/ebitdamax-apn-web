import Link from "next/link";
import { redirect } from "next/navigation";
import { KdkmpDailyInput } from "@/components/kdkmp-dashboard/daily-input";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiError } from "@/lib/api";
import { formatDate } from "@/lib/formatters";
import { serverApiFetch } from "@/lib/server-api";
import type { KdkmpDashboardInputResponse } from "@/types/kdkmp-dashboard";

export const dynamic = "force-dynamic";

export default async function KdkmpDashboardInputPage() {
  let data: KdkmpDashboardInputResponse;
  try {
    data = await serverApiFetch<KdkmpDashboardInputResponse>("/kdkmp-dashboard/input");
  } catch (error) {
    if (error instanceof ApiError && error.status === 403) redirect("/dashboard");
    throw error;
  }

  if (!data.kdkmp) {
    return <Card><CardHeader><CardTitle>Data KDKMP belum terhubung</CardTitle><CardDescription>Input harian tersedia setelah akun Manager terhubung ke data KDKMP.</CardDescription></CardHeader></Card>;
  }

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h1 className="font-heading text-2xl font-semibold">Input Harian</h1><p className="text-sm text-muted-foreground">{data.kdkmp.name} · {formatDate(data.business_date)}</p></div>
        <Link href="/dashboard/kdkmp" className={buttonVariants({ variant: "outline" })}>Kembali ke dashboard</Link>
      </div>
      <KdkmpDailyInput data={data} />
    </>
  );
}
