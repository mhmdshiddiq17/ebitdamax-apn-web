export type KdkmpDailyEntry = {
  id: number;
  report_date: string;
  is_complete: boolean;
  target_revenue: string | null;
  plan_revenue: string | null;
  actual_revenue: string | null;
  variable_cost: string | null;
  actual_cost: string | null;
  actual_ebitda_margin: string | null;
  total_duration: string | null;
  performance_scoring: string | null;
  plan_revenue_requires_review: boolean;
  operational_attendance: Record<string, number>;
  operational_attendance_saved_at: string | null;
  updated_at: string;
};

export type KdkmpFinancialMatrixPoint = {
  process: number;
  task_id: number;
  task_name: string;
  estimated_minutes: number;
  actual_duration_minutes: number;
  plan_fixed_cost: number;
  plan_variable_cost: number;
  plan_cost: number;
  actual_fixed_cost: number;
  actual_variable_cost: number;
  actual_cost: number;
  cumulative_plan_cost: number;
  cumulative_actual_cost: number;
};

export type KdkmpFinancialMatrix = {
  fixed_cost: number;
  total_variable_cost: number;
  total_actual_variable_cost: number;
  total_estimated_minutes: number;
  total_actual_duration_minutes: number;
  total_plan_cost: number;
  total_actual_cost: number;
  plan_revenue: number | null;
  actual_revenue: number | null;
  plan_ebitda: number | null;
  actual_ebitda: number | null;
  points: KdkmpFinancialMatrixPoint[];
};

export type KdkmpDashboardResponse = {
  business_date: string;
  financial_matrix_date: string;
  kdkmp: {
    id: number;
    nik: string | null;
    name: string | null;
    desa: string | null;
    kecamatan: string | null;
    kota_kabupaten: string | null;
    provinsi: string | null;
  } | null;
  today_entry: KdkmpDailyEntry | null;
  computed_values: {
    target_revenue: string;
    actual_revenue: string;
    actual_cost: string;
    total_duration: string;
    performance_scoring: string | null;
    task_completion_rate: number;
    time_compliance_rate: number;
  };
  financial_matrix: KdkmpFinancialMatrix;
  history: {
    data: KdkmpDailyEntry[];
    page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
};

export type KdkmpSelectableTask = {
  id: number;
  name: string;
  description: string | null;
  execution_time: string | null;
  time_require: number;
  is_mandatory: boolean;
  is_locked: boolean;
  bmc_status: string;
  bmc_status_label: string;
  task_category_name: string | null;
};

export type KdkmpDashboardInputResponse = Pick<
  KdkmpDashboardResponse,
  "business_date" | "kdkmp" | "today_entry" | "computed_values"
> & {
  task_selection: {
    tasks: KdkmpSelectableTask[];
    selected_task_ids: number[];
  };
};
