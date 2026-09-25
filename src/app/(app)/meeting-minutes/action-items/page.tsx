import { redirect } from "next/navigation";
import { ActionItemsWorkspace } from "@/components/meeting-minutes/action-items-workspace";
import { ApiError } from "@/lib/api";
import { serverApiFetch } from "@/lib/server-api";
import type { ActionItemsResponse } from "@/types/meeting-minute";

export const dynamic = "force-dynamic";

async function loadActionItems() {
  try {
    return await serverApiFetch<ActionItemsResponse>("/meeting-minutes/action-items");
  } catch (error) {
    if (error instanceof ApiError && error.status === 403) redirect("/dashboard");
    throw error;
  }
}

export default async function ActionItemsPage() {
  const result = await loadActionItems();
  return <><div><h1 className="font-heading text-2xl font-semibold">Action Items</h1><p className="text-sm text-muted-foreground">Pantau dan perbarui tindak lanjut dari meeting Anda.</p></div><ActionItemsWorkspace initialData={result} /></>;
}
