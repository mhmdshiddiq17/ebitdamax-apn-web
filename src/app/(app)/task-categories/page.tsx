import { redirect } from "next/navigation";
import { TaskCategoriesTable } from "@/components/task-categories/task-categories-table";
import { ApiError } from "@/lib/api";
import { serverApiFetch } from "@/lib/server-api";
import type { Paginated } from "@/types/api";
import type { TaskCategory } from "@/types/task-category";

export const dynamic = "force-dynamic";

export default async function TaskCategoriesPage() {
  let initialData: Paginated<TaskCategory>;

  try {
    initialData = await serverApiFetch<Paginated<TaskCategory>>(
      "/task-categories?sort=name&direction=asc&page=1",
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 403) {
      redirect("/dashboard");
    }
    throw error;
  }

  return (
    <>
      <div>
        <h1 className="font-heading text-2xl font-semibold">Kategori Tugas</h1>
        <p className="text-sm text-muted-foreground">Kelompokkan task agar mudah dikelola dan dipantau.</p>
      </div>

      <TaskCategoriesTable initialData={initialData} />
    </>
  );
}
