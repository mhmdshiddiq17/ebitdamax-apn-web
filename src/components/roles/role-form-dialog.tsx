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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiFetch } from "@/lib/api";
import type { Role, RoleLevel } from "@/types/role";

const LEVEL_OPTIONS: Array<{ value: RoleLevel; label: string }> = [
  { value: "staff", label: "Staff" },
  { value: "manager", label: "Manager" },
  { value: "superadmin", label: "Superadmin" },
];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: Role | null;
  onSaved: () => void;
};

export function RoleFormDialog({ open, onOpenChange, role, onSaved }: Props) {
  const [name, setName] = useState(role?.name ?? "");
  const [level, setLevel] = useState<RoleLevel>(role?.level ?? "manager");
  const [submitting, setSubmitting] = useState(false);

  const isEdit = role !== null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    try {
      if (isEdit) {
        await apiFetch(`/roles/${role.id}`, {
          method: "PUT",
          body: JSON.stringify({ name, level, domain: role.domain }),
        });
        toast.success("Role berhasil diperbarui.");
      } else {
        await apiFetch("/roles", {
          method: "POST",
          body: JSON.stringify({ name, level, domain: "kdkmp" }),
        });
        toast.success("Role berhasil ditambahkan.");
      }

      onSaved();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan role");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit Role" : "Tambah Role"}</DialogTitle>
            <DialogDescription>
              {isEdit ? "Ubah nama atau level akses role." : "Role baru untuk domain KDKMP."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="role_name">Nama</Label>
              <Input
                id="role_name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={255}
                placeholder="Contoh: Supervisor Gerai"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role_level">Level</Label>
              <Select
                items={LEVEL_OPTIONS}
                value={level}
                onValueChange={(value) => setLevel((value ?? "manager") as RoleLevel)}
              >
                <SelectTrigger id="role_level" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEVEL_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
