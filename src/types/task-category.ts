export type TaskCategory = {
  id: number;
  uuid: string;
  name: string;
  slug: string;
  description: string | null;
  tasks_count: number;
  created_at: string;
  updated_at: string;
};
