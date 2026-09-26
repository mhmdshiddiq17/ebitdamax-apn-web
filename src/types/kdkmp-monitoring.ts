import type { Paginated } from "@/types/api";

export type KdkmpMonitoringStatus = "all" | "complete" | "not_filled" | "requires_review";

export type KdkmpMonitoringConsolidationLevel =
  | "national"
  | "province"
  | "regency"
  | "district"
  | "village";

export type KdkmpMonitoringRegionOption = {
  provinsi: string;
  kota_kabupaten: string;
  kecamatan: string;
  desa: string;
};

export type KdkmpMonitoringLockedFilters = {
  provinsi: string | null;
  kota_kabupaten: string | null;
  kecamatan: string | null;
  desa: string | null;
};

export type KdkmpMonitoringRegionalAccess = {
  is_national: boolean;
  scope_label: string;
  locked_filters: KdkmpMonitoringLockedFilters;
};

export type KdkmpMonitoringConsolidationRow = {
  key: string;
  label: string;
  provinsi: string | null;
  kota_kabupaten: string | null;
  kecamatan: string | null;
  desa: string | null;
  total_kdkmp: number;
  complete_kdkmp: number;
  plan_revenue: number | null;
  actual_revenue: number | null;
  gap: number | null;
};

export type KdkmpMonitoringDailyEntry = {
  is_complete: boolean;
  plan_revenue_requires_review: boolean;
  updated_at: string | null;
  target_revenue: string | null;
  plan_revenue: string | null;
  actual_revenue: string | null;
  variable_cost: string | null;
  actual_cost: string | null;
  actual_ebitda_margin: string | null;
  total_duration: string | null;
  performance_scoring: string | null;
};

export type KdkmpMonitoringManager = {
  name: string;
  email: string;
  username: string | null;
};

export type KdkmpMonitoringEntry = {
  id: number;
  nik: string | null;
  name: string | null;
  desa: string | null;
  kecamatan: string | null;
  kota_kabupaten: string | null;
  provinsi: string | null;
  manager: KdkmpMonitoringManager | null;
  metrics: { task_completion_rate: number };
  daily_entry: KdkmpMonitoringDailyEntry | null;
};

export type KdkmpMonitoringMatrixPoint = {
  date: string;
  plan_cost: number;
  actual_cost: number;
  cumulative_plan_cost: number;
  cumulative_actual_cost: number;
  plan_revenue: number;
  actual_revenue: number;
};

export type KdkmpMonitoringMatrix = {
  start_date: string;
  end_date: string;
  has_data: boolean;
  points: KdkmpMonitoringMatrixPoint[];
};

export type KdkmpMonitoringFilters = {
  month: string;
  detail_date: string | null;
  search: string;
  status: KdkmpMonitoringStatus;
  consolidation_level: KdkmpMonitoringConsolidationLevel;
  provinsi: string | null;
  kota_kabupaten: string | null;
  kecamatan: string | null;
  desa: string | null;
};

export type KdkmpMonitoringSelected = {
  id: number;
  nik: string | null;
  name: string | null;
  desa: string | null;
  kecamatan: string | null;
  kota_kabupaten: string | null;
  provinsi: string | null;
};

export type KdkmpMonitoringResponse = {
  business_date: string;
  entries: Paginated<KdkmpMonitoringEntry>;
  summary: {
    total: number;
    complete: number;
    not_filled: number;
    requires_review: number;
  };
  filters: KdkmpMonitoringFilters;
  region_options: KdkmpMonitoringRegionOption[];
  regional_access: KdkmpMonitoringRegionalAccess;
  consolidation: {
    level: KdkmpMonitoringConsolidationLevel;
    rows: KdkmpMonitoringConsolidationRow[];
  };
  selected_kdkmp: KdkmpMonitoringSelected | null;
  monthly_financial_matrix: KdkmpMonitoringMatrix | null;
};

export type KdkmpMonitoringReportFile = {
  phase: string;
  phase_label: string;
  name: string;
  mime_type: string | null;
  size: number;
  preview_url: string;
  download_url: string;
};

export type KdkmpMonitoringReportPhoto = {
  phase: string;
  phase_label: string;
  name: string;
  preview_url: string;
  download_url: string;
};

export type KdkmpMonitoringReportValue = {
  phase: string;
  phase_label: string;
  label: string;
  value: string | null;
  file: KdkmpMonitoringReportFile | null;
};

export type KdkmpMonitoringReportTask = {
  id: number;
  uuid: string;
  name: string;
  description: string | null;
  time_require: number;
  lower_time_threshold_minutes: number | null;
  upper_time_threshold_minutes: number | null;
  task_category: { id: number; name: string; slug: string } | null;
  roles: Array<{ id: number; name: string; slug: string; level: string; level_label: string }>;
};

export type KdkmpMonitoringReport = {
  id: number;
  uuid: string;
  started_at: string | null;
  finished_at: string | null;
  duration_minutes: number | null;
  manager_self_assigned: boolean;
  status_label: string;
  photos: KdkmpMonitoringReportPhoto[];
  documents: KdkmpMonitoringReportFile[];
  values: KdkmpMonitoringReportValue[];
  task: KdkmpMonitoringReportTask | null;
};

export type KdkmpMonitoringTasksResponse = {
  kdkmp_entry: {
    id: number;
    name: string | null;
    manager: { name: string; email: string } | null;
  };
  date: string;
  reports: KdkmpMonitoringReport[];
};
