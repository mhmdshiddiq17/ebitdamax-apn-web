import { redirect } from "next/navigation";
import { AnnouncementWorkspace } from "@/components/announcements/announcement-workspace";
import { serverApiFetch } from "@/lib/server-api";
import type { AuthUser } from "@/types/auth";

export const dynamic = "force-dynamic";

export default async function AnnouncementsPage() {
  const user = await serverApiFetch<AuthUser>("/auth/me");
  if (user.role?.level !== "superadmin") redirect("/dashboard");
  return <><div><h1 className="font-heading text-2xl font-semibold">Pengumuman</h1><p className="text-sm text-muted-foreground">Kirim informasi kepada seluruh Manager KDKMP.</p></div><AnnouncementWorkspace /></>;
}
