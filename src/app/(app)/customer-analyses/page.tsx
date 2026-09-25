import { redirect } from "next/navigation";
import { CustomerAnalysisWorkspace } from "@/components/customer-analysis/customer-analysis-workspace";
import { ApiError } from "@/lib/api";
import { serverApiFetch } from "@/lib/server-api";
import type { CustomerAnalysesResponse } from "@/types/customer-analysis";

export const dynamic = "force-dynamic";

async function loadCustomerAnalyses() {
  try {
    return await serverApiFetch<CustomerAnalysesResponse>("/customer-analyses");
  } catch (error) {
    if (error instanceof ApiError && error.status === 403) redirect("/dashboard");
    throw error;
  }
}

export default async function CustomerAnalysesPage() {
  const initialData = await loadCustomerAnalyses();
  return <><div><h1 className="font-heading text-2xl font-semibold">Customer Analysis</h1><p className="text-sm text-muted-foreground">Pahami persona dan kebutuhan pelanggan KDKMP Anda.</p></div><CustomerAnalysisWorkspace initialData={initialData} /></>;
}
