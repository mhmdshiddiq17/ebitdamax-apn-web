import { redirect } from "next/navigation";
import { TasksTable } from "@/components/tasks/tasks-table";
import { ApiError } from "@/lib/api";
import { serverApiFetch } from "@/lib/server-api";
import type { Paginated } from "@/types/api";
import type { TaskCategory } from "@/types/task-category";
import type { TaskRow, TaskRoleRef } from "@/types/task";

export const dynamic = "force-dynamic";

type TasksPageData = {
  initialData: Paginated<TaskRow>;
  categories: TaskCategory[];
  roles: TaskRoleRef[];
};

async function loadTasksPage(): Promise<TasksPageData> {
  const [initialData, categoriesResponse, rolesResponse] = await Promise.all([
    serverApiFetch<Paginated<TaskRow>>("/tasks?status=active&sort=sort_order&direction=asc&page=1"),
    serverApiFetch<Paginated<TaskCategory>>("/task-categories?sort=name&direction=asc&page=1"),
    serverApiFetch<Paginated<TaskRoleRef>>("/roles?domain=kdkmp&sort=name&direction=asc&page=1"),
  ]);

  return {
    initialData,
    categories: categoriesResponse.data,
    roles: rolesResponse.data,
  };
}

export default async function TasksPage() {
  let pageData: TasksPageData;

  try {
    pageData = await loadTasksPage();
  } catch (error) {
    if (error instanceof ApiError && error.status === 403) {
      redirect("/dashboard");
    }
    throw error;
  }

  return (
    <>
      <div>
        <h1 className="font-heading text-2xl font-semibold">Tugas</h1>
        <p className="text-sm text-muted-foreground">
          Kelola task, role pelaksana, biaya, dan field laporan dinamis.
        </p>
      </div>

      <TasksTable initialData={pageData.initialData} categories={pageData.categories} roles={pageData.roles} />
    </>
  );
}
