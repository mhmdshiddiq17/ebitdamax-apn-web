"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { TaskCategoryFormDialog } from "@/components/task-categories/task-category-form-dialog";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiFetch } from "@/lib/api";
import type { Paginated } from "@/types/api";
import type { TaskCategory } from "@/types/task-category";

type SortValue = "name-asc" | "name-desc" | "created_at-desc" | "created_at-asc";

const SORT_OPTIONS: Array<{ value: SortValue; label: string }> = [
  { value: "name-asc", label: "Nama (A-Z)" },
  { value: "name-desc", label: "Nama (Z-A)" },
  { value: "created_at-desc", label: "Terbaru" },
  { value: "created_at-asc", label: "Terlama" },
];

const dateFormatter = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" });

function parseSort(value: SortValue): { sort: string; direction: "asc" | "desc" } {
  const [sort, direction] = value.split("-") as [string, "asc" | "desc"];
  return { sort, direction };
}

export function TaskCategoriesTable({ initialData }: { initialData: Paginated<TaskCategory> }) {
  const queryClient = useQueryClient();

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sortValue, setSortValue] = useState<SortValue>("name-asc");
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<TaskCategory | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<TaskCategory | null>(null);

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
  const isDefaultQuery = search === "" && sortValue === "name-asc" && page === 1;

  const { data, isFetching } = useQuery({
    queryKey: ["task-categories", { search, sort, direction, page }],
    queryFn: () =>
      apiFetch<Paginated<TaskCategory>>(
        `/task-categories?search=${encodeURIComponent(search)}&sort=${sort}&direction=${direction}&page=${page}`,
      ),
    initialData: isDefaultQuery ? initialData : undefined,
    placeholderData: (previous) => previous,
  });

  const categories = data?.data ?? [];
  const meta = data?.meta;

  const deleteMutation = useMutation({
    mutationFn: (category: TaskCategory) => apiFetch(`/task-categories/${category.id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Kategori task berhasil dihapus.");
      setDeletingCategory(null);
      void queryClient.invalidateQueries({ queryKey: ["task-categories"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Gagal menghapus kategori task");
      setDeletingCategory(null);
    },
  });

  function refresh() {
    void queryClient.invalidateQueries({ queryKey: ["task-categories"] });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Cari nama, slug, atau deskripsi…"
            className="w-72 pl-8"
            aria-label="Cari kategori"
          />
        </div>

        <Select
          items={SORT_OPTIONS}
          value={sortValue}
          onValueChange={(value) => {
            setSortValue((value ?? "name-asc") as SortValue);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-44" aria-label="Urutkan kategori">
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
            setEditingCategory(null);
            setFormOpen(true);
          }}
        >
          <Plus />
          Tambah Kategori
        </Button>
      </div>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Deskripsi</TableHead>
              <TableHead className="text-right">Jumlah Task</TableHead>
              <TableHead>Dibuat</TableHead>
              <TableHead className="w-24 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  {isFetching ? "Memuat…" : "Belum ada kategori yang cocok."}
                </TableCell>
              </TableRow>
            ) : (
              categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>
                    <div className="font-medium">{category.name}</div>
                    <div className="text-xs text-muted-foreground">{category.slug}</div>
                  </TableCell>
                  <TableCell className="max-w-md text-sm text-muted-foreground">
                    {category.description ?? "-"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{category.tasks_count}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {dateFormatter.format(new Date(category.created_at))}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Edit ${category.name}`}
                        onClick={() => {
                          setEditingCategory(category);
                          setFormOpen(true);
                        }}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Hapus ${category.name}`}
                        onClick={() => setDeletingCategory(category)}
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
            Halaman {meta.page} dari {meta.total_pages} · {meta.total} kategori
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
        <TaskCategoryFormDialog
          key={editingCategory?.id ?? "new"}
          open={formOpen}
          onOpenChange={setFormOpen}
          category={editingCategory}
          onSaved={refresh}
        />
      ) : null}

      <AlertDialog
        open={deletingCategory !== null}
        onOpenChange={(open) => (!open ? setDeletingCategory(null) : undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus kategori?</AlertDialogTitle>
            <AlertDialogDescription>
              Kategori &quot;{deletingCategory?.name}&quot; akan dihapus permanen. Kategori yang masih dipakai task
              tidak dapat dihapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => (deletingCategory ? deleteMutation.mutate(deletingCategory) : undefined)}
            >
              {deleteMutation.isPending ? "Menghapus…" : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
