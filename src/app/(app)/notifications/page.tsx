import { redirect } from "next/navigation";
import { NotificationsWorkspace } from "@/components/notifications/notifications-workspace";
import { ApiError } from "@/lib/api";
import { serverApiFetch } from "@/lib/server-api";
import type { NotificationsResponse } from "@/types/notification";

export const dynamic = "force-dynamic";

async function loadNotifications() {
  try {
    return await serverApiFetch<NotificationsResponse>("/notifications");
  } catch (error) {
    if (error instanceof ApiError && error.status === 403) redirect("/dashboard");
    throw error;
  }
}

export default async function NotificationsPage() {
  const initialData = await loadNotifications();
  return <><div><h1 className="font-heading text-2xl font-semibold">Notifikasi</h1><p className="text-sm text-muted-foreground">Pengumuman penting untuk kegiatan KDKMP Anda.</p></div><NotificationsWorkspace initialData={initialData} /></>;
}
