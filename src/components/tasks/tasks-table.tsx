"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { TaskFormDialog } from "@/components/tasks/task-form-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiFetch } from "@/lib/api";
import { formatRupiah } from "@/lib/formatters";
import type { Paginated } from "@/types/api";
import type { TaskCategoryRef, TaskRoleRef, TaskRow } from "@/types/task";

type SortValue = "sort_order-asc" | "name-asc" | "name-desc" | "time_require-asc" | "created_at-desc";

const SORT_OPTIONS: Array<{ value: SortValue; label: string }> = [
  { value: "sort_order-asc", label: "Nomor urut" },
  { value: "name-asc", label: "Nama (A-Z)" },
  { value: "name-desc", label: "Nama (Z-A)" },
  { value: "time_require-asc", label: "Estimasi tercepat" },
  { value: "created_at-desc", label: "Terbaru" },
];

function parseSort(value: SortValue): { sort: string; direction: "asc" | "desc" } {
  const [sort, direction] = value.split("-") as [string, "asc" | "desc"];
  return { sort, direction };
}

type Props = {
  initialData: Paginated<TaskRow>;
  categories: TaskCategoryRef[];
  roles: TaskRoleRef[];
};

export function TasksTable({ initialData, categories, roles }: Props) {
  const queryClient = useQueryClient();

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("active");
  const [sortValue, setSortValue] = useState<SortValue>("sort_order-asc");
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskRow | null>(null);
  const [deletingTask, setDeletingTask] = useState<TaskRow | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const trimmed = searchInput.trim();
      setSearch((previous) => {
        if (previous === trimmed) {
          return previous;
        }
        setPage(1);
        return trimmed;
      });
    }, 350);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const { sort, direction } = parseSort(sortValue);
  const isDefaultQuery =
    search === "" && categoryFilter === "all" && roleFilter === "all" && statusFilter === "active" && sortValue === "sort_order-asc" && page === 1;

  const { data, isFetching } = useQuery({
    queryKey: ["tasks", { search, categoryFilter, roleFilter, statusFilter, sort, direction, page }],
    queryFn: () => {
      const params = new URLSearchParams({ sort, direction, page: String(page), status: statusFilter });
      if (search !== "") params.set("search", search);
      if (categoryFilter !== "all") params.set("task_category_id", categoryFilter);
      if (roleFilter !== "all") params.set("role_id", roleFilter);
      return apiFetch<Paginated<TaskRow>>(`/tasks?${params.toString()}`);
    },
    initialData: isDefaultQuery ? initialData : undefined,
    placeholderData: (previous) => previous,
  });

  const tasks = data?.data ?? [];
  const meta = data?.meta;

  const deleteMutation = useMutation({
    mutationFn: (task: TaskRow) => apiFetch(`/tasks/${task.id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Task berhasil dihapus.");
      setDeletingTask(null);
      void queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Gagal menghapus task");
      setDeletingTask(null);
    },
  });

  function refresh() {
    void queryClient.invalidateQueries({ queryKey: ["tasks"] });
  }

  const categoryFilterItems = [
    { value: "all", label: "Semua kategori" },
    ...categories.map((category) => ({ value: String(category.id), label: category.name })),
  ];
  const roleFilterItems = [
    { value: "all", label: "Semua role" },
    ...roles.map((role) => ({ value: String(role.id), label: role.name })),
  ];
  const statusFilterItems = [
    { value: "active", label: "Aktif" },
    { value: "inactive", label: "Nonaktif" },
    { value: "all", label: "Semua status" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Cari nama, kategori, atau role…"
            className="w-64 pl-8"
            aria-label="Cari task"
          />
        </div>

        <Select
          items={categoryFilterItems}
          value={categoryFilter}
          onValueChange={(value) => {
            setCategoryFilter(value ?? "all");
            setPage(1);
          }}
        >
          <SelectTrigger className="w-44" aria-label="Filter kategori">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categoryFilterItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          items={roleFilterItems}
          value={roleFilter}
          onValueChange={(value) => {
            setRoleFilter(value ?? "all");
            setPage(1);
          }}
        >
          <SelectTrigger className="w-44" aria-label="Filter role">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {roleFilterItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          items={statusFilterItems}
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value ?? "active");
            setPage(1);
          }}
        >
          <SelectTrigger className="w-36" aria-label="Filter status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusFilterItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          items={SORT_OPTIONS}
          value={sortValue}
          onValueChange={(value) => {
            setSortValue((value ?? "sort_order-asc") as SortValue);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-44" aria-label="Urutkan task">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          className="ml-auto"
          onClick={() => {
            setEditingTask(null);
            setFormOpen(true);
          }}
        >
          <Plus />
          Tambah Task
        </Button>
      </div>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Urut</TableHead>
              <TableHead>Task</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Periode</TableHead>
              <TableHead>Waktu</TableHead>
              <TableHead className="text-right">Biaya (Fixed / Variabel)</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                  {isFetching ? "Memuat…" : "Belum ada task yang cocok."}
                </TableCell>
              </TableRow>
            ) : (
              tasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell className="tabular-nums text-muted-foreground">{task.sort_order ?? "-"}</TableCell>
                  <TableCell>
                    <div className="font-medium">{task.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {task.task_category?.name ?? "-"} · {task.bmc_status_label}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {task.roles.slice(0, 2).map((role) => (
                        <Badge key={role.id} variant="secondary">
                          {role.name}
                        </Badge>
                      ))}
                      {task.roles.length > 2 ? (
                        <Badge variant="outline">+{task.roles.length - 2}</Badge>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{task.period_label}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    <div>{task.execution_time ?? "tanpa jam"}</div>
                    <div>
                      {task.time_require} mnt
                      {task.lower_time_threshold_minutes != null && task.upper_time_threshold_minutes != null
                        ? ` · ${task.lower_time_threshold_minutes}-${task.upper_time_threshold_minutes}`
                        : ""}
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-xs tabular-nums">
                    <div>{formatRupiah(task.fixed_cost_total)}</div>
                    <div className="text-muted-foreground">{formatRupiah(task.variable_cost_total)}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant={task.is_active ? "default" : "outline"}>
                        {task.is_active ? "Aktif" : "Nonaktif"}
                      </Badge>
                      {task.is_mandatory ? <Badge variant="secondary">Wajib</Badge> : null}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Edit ${task.name}`}
                        onClick={() => {
                          setEditingTask(task);
                          setFormOpen(true);
                        }}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Hapus ${task.name}`}
                        onClick={() => setDeletingTask(task)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {meta && meta.total_pages > 1 ? (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Halaman {meta.page} dari {meta.total_pages} · {meta.total} task
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || isFetching}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              <ChevronLeft />
              Sebelumnya
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= meta.total_pages || isFetching}
              onClick={() => setPage((current) => current + 1)}
            >
              Berikutnya
              <ChevronRight />
            </Button>
          </div>
        </div>
      ) : null}

      {formOpen ? (
        <TaskFormDialog
          key={editingTask?.id ?? "new"}
          open={formOpen}
          onOpenChange={setFormOpen}
          task={editingTask}
          categories={categories}
          roles={roles}
          onSaved={refresh}
        />
      ) : null}

      <AlertDialog open={deletingTask !== null} onOpenChange={(open) => (!open ? setDeletingTask(null) : undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus task?</AlertDialogTitle>
            <AlertDialogDescription>
              Task &quot;{deletingTask?.name}&quot; akan dihapus permanen. Task yang sudah memiliki laporan tidak dapat
              dihapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => (deletingTask ? deleteMutation.mutate(deletingTask) : undefined)}
            >
              {deleteMutation.isPending ? "Menghapus…" : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
