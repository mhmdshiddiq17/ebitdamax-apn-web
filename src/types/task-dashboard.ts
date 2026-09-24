export type DashboardTaskStatus = "pending" | "in_progress" | "completed";

export type DashboardDocument = {
  phase: "start" | "finish";
  phase_label: string;
  name: string;
  mime_type: string | null;
  size: number;
  preview_url: string;
  download_url: string;
};

export type DashboardAdditionalField = {
  id: number;
  label: string;
  field_name: string;
  input_type: string;
  show_when: string;
  is_required: boolean;
  options: string[];
};

export type DashboardTask = {
  id: number;
  uuid: string;
  sort_order: number | null;
  name: string;
  description: string | null;
  bmc_status: string;
  bmc_status_label: string;
  execution_time: string | null;
  time_require: number;
  lower_time_threshold_minutes: number | null;
  upper_time_threshold_minutes: number | null;
  period: string;
  period_label: string;
  period_key: string;
  status: DashboardTaskStatus;
  status_label: string;
  is_mandatory: boolean;
  documents: DashboardDocument[];
  additional_fields: DashboardAdditionalField[];
  task_category: { id: number; name: string; slug: string } | null;
  role: { id: number; name: string; slug: string } | null;
  roles: Array<{ id: number; name: string; slug: string }>;
};

export type DashboardAttendance = {
  business_date: string;
  is_saved: boolean;
  values: Record<string, number>;
  allocated: Record<string, number>;
  available: Record<string, number>;
};

export type TaskDashboardResponse = {
  business_date: string;
  tasks: DashboardTask[];
  summary: {
    total: number;
    pending: number;
    in_progress: number;
    completed: number;
  };
  operational_attendance: DashboardAttendance | null;
};
