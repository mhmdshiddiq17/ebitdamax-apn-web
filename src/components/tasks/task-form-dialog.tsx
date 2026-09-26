"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { TaskAdditionalFieldsEditor, type DraftAdditionalField } from "@/components/tasks/task-additional-fields-editor";
import { TaskCostFields } from "@/components/tasks/task-cost-fields";
import { Button, buttonVariants } from "@/components/ui/button";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api";
import { BMC_STATUS_OPTIONS, OPTION_BASED_INPUT_TYPES, PERIOD_OPTIONS } from "@/lib/task-constants";
import { cn } from "@/lib/utils";
import type { CostBreakdown, TaskCategoryRef, TaskRow, TaskRoleRef } from "@/types/task";

const EMPTY_COST: CostBreakdown = { man: 0, machine: 0, method: 0, material: 0 };

function toDraftFields(task: TaskRow | null): DraftAdditionalField[] {
  if (!task) {
    return [];
  }

  return task.additional_fields.map((field) => ({
    id: field.id,
    label: field.label,
    input_type: field.input_type,
    show_when: field.show_when,
    is_required: field.is_required,
    optionsText: field.options.join("\n"),
  }));
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: TaskRow | null;
  categories: TaskCategoryRef[];
  roles: TaskRoleRef[];
  onSaved: () => void;
};

export function TaskFormDialog({ open, onOpenChange, task, categories, roles, onSaved }: Props) {
  const isEdit = task !== null;

  const [name, setName] = useState(task?.name ?? "");
  const [categoryId, setCategoryId] = useState<string | null>(task?.task_category_id ? String(task.task_category_id) : null);
  const [roleIds, setRoleIds] = useState<number[]>(task?.role_ids ?? []);
  const [bmcStatus, setBmcStatus] = useState(task?.bmc_status ?? "belum_dipetakan");
  const [period, setPeriod] = useState(task?.period ?? "once");
  const [description, setDescription] = useState(task?.description ?? "");
  const [executionTime, setExecutionTime] = useState(task?.execution_time ?? "");
  const [timeRequire, setTimeRequire] = useState(task ? String(task.time_require) : "30");
  const [lowerThreshold, setLowerThreshold] = useState(
    task?.lower_time_threshold_minutes != null ? String(task.lower_time_threshold_minutes) : "",
  );
  const [upperThreshold, setUpperThreshold] = useState(
    task?.upper_time_threshold_minutes != null ? String(task.upper_time_threshold_minutes) : "",
  );
  const [sortOrder, setSortOrder] = useState(task?.sort_order != null ? String(task.sort_order) : "");
  const [isActive, setIsActive] = useState(task?.is_active ?? true);
  const [isMandatory, setIsMandatory] = useState(task?.is_mandatory ?? false);
  const [fixedCost, setFixedCost] = useState<CostBreakdown>(task?.fixed_cost ?? { ...EMPTY_COST });
  const [variableCost, setVariableCost] = useState<CostBreakdown>(task?.variable_cost ?? { ...EMPTY_COST });
  const [fields, setFields] = useState<DraftAdditionalField[]>(() => toDraftFields(task));
  const [submitting, setSubmitting] = useState(false);

  const categoryItems = categories.map((category) => ({ value: String(category.id), label: category.name }));

  function toggleRole(roleId: number) {
    setRoleIds((current) =>
      current.includes(roleId) ? current.filter((id) => id !== roleId) : [...current, roleId],
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (categoryId === null) {
      toast.error("Kategori task wajib dipilih");
      return;
    }
    if (roleIds.length === 0) {
      toast.error("Minimal satu role wajib dipilih");
      return;
    }
    if ((lowerThreshold === "") !== (upperThreshold === "")) {
      toast.error("Ambang waktu bawah dan atas harus diisi bersama");
      return;
    }

    setSubmitting(true);

    const payload = {
      task_category_id: Number(categoryId),
      bmc_status: bmcStatus,
      role_ids: roleIds,
      sort_order: sortOrder === "" ? null : Number(sortOrder),
      name,
      description: description.trim() === "" ? null : description,
      execution_time: executionTime === "" ? null : executionTime,
      time_require: Number(timeRequire),
      lower_time_threshold_minutes: lowerThreshold === "" ? null : Number(lowerThreshold),
      upper_time_threshold_minutes: upperThreshold === "" ? null : Number(upperThreshold),
      period,
      is_active: isActive,
      is_mandatory: isMandatory,
      fixed_cost: fixedCost,
      variable_cost: variableCost,
      additional_fields: fields.map((field) => ({
        id: field.id ?? null,
        label: field.label,
        input_type: field.input_type,
        show_when: field.show_when,
        is_required: field.is_required,
        options: OPTION_BASED_INPUT_TYPES.includes(field.input_type)
          ? field.optionsText
              .split("\n")
              .map((option) => option.trim())
              .filter((option) => option !== "")
          : [],
      })),
    };

    try {
      if (isEdit) {
        await apiFetch(`/tasks/${task.id}`, { method: "PUT", body: JSON.stringify(payload) });
        toast.success("Task berhasil diperbarui.");
      } else {
        await apiFetch("/tasks", { method: "POST", body: JSON.stringify(payload) });
        toast.success("Task berhasil ditambahkan.");
      }

      onSaved();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan task");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit Task" : "Tambah Task"}</DialogTitle>
            <DialogDescription>
              {isEdit ? "Perbarui detail task, biaya, dan field tambahan." : "Task baru beserta role dan biayanya."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="task_name">Nama</Label>
                <Input
                  id="task_name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  maxLength={255}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="task_category">Kategori</Label>
                <Select items={categoryItems} value={categoryId} onValueChange={(value) => setCategoryId(value)}>
                  <SelectTrigger id="task_category" className="w-full">
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Role pelaksana</Label>
              <div className="flex flex-wrap gap-2">
                {roles.map((role) => {
                  const selected = roleIds.includes(role.id);

                  return (
                    <button
                      key={role.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => toggleRole(role.id)}
                      className={cn(buttonVariants({ variant: selected ? "default" : "outline", size: "sm" }))}
                    >
                      {role.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="task_bmc">Poin BMC</Label>
                <Select
                  items={BMC_STATUS_OPTIONS}
                  value={bmcStatus}
                  onValueChange={(value) => setBmcStatus(value ?? "belum_dipetakan")}
                >
                  <SelectTrigger id="task_bmc" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BMC_STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="task_period">Periode</Label>
                <Select items={PERIOD_OPTIONS} value={period} onValueChange={(value) => setPeriod(value ?? "once")}>
                  <SelectTrigger id="task_period" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PERIOD_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="task_execution_time">Jam pelaksanaan</Label>
                <Input
                  id="task_execution_time"
                  type="time"
                  value={executionTime}
                  onChange={(event) => setExecutionTime(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="task_sort_order">Nomor urut</Label>
                <Input
                  id="task_sort_order"
                  type="number"
                  min={1}
                  value={sortOrder}
                  onChange={(event) => setSortOrder(event.target.value)}
                  placeholder="Opsional"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="task_time_require">Estimasi waktu (menit)</Label>
                <Input
                  id="task_time_require"
                  type="number"
                  min={1}
                  value={timeRequire}
                  onChange={(event) => setTimeRequire(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="task_lower">Ambang waktu bawah (menit)</Label>
                <Input
                  id="task_lower"
                  type="number"
                  min={0}
                  value={lowerThreshold}
                  onChange={(event) => setLowerThreshold(event.target.value)}
                  placeholder="Opsional"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="task_upper">Ambang waktu atas (menit)</Label>
                <Input
                  id="task_upper"
                  type="number"
                  min={0}
                  value={upperThreshold}
                  onChange={(event) => setUpperThreshold(event.target.value)}
                  placeholder="Opsional"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-6">
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <Checkbox checked={isActive} onCheckedChange={(checked) => setIsActive(checked === true)} />
                Task aktif
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <Checkbox checked={isMandatory} onCheckedChange={(checked) => setIsMandatory(checked === true)} />
                Task wajib
              </label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="task_description">Deskripsi (opsional)</Label>
              <Textarea
                id="task_description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={2}
              />
            </div>

            <TaskCostFields idPrefix="task_fixed" title="Fixed cost" value={fixedCost} onChange={setFixedCost} />
            <TaskCostFields
              idPrefix="task_variable"
              title="Variable cost"
              value={variableCost}
              onChange={setVariableCost}
            />

            <TaskAdditionalFieldsEditor value={fields} onChange={setFields} />
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
