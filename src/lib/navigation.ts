import type { LucideIcon } from "lucide-react";
import {
  Bell,
  BookOpen,
  CalendarDays,
  ClipboardList,
  Database,
  LayoutDashboard,
  Map,
  Megaphone,
  MessagesSquare,
  ScrollText,
  Settings,
  ShieldCheck,
  Tags,
  Users,
} from "lucide-react";
import type { AuthUser } from "@/types/auth";

/** `soon` = menu tampil tapi belum bisa diklik (dibangun sprint berikutnya). */
export type NavStatus = "ready" | "soon";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  status: NavStatus;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export function navigationForRole(role: AuthUser["role"]): NavGroup[] {
  const isManager = role?.slug === "manager";
  const isRegionalManager = role?.slug === "manager-wilayah";
  const isSuperadmin = role?.level === "superadmin";

  const groups: NavGroup[] = [
    {
      label: "Operasional",
      items: [
        { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard, status: "ready" },
        ...(isManager || isRegionalManager
          ? ([
              { title: "Tugas Harian", href: "/dashboard/tasks", icon: ClipboardList, status: "ready" },
              { title: "Meeting Minutes", href: "/meeting-minutes", icon: CalendarDays, status: "soon" },
            ] satisfies NavItem[])
          : []),
      ],
    },
  ];

  if (isRegionalManager || isSuperadmin) {
    groups.push({
      label: "Monitoring",
      items: [
        { title: "Monitoring KDKMP", href: "/admin/kdkmp-dashboard", icon: ScrollText, status: "soon" },
        { title: "Peta Nasional", href: "/monitoring", icon: Map, status: "soon" },
        { title: "Data SDM", href: "/sdm-data", icon: Database, status: "soon" },
      ],
    });
  }

  if (isSuperadmin) {
    groups.push(
      {
        label: "Master Data",
        items: [
          { title: "Pengguna", href: "/users", icon: Users, status: "ready" },
          { title: "Role", href: "/roles", icon: ShieldCheck, status: "ready" },
          { title: "Kategori Tugas", href: "/task-categories", icon: Tags, status: "ready" },
          { title: "Tugas", href: "/tasks", icon: ClipboardList, status: "ready" },
        ],
      },
      {
        label: "Komunikasi",
        items: [
          { title: "Pengumuman", href: "/announcements", icon: Megaphone, status: "soon" },
          { title: "Action Items", href: "/meeting-minutes/action-items", icon: CalendarDays, status: "soon" },
        ],
      },
    );
  }

  groups.push({
    label: "Umum",
    items: [
      ...(isManager || isRegionalManager
        ? ([
            { title: "LMS KDKMP", href: "/lms-kdkmp", icon: BookOpen, status: "soon" },
            { title: "Lumbung Chat", href: "/lumbung-kms/chat", icon: MessagesSquare, status: "soon" },
          ] satisfies NavItem[])
        : []),
      { title: "Notifikasi", href: "/notifications", icon: Bell, status: "soon" },
      { title: "Pengaturan", href: "/settings/profile", icon: Settings, status: "ready" },
    ],
  });

  return groups;
}
