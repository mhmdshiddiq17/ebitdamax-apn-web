"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import {
  DynamicFieldInput,
  type AdditionalFieldValue,
} from "@/components/task-dashboard/dynamic-field-input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { OPERATIONAL_ATTENDANCE_ROLES } from "@/lib/task-constants";
import { apiFetch } from "@/lib/api";
import type { DashboardTask } from "@/types/task-dashboard";

export type TaskReportMode = "start" | "finish";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: DashboardTask;
  mode: TaskReportMode;
  isKdkmpManager: boolean;
  attendanceAvailable: Record<string, number> | null;
  onDone: () => void;
};

function emptyAllocations(): Record<string, string> {
  return Object.fromEntries(OPERATIONAL_ATTENDANCE_ROLES.map((role) => [role.key, "0"]));
}

export function TaskReportDialog({
  open,
  onOpenChange,
  task,
  mode,
  isKdkmpManager,
  attendanceAvailable,
  onDone,
}: Props) {
  const [photo, setPhoto] = useState<File | null>(null);
  const [documents, setDocuments] = useState<File[]>([]);
  const [values, setValues] = useState<Record<string, AdditionalFieldValue>>({});
  const [valueFiles, setValueFiles] = useState<Record<string, File | null>>({});
  const [allocations, setAllocations] = useState<Record<string, string>>(emptyAllocations);
  const [selfAssigned, setSelfAssigned] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fields = task.additional_fields.filter((field) => field.show_when === mode);
  const photoLabel = mode === "start" ? "Foto mulai" : "Foto selesai";

  const totalAllocation = OPERATIONAL_ATTENDANCE_ROLES.reduce(
    (sum, role) => sum + (Number(allocations[role.key]) || 0),
    0,
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!photo) {
      toast.error(`${photoLabel} wajib diunggah`);
      return;
    }
    if (isKdkmpManager && mode === "start") {
      if (!selfAssigned && totalAllocation === 0) {
        toast.error("Alokasikan minimal satu anggota atau centang bahwa Manager KDKMP yang mengerjakan");
        return;
      }
      if (selfAssigned && totalAllocation > 0) {
        toast.error("Alokasi anggota harus 0 saat Manager KDKMP mengerjakan sendiri");
        return;
      }
    }

    setSubmitting(true);

    const formData = new FormData();
    formData.append(mode === "start" ? "started_photo" : "finished_photo", photo);
    documents.forEach((document) => formData.append("documents", document));

    const nonFileValues: Record<string, AdditionalFieldValue> = {};
    for (const field of fields) {
      if (field.input_type === "file") {
        const file = valueFiles[field.field_name];
        if (file) {
          formData.append(`value_files[${field.field_name}]`, file);
        }
        continue;
      }

      const value = values[field.field_name];
      if (value !== undefined) {
        nonFileValues[field.field_name] = value;
      }
    }
    formData.append("values", JSON.stringify(nonFileValues));

    if (isKdkmpManager && mode === "start") {
      const allocationPayload: Record<string, number> = {};
      for (const role of OPERATIONAL_ATTENDANCE_ROLES) {
        allocationPayload[role.key] = Number(allocations[role.key]) || 0;
      }
      formData.append("member_allocations", JSON.stringify(allocationPayload));
      formData.append("manager_self_assigned", selfAssigned ? "true" : "false");
    }

    try {
      await apiFetch(`/tasks/${task.id}/${mode}`, { method: "POST", body: formData });
      toast.success(mode === "start" ? "Task berhasil dimulai." : "Task berhasil diselesaikan.");
      onDone();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal memproses task");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{mode === "start" ? "Mulai Task" : "Selesaikan Task"}</DialogTitle>
            <DialogDescription>{task.name}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="report_photo">
                {photoLabel} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="report_photo"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(event) => setPhoto(event.target.files?.[0] ?? null)}
                required
              />
              <p className="text-xs text-muted-foreground">JPG/PNG/WEBP/GIF, maksimal 3 MB.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="report_documents">Dokumen pendukung (opsional)</Label>
              <Input
                id="report_documents"
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.jpg,.jpeg,.png"
                onChange={(event) => setDocuments(Array.from(event.target.files ?? []))}
              />
              <p className="text-xs text-muted-foreground">
                Maksimal 10 file per tahap, 10 MB per file. Terpilih: {documents.length}
              </p>
            </div>

            {fields.length > 0 ? (
              <div className="space-y-3 rounded-lg border border-border p-3">
                <p className="text-sm font-medium">Field laporan</p>
                {fields.map((field) => (
                  <DynamicFieldInput
                    key={field.id}
                    field={field}
                    value={values[field.field_name]}
                    onValueChange={(value) =>
                      setValues((current) => ({ ...current, [field.field_name]: value }))
                    }
                    file={valueFiles[field.field_name] ?? null}
                    onFileChange={(file) =>
                      setValueFiles((current) => ({ ...current, [field.field_name]: file }))
                    }
                  />
                ))}
              </div>
            ) : null}

            {isKdkmpManager && mode === "start" ? (
              <div className="space-y-3 rounded-lg border border-border p-3">
                <div>
                  <p className="text-sm font-medium">Alokasi anggota</p>
                  <p className="text-xs text-muted-foreground">
                    Isi jumlah anggota per role. Sisa yang tersedia tertera di samping.
                  </p>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  {OPERATIONAL_ATTENDANCE_ROLES.map((role) => (
                    <div key={role.key} className="flex items-center gap-2">
                      <Label htmlFor={`allocation_${role.key}`} className="w-40 text-xs">
                        {role.label}
                      </Label>
                      <Input
                        id={`allocation_${role.key}`}
                        type="number"
                        min={0}
                        className="w-20"
                        value={allocations[role.key]}
                        onChange={(event) =>
                          setAllocations((current) => ({
                            ...current,
                            [role.key]: event.target.value,
                          }))
                        }
                        disabled={selfAssigned}
                      />
                      <span className="text-xs text-muted-foreground">
                        Tersedia: {attendanceAvailable?.[role.key] ?? 0}
                      </span>
                    </div>
                  ))}
                </div>

                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={selfAssigned}
                    onCheckedChange={(checked) => setSelfAssigned(checked === true)}
                  />
                  Manager KDKMP mengerjakan sendiri (alokasi 0)
                </label>
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Batal
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Memproses…" : mode === "start" ? "Mulai Task" : "Selesaikan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
