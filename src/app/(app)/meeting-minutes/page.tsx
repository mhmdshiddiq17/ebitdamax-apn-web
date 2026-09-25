import { redirect } from "next/navigation";
import { MeetingMinutesWorkspace } from "@/components/meeting-minutes/meeting-minutes-workspace";
import { ApiError } from "@/lib/api";
import { serverApiFetch } from "@/lib/server-api";
import type { MeetingMinutesResponse } from "@/types/meeting-minute";

export const dynamic = "force-dynamic";

async function loadMeetingMinutes() {
  try {
    return await serverApiFetch<MeetingMinutesResponse>("/meeting-minutes");
  } catch (error) {
    if (error instanceof ApiError && error.status === 403) redirect("/dashboard");
    throw error;
  }
}

export default async function MeetingMinutesPage() {
  const result = await loadMeetingMinutes();
  return <><div><h1 className="font-heading text-2xl font-semibold">Meeting Minutes</h1><p className="text-sm text-muted-foreground">Catat rapat dan tindak lanjut KDKMP Anda.</p></div><MeetingMinutesWorkspace initialData={result.data} /></>;
}
