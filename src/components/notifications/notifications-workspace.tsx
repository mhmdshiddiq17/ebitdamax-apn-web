"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCheck, MailOpen } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import { formatDate } from "@/lib/formatters";
import type { NotificationsResponse } from "@/types/notification";

export function NotificationsWorkspace({ initialData }: { initialData: NotificationsResponse }) {
  const queryClient = useQueryClient();
  const { data } = useQuery({ queryKey: ["notifications"], queryFn: () => apiFetch<NotificationsResponse>("/notifications"), initialData });
  const readMutation = useMutation({ mutationFn: (id: string) => apiFetch(`/notifications/${id}/read`, { method: "PATCH" }), onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["notifications"] }), onError: (error) => toast.error(error instanceof Error ? error.message : "Gagal memperbarui notifikasi") });
  const readAllMutation = useMutation({ mutationFn: () => apiFetch("/notifications/read-all", { method: "PATCH" }), onSuccess: () => { toast.success("Semua notifikasi ditandai dibaca."); void queryClient.invalidateQueries({ queryKey: ["notifications"] }); }, onError: (error) => toast.error(error instanceof Error ? error.message : "Gagal memperbarui notifikasi") });
  const notifications = data?.data ?? [];
  const unread = data?.meta.unread_count ?? 0;

  return <div className="space-y-4"><div className="flex flex-wrap items-center gap-2"><p className="text-sm text-muted-foreground">{unread > 0 ? `${unread} notifikasi belum dibaca.` : "Semua notifikasi sudah dibaca."}</p><Button className="ml-auto" variant="outline" disabled={unread === 0 || readAllMutation.isPending} onClick={() => readAllMutation.mutate()}><CheckCheck /> Tandai semua dibaca</Button></div>{notifications.length === 0 ? <Card className="border-dashed"><CardContent className="flex min-h-52 flex-col items-center justify-center gap-3 text-center"><MailOpen className="size-8 text-muted-foreground" /><div><p className="font-medium">Belum ada notifikasi</p><p className="mt-1 text-sm text-muted-foreground">Pengumuman dari Superadmin akan muncul di sini.</p></div></CardContent></Card> : <div className="space-y-3">{notifications.map((notification) => <Card key={notification.id} className={notification.read_at ? "" : "border-primary/40 bg-primary/3"}><CardHeader><CardTitle className="text-base">{notification.title}</CardTitle><div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><span>{formatDate(notification.created_at)}</span>{notification.sender_name ? <span>· {notification.sender_name}</span> : null}{notification.read_at ? <Badge variant="outline">Dibaca</Badge> : <Badge>Baru</Badge>}</div></CardHeader><CardContent className="flex flex-wrap items-end justify-between gap-3"><p className="max-w-3xl whitespace-pre-wrap text-sm text-muted-foreground">{notification.message}</p>{!notification.read_at ? <Button size="sm" variant="outline" disabled={readMutation.isPending} onClick={() => readMutation.mutate(notification.id)}>Tandai dibaca</Button> : null}</CardContent></Card>)}</div>}</div>;
}
