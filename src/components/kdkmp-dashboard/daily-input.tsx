"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api";
import { OPERATIONAL_ATTENDANCE_ROLES } from "@/lib/task-constants";
import type { KdkmpDashboardInputResponse } from "@/types/kdkmp-dashboard";

type SubmitTarget = "daily" | "selection" | "attendance";

export function KdkmpDailyInput({ data }: { data: KdkmpDashboardInputResponse }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState<SubmitTarget | null>(null);
  const [planRevenue, setPlanRevenue] = useState(data.today_entry?.plan_revenue ?? "");
  const [variableCost, setVariableCost] = useState(data.today_entry?.variable_cost ?? "");
  const [selectedTaskIDs, setSelectedTaskIDs] = useState<number[]>(data.task_selection.selected_task_ids);
  const [attendance, setAttendance] = useState<Record<string, string>>(() =>
    Object.fromEntries(OPERATIONAL_ATTENDANCE_ROLES.map((role) => [role.key, String(data.today_entry?.operational_attendance[role.key] ?? 0)])),
  );

  const groups = data.task_selection.tasks.reduce<Array<{ label: string; tasks: typeof data.task_selection.tasks }>>((all, task) => {
    const group = all.find((item) => item.label === task.bmc_status);
    if (group) group.tasks.push(task);
    else all.push({ label: task.bmc_status, tasks: [task] });
    return all;
  }, []);

  async function submit(target: SubmitTarget, path: string, body: unknown) {
    setSubmitting(target);
    try {
      await apiFetch(path, { method: "PUT", body: JSON.stringify(body) });
      toast.success("Data dashboard harian berhasil disimpan.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan data");
    } finally {
      setSubmitting(null);
    }
  }

  function toggleGroup(taskIDs: number[], checked: boolean) {
    setSelectedTaskIDs((current) => checked ? [...new Set([...current, ...taskIDs])] : current.filter((id) => !taskIDs.includes(id)));
  }

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Target & biaya hari ini</CardTitle>
          <CardDescription>Masukkan angka tanpa pemisah ribuan; nilai aktual dihitung dari task yang selesai.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={(event: FormEvent) => { event.preventDefault(); void submit("daily", "/kdkmp-dashboard/today", { plan_revenue: planRevenue, variable_cost: variableCost || null }); }}>
            <div className="space-y-2">
              <Label htmlFor="plan-revenue">Plan revenue</Label>
              <Input id="plan-revenue" type="number" min="0" step="0.01" required value={planRevenue} onChange={(event) => setPlanRevenue(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="variable-cost">Variable cost rencana</Label>
              <Input id="variable-cost" type="number" min="0" step="0.01" value={variableCost} onChange={(event) => setVariableCost(event.target.value)} />
            </div>
            <Button type="submit" disabled={submitting !== null}>{submitting === "daily" ? "Menyimpan…" : "Simpan target"}</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Kehadiran operasional</CardTitle>
          <CardDescription>Task tidak dapat dimulai sebelum jumlah kehadiran disimpan.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 sm:grid-cols-2" onSubmit={(event: FormEvent) => { event.preventDefault(); void submit("attendance", "/kdkmp-dashboard/today/operational-attendance", { operational_attendance: Object.fromEntries(Object.entries(attendance).map(([key, value]) => [key, Number(value)])) }); }}>
            {OPERATIONAL_ATTENDANCE_ROLES.map((role) => (
              <div key={role.key} className="space-y-2">
                <Label htmlFor={`attendance-${role.key}`}>{role.label}</Label>
                <Input id={`attendance-${role.key}`} type="number" min="0" step="1" required value={attendance[role.key]} onChange={(event) => setAttendance((current) => ({ ...current, [role.key]: event.target.value }))} />
              </div>
            ))}
            <div className="sm:col-span-2"><Button type="submit" disabled={submitting !== null}>{submitting === "attendance" ? "Menyimpan…" : "Simpan kehadiran"}</Button></div>
          </form>
        </CardContent>
      </Card>

      <Card className="xl:col-span-2">
        <CardHeader>
          <CardTitle>Pilihan task opsional</CardTitle>
          <CardDescription>Memilih satu task akan mengaktifkan seluruh task opsional pada poin BMC yang sama. Task yang sedang berjalan tidak dapat dilepas.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={(event: FormEvent) => { event.preventDefault(); void submit("selection", "/kdkmp-dashboard/today/task-selection", { selected_task_ids: selectedTaskIDs }); }}>
            {groups.map((group) => {
              const optionalTasks = group.tasks.filter((task) => !task.is_mandatory);
              const taskIDs = optionalTasks.map((task) => task.id);
              const checked = taskIDs.length > 0 && taskIDs.every((id) => selectedTaskIDs.includes(id));
              const locked = optionalTasks.some((task) => task.is_locked);
              const label = group.tasks[0]?.bmc_status_label ?? "Kategori lainnya";
              return (
                <div key={group.label} className="rounded-lg border p-4">
                  <label className="flex items-center gap-3 font-medium">
                    {optionalTasks.length ? <Checkbox checked={checked} disabled={locked} onCheckedChange={(value) => toggleGroup(taskIDs, value === true)} /> : null}
                    <span>{label}</span>
                    {locked ? <Badge>Berjalan</Badge> : null}
                  </label>
                  <ul className="mt-3 space-y-2 pl-7 text-sm text-muted-foreground">
                    {group.tasks.map((task) => <li key={task.id}>{task.name}{task.is_mandatory ? " · wajib" : ""}{task.execution_time ? ` · ${task.execution_time}` : ""}</li>)}
                  </ul>
                </div>
              );
            })}
            <Button type="submit" disabled={submitting !== null}>{submitting === "selection" ? "Menyimpan…" : "Simpan pilihan task"}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
