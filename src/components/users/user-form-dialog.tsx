"use client";

import { Plus, Trash2 } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
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
import type {
  KdkmpRef,
  RegionOption,
  RegionalAssignment,
  RegionalScopeLevel,
  UserRoleRef,
  UserRow,
} from "@/types/user";

const SCOPE_OPTIONS: Array<{ value: RegionalScopeLevel; label: string }> = [
  { value: "province", label: "Provinsi" },
  { value: "regency", label: "Kabupaten/Kota" },
  { value: "district", label: "Kecamatan" },
];

type DraftAssignment = {
  scope_level: RegionalScopeLevel;
  provinsi: string;
  kota_kabupaten: string;
  kecamatan: string;
};

function toDraft(assignments: RegionalAssignment[]): DraftAssignment[] {
  return assignments.map((assignment) => ({
    scope_level: assignment.scope_level,
    provinsi: assignment.provinsi,
    kota_kabupaten: assignment.kota_kabupaten ?? "",
    kecamatan: assignment.kecamatan ?? "",
  }));
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserRow | null;
  roles: UserRoleRef[];
  kdkmpOptions: KdkmpRef[];
  regionOptions: RegionOption[];
  onSaved: () => void;
};

export function UserFormDialog({ open, onOpenChange, user, roles, kdkmpOptions, regionOptions, onSaved }: Props) {
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [roleId, setRoleId] = useState<string | null>(user?.role_id ? String(user.role_id) : null);
  const [sdmEntryId, setSdmEntryId] = useState<string | null>(
    user?.sdm_kdkmp_entry_id ? String(user.sdm_kdkmp_entry_id) : null,
  );
  const [assignments, setAssignments] = useState<DraftAssignment[]>(() => toDraft(user?.regional_assignments ?? []));
  const [submitting, setSubmitting] = useState(false);

  const isEdit = user !== null;
  const selectedRole = roles.find((role) => String(role.id) === roleId) ?? null;
  const isManager = selectedRole?.slug === "manager";
  const isRegionalManager = selectedRole?.slug === "manager-wilayah";

  const roleItems = useMemo(
    () => roles.map((role) => ({ value: String(role.id), label: `${role.name} (${role.level_label})` })),
    [roles],
  );

  const kdkmpChoices = useMemo(
    () =>
      kdkmpOptions.filter(
        (entry) => entry.assigned_manager_user_id === null || entry.assigned_manager_user_id === user?.id,
      ),
    [kdkmpOptions, user?.id],
  );

  const kdkmpItems = useMemo(
    () =>
      kdkmpChoices.map((entry) => ({
        value: String(entry.id),
        label: `${entry.nama_koperasi ?? "KDKMP"}${entry.provinsi ? ` — ${entry.provinsi}` : ""}`,
      })),
    [kdkmpChoices],
  );

  const provinces = useMemo(
    () => [...new Set(regionOptions.map((region) => region.provinsi))].sort(),
    [regionOptions],
  );

  function regenciesFor(provinsi: string): string[] {
    return [
      ...new Set(
        regionOptions
          .filter((region) => region.provinsi === provinsi && region.kota_kabupaten)
          .map((region) => region.kota_kabupaten as string),
      ),
    ].sort();
  }

  function districtsFor(provinsi: string, kotaKabupaten: string): string[] {
    return [
      ...new Set(
        regionOptions
          .filter(
            (region) =>
              region.provinsi === provinsi &&
              region.kota_kabupaten === kotaKabupaten &&
              region.kecamatan,
          )
          .map((region) => region.kecamatan as string),
      ),
    ].sort();
  }

  function updateAssignment(index: number, patch: Partial<DraftAssignment>) {
    setAssignments((current) =>
      current.map((assignment, assignmentIndex) =>
        assignmentIndex === index ? { ...assignment, ...patch } : assignment,
      ),
    );
  }

  function changeScope(index: number, scope: RegionalScopeLevel) {
    setAssignments((current) =>
      current.map((assignment, assignmentIndex) => {
        if (assignmentIndex !== index) {
          return assignment;
        }
        return {
          scope_level: scope,
          provinsi: assignment.provinsi,
          kota_kabupaten: scope === "province" ? "" : assignment.kota_kabupaten,
          kecamatan: scope === "district" ? assignment.kecamatan : "",
        };
      }),
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password !== passwordConfirmation) {
      toast.error("Konfirmasi kata sandi tidak cocok");
      return;
    }

    setSubmitting(true);

    const payload: Record<string, unknown> = {
      domain: "kdkmp",
      role_id: roleId ? Number(roleId) : 0,
      name,
      email,
    };

    if (password !== "") {
      payload.password = password;
      payload.password_confirmation = passwordConfirmation;
    }

    payload.sdm_kdkmp_entry_id = isManager && sdmEntryId ? Number(sdmEntryId) : null;
    payload.regional_assignments = isRegionalManager
      ? assignments.map((assignment) => ({
          scope_level: assignment.scope_level,
          provinsi: assignment.provinsi,
          kota_kabupaten: assignment.scope_level === "province" ? null : assignment.kota_kabupaten,
          kecamatan: assignment.scope_level === "district" ? assignment.kecamatan : null,
        }))
      : [];

    try {
      if (isEdit) {
        await apiFetch(`/users/${user.id}`, { method: "PUT", body: JSON.stringify(payload) });
        toast.success("User berhasil diperbarui.");
      } else {
        await apiFetch("/users", { method: "POST", body: JSON.stringify(payload) });
        toast.success("User berhasil ditambahkan.");
      }

      onSaved();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan user");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit User" : "Tambah User"}</DialogTitle>
            <DialogDescription>
              {isEdit ? "Perbarui data akun, role, dan cakupan wilayah." : "Akun baru untuk domain KDKMP."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="user_name">Nama</Label>
                <Input
                  id="user_name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  maxLength={255}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user_email">Email</Label>
                <Input
                  id="user_email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="user_password">{isEdit ? "Kata Sandi Baru (opsional)" : "Kata Sandi"}</Label>
                <Input
                  id="user_password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={8}
                  placeholder={isEdit ? "Kosongkan jika tidak diubah" : undefined}
                  required={!isEdit}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user_password_confirmation">Ulangi Kata Sandi</Label>
                <Input
                  id="user_password_confirmation"
                  type="password"
                  autoComplete="new-password"
                  value={passwordConfirmation}
                  onChange={(event) => setPasswordConfirmation(event.target.value)}
                  minLength={8}
                  required={!isEdit && password !== ""}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="user_role">Role</Label>
              <Select items={roleItems} value={roleId} onValueChange={(value) => setRoleId(value)}>
                <SelectTrigger id="user_role" className="w-full">
                  <SelectValue placeholder="Pilih role" />
                </SelectTrigger>
                <SelectContent>
                  {roleItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isManager ? (
              <div className="space-y-2">
                <Label htmlFor="user_kdkmp">Data KDKMP</Label>
                <Select items={kdkmpItems} value={sdmEntryId} onValueChange={(value) => setSdmEntryId(value)}>
                  <SelectTrigger id="user_kdkmp" className="w-full">
                    <SelectValue placeholder="Pilih data KDKMP" />
                  </SelectTrigger>
                  <SelectContent>
                    {kdkmpItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Hanya data KDKMP yang belum terhubung ke manager lain yang tampil.
                </p>
              </div>
            ) : null}

            {isRegionalManager ? (
              <div className="space-y-3 rounded-lg border border-border p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Cakupan wilayah</p>
                    <p className="text-xs text-muted-foreground">
                      Hanya wilayah dengan data KDKMP terkelola yang dapat dipilih.
                    </p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => setAssignments((c) => [...c, { scope_level: "province", provinsi: "", kota_kabupaten: "", kecamatan: "" }])}>
                    <Plus />
                    Tambah
                  </Button>
                </div>

                {assignments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Belum ada cakupan. Tambahkan minimal satu.</p>
                ) : (
                  <div className="space-y-2">
                    {assignments.map((assignment, index) => {
                      const regencies = regenciesFor(assignment.provinsi);
                      const districts = districtsFor(assignment.provinsi, assignment.kota_kabupaten);

                      return (
                        <div key={index} className="grid gap-2 sm:grid-cols-[130px_1fr_1fr_1fr_auto]">
                          <Select
                            items={SCOPE_OPTIONS}
                            value={assignment.scope_level}
                            onValueChange={(value) => changeScope(index, (value ?? "province") as RegionalScopeLevel)}
                          >
                            <SelectTrigger className="w-full" aria-label={`Scope baris ${index + 1}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {SCOPE_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Select
                            items={provinces.map((provinsi) => ({ value: provinsi, label: provinsi }))}
                            value={assignment.provinsi || null}
                            onValueChange={(value) =>
                              updateAssignment(index, { provinsi: value ?? "", kota_kabupaten: "", kecamatan: "" })
                            }
                          >
                            <SelectTrigger className="w-full" aria-label={`Provinsi baris ${index + 1}`}>
                              <SelectValue placeholder="Provinsi" />
                            </SelectTrigger>
                            <SelectContent>
                              {provinces.map((provinsi) => (
                                <SelectItem key={provinsi} value={provinsi}>
                                  {provinsi}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Select
                            items={regencies.map((regency) => ({ value: regency, label: regency }))}
                            value={assignment.kota_kabupaten || null}
                            onValueChange={(value) =>
                              updateAssignment(index, { kota_kabupaten: value ?? "", kecamatan: "" })
                            }
                            disabled={assignment.scope_level === "province" || assignment.provinsi === ""}
                          >
                            <SelectTrigger className="w-full" aria-label={`Kabupaten baris ${index + 1}`}>
                              <SelectValue placeholder="Kabupaten/Kota" />
                            </SelectTrigger>
                            <SelectContent>
                              {regencies.map((regency) => (
                                <SelectItem key={regency} value={regency}>
                                  {regency}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Select
                            items={districts.map((district) => ({ value: district, label: district }))}
                            value={assignment.kecamatan || null}
                            onValueChange={(value) => updateAssignment(index, { kecamatan: value ?? "" })}
                            disabled={assignment.scope_level !== "district" || assignment.kota_kabupaten === ""}
                          >
                            <SelectTrigger className="w-full" aria-label={`Kecamatan baris ${index + 1}`}>
                              <SelectValue placeholder="Kecamatan" />
                            </SelectTrigger>
                            <SelectContent>
                              {districts.map((district) => (
                                <SelectItem key={district} value={district}>
                                  {district}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Hapus cakupan baris ${index + 1}`}
                            onClick={() => setAssignments((current) => current.filter((_, i) => i !== index))}
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Batal
            </Button>
            <Button type="submit" disabled={submitting || roleId === null}>
              {submitting ? "Menyimpan…" : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
