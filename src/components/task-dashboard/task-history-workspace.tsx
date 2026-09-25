"use client";

import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/formatters";
import type { HistoryDay } from "@/types/task-history";

type Props = {
  days: HistoryDay[];
};

function SummaryMetric({ label, value, tone = "default" }: { label: string; value: number; tone?: "default" | "success" | "warning" | "danger" }) {
  const className = {
    default: "bg-muted text-foreground",
    success: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    warning: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    danger: "bg-destructive/10 text-destructive",
  }[tone];

  return (
    <div className={`rounded-lg p-3 ${className}`}>
      <p className="text-xs">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

export function TaskHistoryWorkspace({ days }: Props) {
  const [selectedDay, setSelectedDay] = useState<HistoryDay | null>(null);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Riwayat per Tanggal</CardTitle>
          <CardDescription>Pilih Detail untuk melihat ringkasan angka pada tanggal tersebut.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead className="w-px text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {days.map((day) => (
                <TableRow key={day.date}>
                  <TableCell className="font-medium">{formatDate(day.date)}</TableCell>
                  <TableCell className="text-right">
                    <Button type="button" variant="outline" size="sm" onClick={() => setSelectedDay(day)}>
                      Detail
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={selectedDay !== null} onOpenChange={(open) => !open && setSelectedDay(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><CalendarDays /> {selectedDay ? formatDate(selectedDay.date) : "Detail tugas"}</DialogTitle>
          </DialogHeader>
          {selectedDay ? (
            <div className="grid grid-cols-2 gap-3">
              <SummaryMetric label="Jumlah Tugas" value={selectedDay.total_tasks} />
              <SummaryMetric label="Tepat Waktu" value={selectedDay.on_time_tasks} tone="success" />
              <SummaryMetric label="Terlambat" value={selectedDay.late_tasks} tone="warning" />
              <SummaryMetric label="Tidak Dikerjakan" value={selectedDay.not_worked_tasks.length} tone="danger" />
            </div>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setSelectedDay(null)}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
