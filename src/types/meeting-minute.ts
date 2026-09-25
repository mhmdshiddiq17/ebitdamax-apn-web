export const MEETING_ITEM_STATUSES = ["open", "in_progress", "completed", "cancelled"] as const;

export type MeetingItemStatus = (typeof MEETING_ITEM_STATUSES)[number];

export const MEETING_ITEM_STATUS_LABELS: Record<MeetingItemStatus, string> = {
  open: "Belum dimulai",
  in_progress: "Berlangsung",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};

export type MeetingMinuteItem = {
  id: number;
  subject: string;
  description: string | null;
  action: string | null;
  objectives: string | null;
  date_start: string | null;
  date_finish: string | null;
  pic: string | null;
  status: MeetingItemStatus;
  remarks: string | null;
  sort_order: number;
};

export type MeetingMinuteAttachment = {
  id: number;
  name: string;
  mime_type: string | null;
  size: number;
  preview_url: string;
  download_url: string;
};

export type MeetingMinute = {
  id: number;
  title: string;
  meeting_date: string;
  start_time: string;
  end_time: string;
  location: string | null;
  attendees: string | null;
  items: MeetingMinuteItem[];
  attachments: MeetingMinuteAttachment[];
  created_at: string;
  updated_at: string;
};

export type MeetingMinutesResponse = { data: MeetingMinute[] };

export type ActionItemHistory = {
  id: number;
  from_status: MeetingItemStatus;
  to_status: MeetingItemStatus;
  note: string | null;
  changed_by_name: string;
  created_at: string;
};

export type ActionItem = Pick<MeetingMinuteItem, "id" | "subject" | "action" | "pic" | "date_start" | "date_finish" | "status" | "remarks"> & {
  is_overdue: boolean;
  meeting_minute: Pick<MeetingMinute, "id" | "title" | "meeting_date">;
  status_histories: ActionItemHistory[];
};

export type ActionItemsResponse = {
  data: ActionItem[];
  meta: { page: number; per_page: number; total: number; total_pages: number };
  summary: { total: number; open: number; in_progress: number; completed: number; overdue: number };
};
