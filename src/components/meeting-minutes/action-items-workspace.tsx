"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Pencil, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api";
import { formatDate } from "@/lib/formatters";
import { MEETING_ITEM_STATUSES, MEETING_ITEM_STATUS_LABELS, type ActionItem, type ActionItemsResponse, type MeetingItemStatus } from "@/types/meeting-minute";

type Props = { initialData: ActionItemsResponse };

function statusVariant(status: MeetingItemStatus) {
  return status === "completed" ? "default" : status === "cancelled" ? "outline" : status === "in_progress" ? "secondary" : "outline";
}

export function ActionItemsWorkspace({ initialData }: Props) {
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<MeetingItemStatus | "all">("all");
  const [overdue, setOverdue] = useState(false);
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<ActionItem | null>(null);
  const hasFilters = searchInput !== "" || status !== "all" || overdue;

  const resetFilters = () => {
    setSearchInput("");
    setSearch("");
    setStatus("all");
    setOverdue(false);
    setPage(1);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => { setSearch(searchInput.trim()); setPage(1); }, 350);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const isDefault = search === "" && status === "all" && !overdue && page === 1;
  const { data, isFetching } = useQuery({
    queryKey: ["meeting-action-items", { search, status, overdue, page }],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page) });
      if (search) params.set("search", search);
      if (status !== "all") params.set("status", status);
      if (overdue) params.set("overdue", "true");
      return apiFetch<ActionItemsResponse>(`/meeting-minutes/action-items?${params}`);
    },
    initialData: isDefault ? initialData : undefined,
    placeholderData: (previous) => previous,
  });
  const result = data ?? initialData;

  const updateMutation = useMutation({
    mutationFn: ({ id, status: nextStatus, remarks }: { id: number; status: MeetingItemStatus; remarks: string }) => apiFetch(`/meeting-minutes/action-items/${id}`, { method: "PATCH", body: JSON.stringify({ status: nextStatus, remarks: remarks || null }) }),
    onSuccess: () => { toast.success("Action item diperbarui."); setEditing(null); void queryClient.invalidateQueries({ queryKey: ["meeting-action-items"] }); },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Gagal memperbarui action item"),
  });

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {[["Total", result.summary.total], ["Belum dimulai", result.summary.open], ["Berlangsung", result.summary.in_progress], ["Selesai", result.summary.completed], ["Terlambat", result.summary.overdue]].map(([label, value]) => <Card key={String(label)} size="sm"><CardHeader><CardDescription>{label}</CardDescription><CardTitle className="text-2xl tabular-nums">{value}</CardTitle></CardHeader></Card>)}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-auto"><Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Cari subjek, PIC, meeting…" aria-label="Cari action items" className="w-full sm:w-72 pl-8" /></div>
        <Select items={[{ value: "all", label: "Semua status" }, ...MEETING_ITEM_STATUSES.map((value) => ({ value, label: MEETING_ITEM_STATUS_LABELS[value] }))]} value={status} onValueChange={(value) => { setStatus((value ?? "all") as MeetingItemStatus | "all"); setPage(1); }}><SelectTrigger className="w-44" aria-label="Filter status"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Semua status</SelectItem>{MEETING_ITEM_STATUSES.map((value) => <SelectItem key={value} value={value}>{MEETING_ITEM_STATUS_LABELS[value]}</SelectItem>)}</SelectContent></Select>
        <label className="flex cursor-pointer items-center gap-2 text-sm"><Checkbox checked={overdue} onCheckedChange={(checked) => { setOverdue(checked === true); setPage(1); }} /> Hanya terlambat</label>
        {hasFilters ? <Button variant="ghost" size="sm" onClick={resetFilters}>Reset filter</Button> : null}
      </div>
      {result.data.length === 0 ? <Card><CardContent className="space-y-3 py-10 text-center text-muted-foreground"><p>{isFetching ? "Memuat…" : "Tidak ada action item yang cocok."}</p>{hasFilters ? <Button variant="outline" size="sm" onClick={resetFilters}>Tampilkan semua action item</Button> : null}</CardContent></Card> : <div className="grid gap-3 lg:grid-cols-2">{result.data.map((item) => <Card key={item.id}><CardHeader><CardTitle>{item.subject}</CardTitle><CardDescription>{item.meeting_minute.title} · {formatDate(item.meeting_minute.meeting_date)}</CardDescription></CardHeader><CardContent className="space-y-3"><div className="flex flex-wrap gap-2"><Badge variant={statusVariant(item.status)}>{MEETING_ITEM_STATUS_LABELS[item.status]}</Badge>{item.is_overdue ? <Badge variant="destructive">Terlambat</Badge> : null}</div>{item.action ? <p className="text-sm">{item.action}</p> : null}<p className="text-sm text-muted-foreground">{item.pic ? `PIC: ${item.pic}` : "PIC belum diisi"}{item.date_finish ? ` · Tenggat ${formatDate(item.date_finish)}` : ""}</p>{item.remarks ? <p className="text-sm text-muted-foreground">Catatan: {item.remarks}</p> : null}<details className="rounded-lg border p-3"><summary className="cursor-pointer text-sm font-medium">Riwayat status ({item.status_histories.length})</summary><div className="mt-3 space-y-2">{item.status_histories.length === 0 ? <p className="text-sm text-muted-foreground">Belum ada perubahan status.</p> : item.status_histories.map((history) => <div key={history.id} className="text-sm"><p>{MEETING_ITEM_STATUS_LABELS[history.from_status]} → {MEETING_ITEM_STATUS_LABELS[history.to_status]}</p><p className="text-xs text-muted-foreground">{history.changed_by_name} · {new Date(history.created_at).toLocaleString("id-ID")}{history.note ? ` · ${history.note}` : ""}</p></div>)}</div></details><Button variant="outline" size="sm" onClick={() => setEditing(item)}><Pencil /> Perbarui status</Button></CardContent></Card>)}</div>}
      {result.meta.total_pages > 1 ? <div className="flex items-center justify-between text-sm text-muted-foreground"><span>Halaman {result.meta.page} dari {result.meta.total_pages} · {result.meta.total} item</span><div className="flex gap-2"><Button variant="outline" size="sm" disabled={page <= 1 || isFetching} onClick={() => setPage((current) => current - 1)}><ChevronLeft /> Sebelumnya</Button><Button variant="outline" size="sm" disabled={page >= result.meta.total_pages || isFetching} onClick={() => setPage((current) => current + 1)}>Berikutnya <ChevronRight /></Button></div></div> : null}
      {editing ? <ActionItemDialog key={editing.id} item={editing} open={editing !== null} onOpenChange={(open) => !open && setEditing(null)} onSave={(nextStatus, remarks) => updateMutation.mutate({ id: editing.id, status: nextStatus, remarks })} submitting={updateMutation.isPending} /> : null}
    </div>
  );
}

function ActionItemDialog({ item, open, onOpenChange, onSave, submitting }: { item: ActionItem; open: boolean; onOpenChange: (open: boolean) => void; onSave: (status: MeetingItemStatus, remarks: string) => void; submitting: boolean }) {
  const [status, setStatus] = useState(item.status);
  const [remarks, setRemarks] = useState(item.remarks ?? "");
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><form onSubmit={(event) => { event.preventDefault(); onSave(status, remarks); }}><DialogHeader><DialogTitle>Perbarui action item</DialogTitle><DialogDescription>{item.subject}</DialogDescription></DialogHeader><div className="space-y-4 py-4"><div className="space-y-2"><Label htmlFor="action-item-status">Status</Label><Select items={MEETING_ITEM_STATUSES.map((value) => ({ value, label: MEETING_ITEM_STATUS_LABELS[value] }))} value={status} onValueChange={(value) => setStatus((value ?? "open") as MeetingItemStatus)}><SelectTrigger id="action-item-status" className="w-full"><SelectValue /></SelectTrigger><SelectContent>{MEETING_ITEM_STATUSES.map((value) => <SelectItem key={value} value={value}>{MEETING_ITEM_STATUS_LABELS[value]}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label htmlFor="action-item-remarks">Catatan</Label><Textarea id="action-item-remarks" value={remarks} onChange={(event) => setRemarks(event.target.value)} maxLength={5000} rows={4} /></div></div><DialogFooter><Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Batal</Button><Button type="submit" disabled={submitting}>{submitting ? "Menyimpan…" : "Simpan"}</Button></DialogFooter></form></DialogContent></Dialog>;
}
