"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2, ClipboardList, Clock, Download, Eye, FileText, ImageIcon } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { KdkmpMonitoringReport, KdkmpMonitoringTasksResponse } from "@/types/kdkmp-monitoring";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

type Props = {
  data: KdkmpMonitoringTasksResponse;
};

function assetURL(path: string) {
  return `${API_BASE}${path}`;
}

function formatDateTime(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function formatDateDisplay(value: string) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(new Date(`${value}T00:00:00`));
}

function formatDuration(minutes: number | null) {
  const total = minutes ?? 0;
  if (total < 60) return `${total} menit`;
  const hours = Math.floor(total / 60);
  const remainder = total % 60;
  return remainder > 0 ? `${hours} jam ${remainder} menit` : `${hours} jam`;
}

function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatReportValue(value: string | null) {
  if (value === null || value === "") return "-";
  try {
    const parsed: unknown = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.join(", ") || "-";
    }
  } catch {
    return value;
  }
  return value;
}

function formatTimeThreshold(lower: number | null, upper: number | null) {
  if (lower === null && upper === null) return "Belum ditentukan";
  if (lower === null) return `Maks. ${upper} menit`;
  if (upper === null) return `Min. ${lower} menit`;
  return `${lower}–${upper} menit`;
}

export function TaskReportsView({ data }: Props) {
  const [selectedReport, setSelectedReport] = useState<KdkmpMonitoringReport | null>(null);
  const { kdkmp_entry: entry, date, reports } = data;

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Kembali ke monitoring"
                nativeButton={false}
                render={<Link href="/admin/kdkmp-dashboard" />}
              >
                <ArrowLeft className="size-4" aria-hidden="true" />
              </Button>
              <p className="text-sm font-medium tracking-wide text-primary uppercase">Detail Task Pekerjaan</p>
            </div>
            <h1 className="mt-2 font-heading text-2xl font-semibold">{entry.name ?? "-"}</h1>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              Daftar task yang diselesaikan oleh <span className="font-medium text-foreground">{entry.manager?.name ?? "Manager"}</span> pada
              tanggal <span className="font-medium text-foreground">{formatDateDisplay(date)}</span>.
            </p>
          </div>
          <Badge variant="outline" className="w-fit">
            {reports.length} task selesai
          </Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Riwayat Tugas Selesai</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-200">
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-65">Nama Task</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>PIC Roles</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                      Belum ada tugas selesai pada tanggal ini.
                    </TableCell>
                  </TableRow>
                ) : null}
                {reports.map((report) => (
                  <TableRow key={report.uuid}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <ClipboardList className="size-5" aria-hidden="true" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium">{report.task?.name ?? "-"}</p>
                          <p className="truncate text-xs text-muted-foreground">{report.task?.description ?? "-"}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{report.task?.task_category?.name ?? "-"}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {(report.task?.roles ?? []).map((role) => (
                          <Badge key={role.id} variant="secondary">
                            {role.name}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="size-3" aria-hidden="true" />
                        {report.status_label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => setSelectedReport(report)}>
                        <Eye className="size-4" aria-hidden="true" />
                        Detail
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={selectedReport !== null} onOpenChange={(open) => !open && setSelectedReport(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader className="border-b p-6 pb-4">
            <DialogTitle>Detail Laporan Tugas</DialogTitle>
          </DialogHeader>

          {selectedReport ? (
            <div className="space-y-6 px-6 pb-6">
              <section className="space-y-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{selectedReport.task?.name ?? "-"}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{selectedReport.task?.description ?? "Tidak ada deskripsi."}</p>
                  </div>
                  <Badge className="w-fit shrink-0 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="size-3" aria-hidden="true" />
                    {selectedReport.status_label}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedReport.task?.task_category ? <Badge variant="secondary">{selectedReport.task.task_category.name}</Badge> : null}
                  {(selectedReport.task?.roles ?? []).map((role) => (
                    <Badge key={role.id} variant="outline">
                      PIC: {role.name}
                    </Badge>
                  ))}
                  {selectedReport.manager_self_assigned ? <Badge variant="outline">Dikerjakan sendiri oleh Manager KDKMP</Badge> : null}
                </div>
              </section>

              <section>
                <h4 className="mb-3 text-sm font-semibold">Waktu Pengerjaan</h4>
                <div className="grid gap-3 rounded-lg bg-muted/30 p-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Waktu Mulai</p>
                    <p className="mt-1 text-sm font-medium">{formatDateTime(selectedReport.started_at)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Waktu Selesai</p>
                    <p className="mt-1 text-sm font-medium">{formatDateTime(selectedReport.finished_at)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Durasi Aktual</p>
                    <p className="mt-1 inline-flex items-center gap-1 text-sm font-medium">
                      <Clock className="size-4 text-muted-foreground" aria-hidden="true" />
                      {formatDuration(selectedReport.duration_minutes)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Estimasi / Ambang Waktu</p>
                    <p className="mt-1 text-sm font-medium">{selectedReport.task?.time_require ?? 0} menit</p>
                    <p className="text-xs text-muted-foreground">
                      {formatTimeThreshold(
                        selectedReport.task?.lower_time_threshold_minutes ?? null,
                        selectedReport.task?.upper_time_threshold_minutes ?? null,
                      )}
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <ImageIcon className="size-4" aria-hidden="true" />
                  Foto Pekerjaan
                </h4>
                {selectedReport.photos.length === 0 ? (
                  <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
                    Tidak ada foto yang dilampirkan.
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {selectedReport.photos.map((photo) => (
                      <article key={photo.phase} className="overflow-hidden rounded-lg border bg-card">
                        <a href={assetURL(photo.preview_url)} target="_blank" rel="noreferrer" className="block">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={assetURL(photo.preview_url)} alt={photo.name} className="aspect-video w-full bg-muted object-cover" />
                        </a>
                        <div className="flex items-center justify-between gap-2 p-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{photo.name}</p>
                            <p className="text-xs text-muted-foreground">Tahap {photo.phase_label}</p>
                          </div>
                          <Button
                            variant="secondary"
                            size="sm"
                            nativeButton={false}
                            render={<a href={assetURL(photo.download_url)} aria-label={`Unduh ${photo.name}`} />}
                          >
                            <Download className="size-3.5" aria-hidden="true" />
                            Unduh
                          </Button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>

              {selectedReport.values.length > 0 ? (
                <section>
                  <h4 className="mb-3 text-sm font-semibold">Data Laporan</h4>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {selectedReport.values.map((reportValue, index) => (
                      <div key={`${reportValue.phase}-${reportValue.label}-${index}`} className="rounded-lg border p-3">
                        <p className="text-xs text-muted-foreground">{reportValue.phase_label}</p>
                        <p className="mt-1 text-sm font-medium">{reportValue.label}</p>
                        {reportValue.file ? (
                          <div className="mt-3 flex flex-col gap-3 rounded-md border bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex min-w-0 items-center gap-2">
                              <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                              <div className="min-w-0">
                                <p className="truncate text-sm text-muted-foreground">{reportValue.file.name}</p>
                                <p className="text-xs text-muted-foreground">{formatFileSize(reportValue.file.size)}</p>
                              </div>
                            </div>
                            <div className="flex shrink-0 gap-2">
                              <Button
                                variant="secondary"
                                size="sm"
                                nativeButton={false}
                                render={<a href={assetURL(reportValue.file.preview_url)} target="_blank" rel="noreferrer" />}
                              >
                                <Eye className="size-3.5" aria-hidden="true" />
                                Preview
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                nativeButton={false}
                                render={<a href={assetURL(reportValue.file.download_url)} aria-label={`Unduh ${reportValue.file.name}`} />}
                              >
                                <Download className="size-3.5" aria-hidden="true" />
                                Unduh
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p className="mt-1 text-sm whitespace-pre-wrap text-muted-foreground">{formatReportValue(reportValue.value)}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}

              <section>
                <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <FileText className="size-4" aria-hidden="true" />
                  Dokumen Terlampir
                </h4>
                {selectedReport.documents.length === 0 ? (
                  <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
                    Tidak ada dokumen yang dilampirkan.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedReport.documents.map((document, index) => (
                      <div
                        key={`${document.phase}-${document.name}-${index}`}
                        className="flex flex-col gap-3 rounded-md border bg-card p-3 shadow-xs sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex size-9 shrink-0 items-center justify-center rounded bg-primary/10 text-primary">
                            <FileText className="size-4" aria-hidden="true" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{document.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Tahap {document.phase_label} · {formatFileSize(document.size)}
                            </p>
                          </div>
                        </div>
                        <div className="flex shrink-0 gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            nativeButton={false}
                            render={<a href={assetURL(document.preview_url)} target="_blank" rel="noreferrer" aria-label={`Preview ${document.name}`} />}
                          >
                            <Eye className="size-3.5" aria-hidden="true" />
                            Preview
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            nativeButton={false}
                            render={<a href={assetURL(document.download_url)} aria-label={`Unduh ${document.name}`} />}
                          >
                            <Download className="size-3.5" aria-hidden="true" />
                            Unduh
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
