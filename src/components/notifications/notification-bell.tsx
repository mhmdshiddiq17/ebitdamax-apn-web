"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import Link from "next/link";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { apiFetch } from "@/lib/api";
import type { NotificationsResponse } from "@/types/notification";

export function NotificationBell() {
  const queryClient = useQueryClient();
  const { data } = useQuery({ queryKey: ["notifications", "preview"], queryFn: () => apiFetch<NotificationsResponse>("/notifications?limit=5"), staleTime: 30_000 });
  const readMutation = useMutation({ mutationFn: (id: string) => apiFetch(`/notifications/${id}/read`, { method: "PATCH" }), onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["notifications"] }) });
  const notifications = data?.data ?? [];
  const unread = data?.meta.unread_count ?? 0;

  return <DropdownMenu><DropdownMenuTrigger className="relative inline-flex size-8 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring" aria-label="Notifikasi"><Bell className="size-4" />{unread > 0 ? <span className="absolute -top-1 -right-1 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] leading-4 text-destructive-foreground">{unread > 99 ? "99+" : unread}</span> : null}</DropdownMenuTrigger><DropdownMenuContent align="end" className="w-80"><DropdownMenuGroup><DropdownMenuLabel>Notifikasi</DropdownMenuLabel>{notifications.length === 0 ? <DropdownMenuItem disabled>Belum ada notifikasi.</DropdownMenuItem> : notifications.map((notification) => <DropdownMenuItem key={notification.id} className="items-start whitespace-normal" onClick={() => { if (!notification.read_at) readMutation.mutate(notification.id); }}><div className="space-y-0.5"><p className={notification.read_at ? "font-normal" : "font-medium"}>{notification.title}</p><p className="line-clamp-2 text-xs text-muted-foreground">{notification.message}</p></div></DropdownMenuItem>)}</DropdownMenuGroup><DropdownMenuGroup><DropdownMenuItem render={<Link href="/notifications" />}>Lihat semua notifikasi</DropdownMenuItem></DropdownMenuGroup></DropdownMenuContent></DropdownMenu>;
}
