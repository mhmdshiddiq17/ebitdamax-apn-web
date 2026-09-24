export type HistoryDocument = {
  phase: "start" | "finish";
  phase_label: string;
  name: string;
  mime_type: string | null;
  size: number;
  preview_url: string;
  download_url: string;
};

export type HistoryReport = {
  id: number;
  uuid: string;
  started_at: string | null;
  finished_at: string | null;
  duration_minutes: number | null;
  manager_self_assigned: boolean;
  status_label: string;
  timing_status: "on_time" | "late";
  timing_label: string;
  documents: HistoryDocument[];
  task: {
    id: number;
    uuid: string;
    name: string;
    description: string | null;
    time_require: number;
    task_category: { id: number; name: string; slug: string } | null;
    roles: Array<{ id: number; name: string; slug: string }>;
  } | null;
  user: { id: number; name: string; username: string | null; email: string } | null;
};

export type HistoryDay = {
  date: string;
  total_tasks: number;
  on_time_tasks: number;
  late_tasks: number;
  not_worked_tasks: Array<{
    task: { id: number; name: string } | null;
    user: { id: number; name: string } | null;
  }>;
  completed_reports: HistoryReport[];
};
