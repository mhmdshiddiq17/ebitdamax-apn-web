"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileDown, Pencil, Plus, Search, Trash2, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MeetingMinuteFormDialog } from "@/components/meeting-minutes/meeting-minute-form-dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";
import { formatDate } from "@/lib/formatters";
import { MEETING_ITEM_STATUS_LABELS, type MeetingMinute, type MeetingMinutesResponse } from "@/types/meeting-minute";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

type Props = { initialData: MeetingMinute[] };

function attachmentURL(path: string) {
  return `${API_BASE}${path}`;
}

function statusVariant(status: string) {
  return status === "completed" ? "default" : status === "cancelled" ? "outline" : status === "in_progress" ? "secondary" : "outline";
}

export function MeetingMinutesWorkspace({ initialData }: Props) {
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<MeetingMinute | null>(null);
  const [deleting, setDeleting] = useState<MeetingMinute | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const { data, isFetching } = useQuery({
    queryKey: ["meeting-minutes", search],
    queryFn: () => apiFetch<MeetingMinutesResponse>(`/meeting-minutes${search ? `?search=${encodeURIComponent(search)}` : ""}`),
    initialData: search === "" ? { data: initialData } : undefined,
    placeholderData: (previous) => previous,
  });
  const meetings = data?.data ?? [];

  const deleteMutation = useMutation({
    mutationFn: (meeting: MeetingMinute) => apiFetch(`/meeting-minutes/${meeting.id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Meeting minutes dihapus.");
      setDeleting(null);
      void queryClient.invalidateQueries({ queryKey: ["meeting-minutes"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Gagal menghapus meeting minutes");
      setDeleting(null);
    },
  });

  async function upload(meetingID: number, files: FileList | null) {
    if (!files?.length) return;
    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append("documents", file));
    try {
      await apiFetch(`/meeting-minutes/${meetingID}/attachments`, { method: "POST", body: formData });
      toast.success("Lampiran diunggah.");
      void queryClient.invalidateQueries({ queryKey: ["meeting-minutes"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal mengunggah lampiran");
    }
  }

  async function deleteAttachment(meetingID: number, attachmentID: number) {
    try {
      await apiFetch(`/meeting-minutes/${meetingID}/attachments/${attachmentID}`, { method: "DELETE" });
      toast.success("Lampiran dihapus.");
      void queryClient.invalidateQueries({ queryKey: ["meeting-minutes"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menghapus lampiran");
    }
  }

  return (
    <div className="space-y-4" data-tour="meeting-minutes">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-auto">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Cari judul, lokasi, peserta…" aria-label="Cari meeting minutes" className="w-full sm:w-72 pl-8" />
        </div>
        <Button className="ml-auto" onClick={() => { setEditing(null); setFormOpen(true); }}><Plus /> Tambah meeting</Button>
      </div>

      {meetings.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">{isFetching ? "Memuat…" : "Belum ada meeting minutes."}</CardContent></Card>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {meetings.map((meeting) => (
            <Card key={meeting.id}>
              <CardHeader>
                <CardTitle>{meeting.title}</CardTitle>
                <CardDescription>{formatDate(meeting.meeting_date)}{meeting.start_time ? ` · ${meeting.start_time}` : ""}{meeting.end_time ? `–${meeting.end_time}` : ""}{meeting.location ? ` · ${meeting.location}` : ""}</CardDescription>
                <CardAction><div className="flex gap-1"><Button variant="ghost" size="icon-sm" aria-label={`Edit ${meeting.title}`} onClick={() => { setEditing(meeting); setFormOpen(true); }}><Pencil /></Button><Button variant="ghost" size="icon-sm" aria-label={`Hapus ${meeting.title}`} onClick={() => setDeleting(meeting)}><Trash2 /></Button></div></CardAction>
              </CardHeader>
              <CardContent className="space-y-3">
                {meeting.attendees ? <p className="text-sm text-muted-foreground">Peserta: {meeting.attendees}</p> : null}
                <div className="space-y-2">
                  {meeting.items.length === 0 ? <p className="text-sm text-muted-foreground">Belum ada action item.</p> : meeting.items.map((item) => (
                    <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-2.5">
                      <div><p className="font-medium">{item.subject}</p><p className="text-xs text-muted-foreground">{item.pic ? `PIC: ${item.pic}` : "PIC belum diisi"}{item.date_finish ? ` · Tenggat ${formatDate(item.date_finish)}` : ""}</p></div>
                      <Badge variant={statusVariant(item.status)}>{MEETING_ITEM_STATUS_LABELS[item.status]}</Badge>
                    </div>
                  ))}
                </div>
                <div className="space-y-2 border-t pt-3">
                  <div className="flex flex-wrap items-center gap-2"><Button type="button" variant="outline" size="sm" onClick={() => document.getElementById(`meeting-upload-${meeting.id}`)?.click()}><Upload /> Unggah lampiran</Button><Input id={`meeting-upload-${meeting.id}`} type="file" multiple className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.jpg,.jpeg,.png,.webp,.gif" onChange={(event) => { void upload(meeting.id, event.currentTarget.files); event.currentTarget.value = ""; }} /></div>
                  {meeting.attachments.map((attachment) => <div key={attachment.id} className="flex items-center justify-between gap-2 text-sm"><Button nativeButton={false} render={<a href={attachmentURL(attachment.preview_url)} target="_blank" rel="noreferrer" />} variant="outline" size="sm" className="min-w-0 max-w-[20rem] justify-start"><span className="truncate">{attachment.name}</span></Button><div className="flex shrink-0 gap-1"><Button variant="ghost" size="icon-xs" aria-label={`Unduh ${attachment.name}`} onClick={() => window.open(attachmentURL(attachment.download_url), "_blank", "noopener,noreferrer")}><FileDown /></Button><Button variant="ghost" size="icon-xs" aria-label={`Hapus ${attachment.name}`} onClick={() => void deleteAttachment(meeting.id, attachment.id)}><Trash2 /></Button></div></div>)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {formOpen ? <MeetingMinuteFormDialog key={editing?.id ?? "new"} meeting={editing} open={formOpen} onOpenChange={setFormOpen} onSaved={() => void queryClient.invalidateQueries({ queryKey: ["meeting-minutes"] })} /> : null}
      <AlertDialog open={deleting !== null} onOpenChange={(open) => (!open ? setDeleting(null) : undefined)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Hapus meeting minutes?</AlertDialogTitle><AlertDialogDescription>Meeting, action item, dan metadata lampirannya akan dihapus permanen.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Batal</AlertDialogCancel><AlertDialogAction variant="destructive" disabled={deleteMutation.isPending} onClick={() => deleting && deleteMutation.mutate(deleting)}>{deleteMutation.isPending ? "Menghapus…" : "Hapus"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
