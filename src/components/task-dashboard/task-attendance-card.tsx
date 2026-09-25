import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { OPERATIONAL_ATTENDANCE_ROLES } from "@/lib/task-constants";
import type { DashboardAttendance } from "@/types/task-dashboard";
import Link from "next/link";

export function TaskAttendanceCard({ attendance, inputHref }: { attendance: DashboardAttendance; inputHref?: string }) {
  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">Kehadiran operasional</CardTitle>
          <Badge variant={attendance.is_saved ? "default" : "outline"}>
            {attendance.is_saved ? "Sudah disimpan" : "Belum disimpan"}
          </Badge>
        </div>
        <CardDescription>
          Jumlah anggota hadir hari ini, yang sudah teralokasi ke task berjalan, dan sisa yang tersedia.
        </CardDescription>
        {inputHref ? <Link href={inputHref} className={buttonVariants({ variant: "outline", size: "sm" })}>Kelola kehadiran</Link> : null}
      </CardHeader>
      <CardContent>
        <Table className="min-w-[520px]">
          <TableHeader>
            <TableRow>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Hadir</TableHead>
              <TableHead className="text-right">Terpakai</TableHead>
              <TableHead className="text-right">Tersedia</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {OPERATIONAL_ATTENDANCE_ROLES.map((role) => (
              <TableRow key={role.key}>
                <TableCell>{role.label}</TableCell>
                <TableCell className="text-right tabular-nums">{attendance.values[role.key] ?? 0}</TableCell>
                <TableCell className="text-right tabular-nums">{attendance.allocated[role.key] ?? 0}</TableCell>
                <TableCell className="text-right tabular-nums font-medium">
                  {attendance.available[role.key] ?? 0}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
