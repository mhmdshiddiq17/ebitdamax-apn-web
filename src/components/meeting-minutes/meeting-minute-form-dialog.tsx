"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api";
import { MEETING_ITEM_STATUSES, MEETING_ITEM_STATUS_LABELS, type MeetingItemStatus, type MeetingMinute } from "@/types/meeting-minute";

type DraftItem = {
  id?: number;
  subject: string;
  description: string;
  action: string;
  objectives: string;
  date_start: string;
  date_finish: string;
  pic: string;
  status: MeetingItemStatus;
  remarks: string;
};

const EMPTY_ITEM: DraftItem = {
  subject: "",
  description: "",
  action: "",
  objectives: "",
  date_start: "",
  date_finish: "",
  pic: "",
  status: "open",
  remarks: "",
};

type Props = {
  meeting: MeetingMinute | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
};

function draftItems(meeting: MeetingMinute | null): DraftItem[] {
  return meeting?.items.map((item) => ({
    ...item,
    description: item.description ?? "",
    action: item.action ?? "",
    objectives: item.objectives ?? "",
    date_start: item.date_start ?? "",
    date_finish: item.date_finish ?? "",
    pic: item.pic ?? "",
    remarks: item.remarks ?? "",
  })) ?? [];
}

export function MeetingMinuteFormDialog({ meeting, open, onOpenChange, onSaved }: Props) {
  const [title, setTitle] = useState(meeting?.title ?? "");
  const [meetingDate, setMeetingDate] = useState(meeting?.meeting_date ?? "");
  const [startTime, setStartTime] = useState(meeting?.start_time ?? "");
  const [endTime, setEndTime] = useState(meeting?.end_time ?? "");
  const [location, setLocation] = useState(meeting?.location ?? "");
  const [attendees, setAttendees] = useState(meeting?.attendees ?? "");
  const [items, setItems] = useState<DraftItem[]>(() => draftItems(meeting));
  const [submitting, setSubmitting] = useState(false);

  function updateItem(index: number, patch: Partial<DraftItem>) {
    setItems((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (items.some((item) => item.subject.trim() === "")) {
      toast.error("Subjek setiap action item wajib diisi.");
      return;
    }

    setSubmitting(true);
    const payload = {
      title,
      meeting_date: meetingDate,
      start_time: startTime || null,
      end_time: endTime || null,
      location: location || null,
      attendees: attendees || null,
      items: items.map((item) => ({
        id: item.id,
        subject: item.subject,
        description: item.description || null,
        action: item.action || null,
        objectives: item.objectives || null,
        date_start: item.date_start || null,
        date_finish: item.date_finish || null,
        pic: item.pic || null,
        status: item.status,
        remarks: item.remarks || null,
      })),
    };

    try {
      if (meeting) {
        await apiFetch(`/meeting-minutes/${meeting.id}`, { method: "PUT", body: JSON.stringify(payload) });
        toast.success("Meeting minutes diperbarui.");
      } else {
        await apiFetch("/meeting-minutes", { method: "POST", body: JSON.stringify(payload) });
        toast.success("Meeting minutes ditambahkan.");
      }
      onSaved();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan meeting minutes");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{meeting ? "Edit Meeting Minutes" : "Tambah Meeting Minutes"}</DialogTitle>
            <DialogDescription>Action item diurutkan sesuai urutan pada form ini.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="meeting_title">Judul meeting</Label>
                <Input id="meeting_title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={255} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="meeting_date">Tanggal</Label>
                <Input id="meeting_date" type="date" value={meetingDate} onChange={(event) => setMeetingDate(event.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="meeting_start">Jam mulai</Label>
                <Input id="meeting_start" type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="meeting_end">Jam selesai</Label>
                <Input id="meeting_end" type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="meeting_location">Lokasi</Label>
              <Input id="meeting_location" value={location} onChange={(event) => setLocation(event.target.value)} maxLength={255} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meeting_attendees">Peserta</Label>
              <Textarea id="meeting_attendees" value={attendees} onChange={(event) => setAttendees(event.target.value)} rows={2} />
            </div>

            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-heading font-medium">Action items</h3>
                <Button type="button" variant="outline" size="sm" onClick={() => setItems((current) => [...current, { ...EMPTY_ITEM }])}>
                  <Plus /> Tambah item
                </Button>
              </div>
              {items.map((item, index) => (
                <div key={item.id ?? `new-${index}`} className="space-y-3 rounded-lg border bg-muted/30 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">Item {index + 1}</p>
                    <Button type="button" variant="ghost" size="icon-sm" aria-label={`Hapus item ${index + 1}`} onClick={() => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))}>
                      <Trash2 />
                    </Button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor={`item-subject-${index}`}>Subjek</Label>
                      <Input id={`item-subject-${index}`} value={item.subject} onChange={(event) => updateItem(index, { subject: event.target.value })} maxLength={255} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`item-pic-${index}`}>PIC</Label>
                      <Input id={`item-pic-${index}`} value={item.pic} onChange={(event) => updateItem(index, { pic: event.target.value })} maxLength={255} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`item-status-${index}`}>Status</Label>
                      <Select items={MEETING_ITEM_STATUSES.map((value) => ({ value, label: MEETING_ITEM_STATUS_LABELS[value] }))} value={item.status} onValueChange={(value) => updateItem(index, { status: (value ?? "open") as MeetingItemStatus })}>
                        <SelectTrigger id={`item-status-${index}`} className="w-full"><SelectValue /></SelectTrigger>
                        <SelectContent>{MEETING_ITEM_STATUSES.map((value) => <SelectItem key={value} value={value}>{MEETING_ITEM_STATUS_LABELS[value]}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`item-start-${index}`}>Mulai</Label>
                      <Input id={`item-start-${index}`} type="date" value={item.date_start} onChange={(event) => updateItem(index, { date_start: event.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`item-finish-${index}`}>Tenggat</Label>
                      <Input id={`item-finish-${index}`} type="date" value={item.date_finish} onChange={(event) => updateItem(index, { date_finish: event.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`item-action-${index}`}>Tindakan</Label>
                    <Textarea id={`item-action-${index}`} value={item.action} onChange={(event) => updateItem(index, { action: event.target.value })} rows={2} />
                  </div>
                  <details className="rounded-md border bg-background p-3">
                    <summary className="cursor-pointer text-sm font-medium">Detail tambahan</summary>
                    <div className="space-y-3 pt-3">
                      <div className="space-y-2"><Label htmlFor={`item-description-${index}`}>Deskripsi</Label><Textarea id={`item-description-${index}`} value={item.description} onChange={(event) => updateItem(index, { description: event.target.value })} rows={2} /></div>
                      <div className="space-y-2"><Label htmlFor={`item-objectives-${index}`}>Tujuan</Label><Textarea id={`item-objectives-${index}`} value={item.objectives} onChange={(event) => updateItem(index, { objectives: event.target.value })} rows={2} /></div>
                      <div className="space-y-2"><Label htmlFor={`item-remarks-${index}`}>Catatan</Label><Textarea id={`item-remarks-${index}`} value={item.remarks} onChange={(event) => updateItem(index, { remarks: event.target.value })} rows={2} /></div>
                    </div>
                  </details>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Batal</Button>
            <Button type="submit" disabled={submitting}>{submitting ? "Menyimpan…" : "Simpan"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
