export type TaskRoleRef = {
  id: number;
  name: string;
  slug: string;
  level: string;
  level_label: string;
};

export type TaskCategoryRef = {
  id: number;
  name: string;
  slug: string;
};

export type CostBreakdown = {
  man: number;
  machine: number;
  method: number;
  material: number;
};

export type TaskAdditionalField = {
  id: number;
  uuid: string;
  label: string;
  field_name: string;
  input_type: string;
  input_type_label: string;
  show_when: string;
  show_when_label: string;
  is_required: boolean;
  sort_order: number;
  options: string[];
};

export type TaskRow = {
  id: number;
  uuid: string;
  task_category_id: number;
  bmc_status: string;
  bmc_status_label: string;
  sort_order: number | null;
  name: string;
  description: string | null;
  execution_time: string | null;
  time_require: number;
  lower_time_threshold_minutes: number | null;
  upper_time_threshold_minutes: number | null;
  period: string;
  period_label: string;
  is_active: boolean;
  is_mandatory: boolean;
  fixed_cost: CostBreakdown;
  fixed_cost_total: number;
  variable_cost: CostBreakdown;
  variable_cost_total: number;
  role_id: number | null;
  role_ids: number[];
  role: TaskRoleRef | null;
  roles: TaskRoleRef[];
  task_category: TaskCategoryRef | null;
  additional_fields: TaskAdditionalField[];
  created_at: string;
  updated_at: string;
};
