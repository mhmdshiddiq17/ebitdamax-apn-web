"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api";
import type { TaskCategory } from "@/types/task-category";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: TaskCategory | null;
  onSaved: () => void;
};

export function TaskCategoryFormDialog({ open, onOpenChange, category, onSaved }: Props) {
  const [name, setName] = useState(category?.name ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [submitting, setSubmitting] = useState(false);

  const isEdit = category !== null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    try {
      const payload = { name, description: description.trim() === "" ? null : description };

      if (isEdit) {
        await apiFetch(`/task-categories/${category.id}`, { method: "PUT", body: JSON.stringify(payload) });
        toast.success("Kategori task berhasil diperbarui.");
      } else {
        await apiFetch("/task-categories", { method: "POST", body: JSON.stringify(payload) });
        toast.success("Kategori task berhasil ditambahkan.");
      }

      onSaved();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan kategori task");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit Kategori" : "Tambah Kategori"}</DialogTitle>
            <DialogDescription>
              {isEdit ? "Ubah nama atau deskripsi kategori." : "Kategori baru untuk pengelompokan task."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="category_name">Nama</Label>
              <Input
                id="category_name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={255}
                placeholder="Contoh: Operasional Harian"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category_description">Deskripsi (opsional)</Label>
              <Textarea
                id="category_description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={3}
                placeholder="Penjelasan singkat kategori"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Batal
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Menyimpan…" : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
