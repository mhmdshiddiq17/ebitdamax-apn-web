"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, ChevronRight, CircleDashed, LockKeyhole, MapPinned, Search, Store } from "lucide-react";
import { useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { toast } from "sonner";
import { MonthlyFinancialMatrixChart } from "@/components/kdkmp-monitoring/monthly-financial-matrix-chart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiFetch } from "@/lib/api";
import { formatDate, formatNumber, formatRupiah } from "@/lib/formatters";
import type {
  KdkmpMonitoringConsolidationLevel,
  KdkmpMonitoringConsolidationRow,
  KdkmpMonitoringDailyEntry,
  KdkmpMonitoringEntry,
  KdkmpMonitoringRegionOption,
  KdkmpMonitoringResponse,
  KdkmpMonitoringStatus,
} from "@/types/kdkmp-monitoring";

type Props = {
  initialData: KdkmpMonitoringResponse;
};

type RegionOptionField = keyof KdkmpMonitoringRegionOption;

const ALL_REGION_VALUE = "__all_regions__";

const levelLabels: Record<KdkmpMonitoringConsolidationLevel, string> = {
  national: "Nasional",
  province: "Provinsi",
  regency: "Kabupaten/Kota",
  district: "Kecamatan",
  village: "Desa",
};

const levelOrder: KdkmpMonitoringConsolidationLevel[] = ["national", "province", "regency", "district", "village"];

const dashboardFields: Array<{ key: keyof KdkmpMonitoringDailyEntry; label: string; isRupiah?: boolean }> = [
  { key: "target_revenue", label: "Target Revenue (Hari Ini)", isRupiah: true },
  { key: "plan_revenue", label: "Plan Revenue", isRupiah: true },
  { key: "actual_revenue", label: "Actual Revenue", isRupiah: true },
  { key: "variable_cost", label: "Variable Cost", isRupiah: true },
  { key: "actual_cost", label: "Actual Cost", isRupiah: true },
  { key: "actual_ebitda_margin", label: "Actual EBITDA Margin (%)" },
  { key: "total_duration", label: "Total Duration" },
  { key: "performance_scoring", label: "Performance Scoring" },
];

function formatManualValue(value: unknown, isRupiah: boolean): string {
  if (typeof value !== "string" || value.trim() === "") {
    return value === null || value === undefined ? "-" : String(value);
  }
  if (!isRupiah || !/^-?\d+(\.\d{0,2})?$/.test(value)) {
    return value;
  }
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 2 }).format(Number(value));
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort((first, second) => first.localeCompare(second, "id"));
}

function regionValues(options: KdkmpMonitoringRegionOption[], field: RegionOptionField): string[] {
  return uniqueSorted(options.map((option) => option[field]));
}

function nextLevel(level: KdkmpMonitoringConsolidationLevel): KdkmpMonitoringConsolidationLevel | null {
  return levelOrder[levelOrder.indexOf(level) + 1] ?? null;
}

function StatusBadge({ entry }: { entry: KdkmpMonitoringEntry["daily_entry"] }) {
  if (!entry) {
    return <Badge variant="outline">Belum diisi</Badge>;
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">Lengkap</Badge>
      {entry.plan_revenue_requires_review ? <Badge variant="destructive">Review Plan Revenue</Badge> : null}
    </div>
  );
}

function SummaryCard({ label, value, icon, tone }: { label: string; value: number; icon: ReactNode; tone: string }) {
  return (
    <div className={`rounded-lg p-4 ${tone}`}>
      <p className="flex items-center gap-2 text-xs">{icon}{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{formatNumber(value)}</p>
    </div>
  );
}

function LockedRegionValue({ value }: { value: string }) {
  return (
    <div className="flex min-h-9 items-center justify-between gap-2 rounded-md border bg-muted/40 px-3 text-sm">
      <span className="truncate">{value}</span>
      <LockKeyhole className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
    </div>
  );
}

function RegionCard({
  level,
  row,
  selected,
  onSelect,
}: {
  level: KdkmpMonitoringConsolidationLevel;
  row: KdkmpMonitoringConsolidationRow;
  selected: boolean;
  onSelect: () => void;
}) {
  const followUpLevel = nextLevel(level);
  const gapTone = row.gap === null ? "text-muted-foreground" : row.gap < 0 ? "text-destructive" : "text-emerald-700 dark:text-emerald-400";

  const content = (
    <div
      className={`h-full rounded-lg border bg-card p-5 shadow-xs transition-colors ${
        selected ? "" : "hover:border-primary/50"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{levelLabels[level]}</p>
          <h3 className="mt-1 truncate text-lg font-semibold text-foreground">{row.label}</h3>
        </div>
        {!selected ? (
          <div className="rounded-full bg-primary/10 p-2 text-primary">
            <ChevronRight className="size-4" aria-hidden="true" />
          </div>
        ) : null}
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
        <div>
          <dt className="text-muted-foreground">KDKMP</dt>
          <dd className="mt-1 text-lg font-semibold tabular-nums">{formatNumber(row.total_kdkmp)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Data Lengkap</dt>
          <dd className="mt-1 text-lg font-semibold tabular-nums">{formatNumber(row.complete_kdkmp)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Plan Revenue</dt>
          <dd className="mt-1 font-medium tabular-nums">{row.plan_revenue === null ? "-" : formatRupiah(row.plan_revenue)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Actual Revenue</dt>
          <dd className="mt-1 font-medium tabular-nums">{row.actual_revenue === null ? "-" : formatRupiah(row.actual_revenue)}</dd>
        </div>
        <div className="col-span-2 border-t pt-3">
          <dt className="text-muted-foreground">Gap</dt>
          <dd className={`mt-1 font-semibold tabular-nums ${gapTone}`}>{row.gap === null ? "-" : formatRupiah(row.gap)}</dd>
        </div>
      </dl>

      <p className="mt-5 text-sm text-muted-foreground">
        {selected ? "KDKMP sedang dipilih." : followUpLevel ? `Klik untuk melihat ${levelLabels[followUpLevel]}.` : "Klik untuk melihat grafik KDKMP."}
      </p>
    </div>
  );

  if (selected) {
    return content;
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      className="h-full w-full rounded-lg text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
      aria-label={`Lihat ${followUpLevel ? levelLabels[followUpLevel] : "grafik KDKMP"} dari ${row.label}`}
    >
      {content}
    </button>
  );
}

export function KdkmpMonitoringDashboard({ initialData }: Props) {
  const [month, setMonth] = useState(initialData.filters.month);
  const [searchInput, setSearchInput] = useState(initialData.filters.search);
  const [search, setSearch] = useState(initialData.filters.search);
  const [status, setStatus] = useState<KdkmpMonitoringStatus>(initialData.filters.status);
  const [provinsi, setProvinsi] = useState(initialData.filters.provinsi ?? "");
  const [kotaKabupaten, setKotaKabupaten] = useState(initialData.filters.kota_kabupaten ?? "");
  const [kecamatan, setKecamatan] = useState(initialData.filters.kecamatan ?? "");
  const [desa, setDesa] = useState(initialData.filters.desa ?? "");
  const [level, setLevel] = useState<KdkmpMonitoringConsolidationLevel>(initialData.consolidation.level);
  const [detailDate, setDetailDate] = useState<string | null>(initialData.filters.detail_date);
  const [page, setPage] = useState(1);

  const params = useMemo(() => {
    const query = new URLSearchParams({
      month,
      status,
      consolidation_level: level,
      page: String(page),
    });
    if (search) query.set("search", search);
    if (detailDate) query.set("detail_date", detailDate);
    if (provinsi) query.set("provinsi", provinsi);
    if (kotaKabupaten) query.set("kota_kabupaten", kotaKabupaten);
    if (kecamatan) query.set("kecamatan", kecamatan);
    if (desa) query.set("desa", desa);
    return query.toString();
  }, [month, status, level, page, search, detailDate, provinsi, kotaKabupaten, kecamatan, desa]);

  const isDefaultQuery =
    page === 1 &&
    month === initialData.filters.month &&
    search === initialData.filters.search &&
    status === initialData.filters.status &&
    detailDate === initialData.filters.detail_date &&
    level === initialData.consolidation.level &&
    provinsi === (initialData.filters.provinsi ?? "") &&
    kotaKabupaten === (initialData.filters.kota_kabupaten ?? "") &&
    kecamatan === (initialData.filters.kecamatan ?? "") &&
    desa === (initialData.filters.desa ?? "");

  const { data, isFetching, isError } = useQuery({
    queryKey: ["kdkmp-monitoring", params],
    queryFn: () => apiFetch<KdkmpMonitoringResponse>(`/admin/kdkmp-dashboard?${params}`),
    initialData: isDefaultQuery ? initialData : undefined,
    placeholderData: (previous) => previous,
  });

  const response = data ?? initialData;
  const access = response.regional_access;
  const regionOptions = response.region_options;

  const provinsiOptions = useMemo(() => regionValues(regionOptions, "provinsi"), [regionOptions]);
  const kotaKabupatenOptions = useMemo(
    () => regionValues(regionOptions.filter((option) => !provinsi || option.provinsi === provinsi), "kota_kabupaten"),
    [provinsi, regionOptions],
  );
  const kecamatanOptions = useMemo(
    () =>
      regionValues(
        regionOptions.filter((option) => option.provinsi === provinsi && option.kota_kabupaten === kotaKabupaten),
        "kecamatan",
      ),
    [kotaKabupaten, provinsi, regionOptions],
  );
  const desaOptions = useMemo(
    () =>
      regionValues(
        regionOptions.filter(
          (option) => option.provinsi === provinsi && option.kota_kabupaten === kotaKabupaten && option.kecamatan === kecamatan,
        ),
        "desa",
      ),
    [kecamatan, kotaKabupaten, provinsi, regionOptions],
  );

  const submitFilters = (event: FormEvent) => {
    event.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  };

  const visitConsolidation = (
    nextConsolidationLevel: KdkmpMonitoringConsolidationLevel,
    region: Partial<Record<RegionOptionField, string | null>> = {},
  ) => {
    const locked = access.locked_filters;
    setLevel(nextConsolidationLevel);
    setProvinsi(locked.provinsi ?? region.provinsi ?? provinsi);
    setKotaKabupaten(locked.kota_kabupaten ?? region.kota_kabupaten ?? kotaKabupaten);
    setKecamatan(locked.kecamatan ?? region.kecamatan ?? kecamatan);
    setDesa(locked.desa ?? region.desa ?? desa);
    setPage(1);
  };

  const visitHierarchyLevel = (targetLevel: KdkmpMonitoringConsolidationLevel) => {
    visitConsolidation(targetLevel, {
      provinsi: targetLevel === "national" || targetLevel === "province" ? "" : provinsi,
      kota_kabupaten: targetLevel === "national" || targetLevel === "province" || targetLevel === "regency" ? "" : kotaKabupaten,
      kecamatan: targetLevel === "village" ? kecamatan : "",
      desa: "",
    });
  };

  const drillDown = (row: KdkmpMonitoringConsolidationRow) => {
    const locked = access.locked_filters;

    if (response.consolidation.level === "national") {
      visitConsolidation("province", locked);
      return;
    }
    if (response.consolidation.level === "province") {
      visitConsolidation("regency", { provinsi: row.provinsi, kota_kabupaten: locked.kota_kabupaten, kecamatan: locked.kecamatan, desa: locked.desa });
      return;
    }
    if (response.consolidation.level === "regency") {
      visitConsolidation("district", { provinsi: row.provinsi, kota_kabupaten: row.kota_kabupaten, kecamatan: locked.kecamatan, desa: locked.desa });
      return;
    }
    if (response.consolidation.level === "district") {
      visitConsolidation("village", { provinsi: row.provinsi, kota_kabupaten: row.kota_kabupaten, kecamatan: row.kecamatan, desa: locked.desa });
      return;
    }
    visitConsolidation("village", {
      provinsi: row.provinsi,
      kota_kabupaten: row.kota_kabupaten,
      kecamatan: row.kecamatan,
      desa: row.desa,
    });
  };

  const returnToVillageList = () => {
    visitConsolidation("village", { provinsi, kota_kabupaten: kotaKabupaten, kecamatan, desa: "" });
  };

  const visibleLevels = access.is_national ? levelOrder : levelOrder.filter((item) => item !== "national");
  const currentLevelIndex = visibleLevels.indexOf(response.consolidation.level);

  const meta = response.entries.meta;
  const from = meta.total === 0 ? 0 : (meta.page - 1) * meta.per_page + 1;
  const to = Math.min(meta.page * meta.per_page, meta.total);

  return (
    <div className="space-y-6" aria-busy={isFetching}>
      {isError ? (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Gagal memuat data monitoring. Coba muat ulang halaman.
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <MapPinned className="size-4 text-primary" aria-hidden="true" />
        Cakupan akses: <span className="font-medium text-foreground">{access.scope_label}</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Total KDKMP Manager"
          value={response.summary.total}
          icon={<Store className="size-4" aria-hidden="true" />}
          tone="bg-muted text-foreground"
        />
        <SummaryCard
          label="Data Lengkap"
          value={response.summary.complete}
          icon={<CheckCircle2 className="size-4" aria-hidden="true" />}
          tone="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
        />
        <SummaryCard
          label="Belum Diisi"
          value={response.summary.not_filled}
          icon={<CircleDashed className="size-4" aria-hidden="true" />}
          tone="bg-muted text-muted-foreground"
        />
        <SummaryCard
          label="Plan Revenue Perlu Review"
          value={response.summary.requires_review}
          icon={<AlertTriangle className="size-4" aria-hidden="true" />}
          tone="bg-destructive/10 text-destructive"
        />
      </div>

      <Card>
        <CardContent className="space-y-5 p-5">
          <div>
            <h2 className="font-semibold text-foreground">Pohon EBITDA KDKMP</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Telusuri ringkasan EBITDA berdasarkan hierarki wilayah melalui kartu di bawah.
            </p>
          </div>

          <nav aria-label="Hierarki wilayah" className="flex flex-wrap items-center gap-2 text-sm">
            {visibleLevels.slice(0, currentLevelIndex + 1).map((item, index) => (
              <div key={item} className="flex items-center gap-2">
                {index > 0 ? <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" /> : null}
                {item === response.consolidation.level ? (
                  <span aria-current="page" className="font-semibold text-foreground">
                    {levelLabels[item]}
                  </span>
                ) : (
                  <button type="button" onClick={() => visitHierarchyLevel(item)} className="text-primary hover:underline">
                    {levelLabels[item]}
                  </button>
                )}
              </div>
            ))}
          </nav>

          {response.filters.desa !== null && !access.locked_filters.desa ? (
            <Button type="button" variant="outline" size="sm" onClick={returnToVillageList}>
              Kembali ke daftar Desa
            </Button>
          ) : null}

          {response.consolidation.rows.length === 0 ? (
            <div className="flex min-h-48 items-center justify-center rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              Belum ada KDKMP pada cakupan wilayah ini.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {response.consolidation.rows.map((row) => {
                const selected = response.consolidation.level === "village" && response.filters.desa === row.desa;
                return <RegionCard key={row.key} level={response.consolidation.level} row={row} selected={selected} onSelect={() => drillDown(row)} />;
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-5 p-5">
          <form onSubmit={submitFilters} className="space-y-5">
            <div className="space-y-4 rounded-md border bg-muted/20 p-4">
              <div>
                <h2 className="font-medium text-foreground">Filter Wilayah</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Opsi di bawah mengikuti cakupan akses akun. Wilayah yang sudah ditentukan penugasan dikunci.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="space-y-2">
                  <Label>Provinsi</Label>
                  {access.locked_filters.provinsi ? (
                    <LockedRegionValue value={access.locked_filters.provinsi} />
                  ) : (
                    <Select
                      items={[{ value: ALL_REGION_VALUE, label: "Semua provinsi" }, ...provinsiOptions.map((option) => ({ value: option, label: option }))]}
                      value={provinsi || ALL_REGION_VALUE}
                      onValueChange={(value) => {
                        setProvinsi(value === ALL_REGION_VALUE || value === null ? "" : value);
                        setKotaKabupaten("");
                        setKecamatan("");
                        setDesa("");
                        setPage(1);
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ALL_REGION_VALUE}>Semua provinsi</SelectItem>
                        {provinsiOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Kota/Kabupaten</Label>
                  {access.locked_filters.kota_kabupaten ? (
                    <LockedRegionValue value={access.locked_filters.kota_kabupaten} />
                  ) : (
                    <Select
                      items={[{ value: ALL_REGION_VALUE, label: "Semua kota/kabupaten" }, ...kotaKabupatenOptions.map((option) => ({ value: option, label: option }))]}
                      disabled={!provinsi}
                      value={kotaKabupaten || ALL_REGION_VALUE}
                      onValueChange={(value) => {
                        setKotaKabupaten(value === ALL_REGION_VALUE || value === null ? "" : value);
                        setKecamatan("");
                        setDesa("");
                        setPage(1);
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ALL_REGION_VALUE}>Semua kota/kabupaten</SelectItem>
                        {kotaKabupatenOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Kecamatan</Label>
                  {access.locked_filters.kecamatan ? (
                    <LockedRegionValue value={access.locked_filters.kecamatan} />
                  ) : (
                    <Select
                      items={[{ value: ALL_REGION_VALUE, label: "Semua kecamatan" }, ...kecamatanOptions.map((option) => ({ value: option, label: option }))]}
                      disabled={!provinsi || !kotaKabupaten}
                      value={kecamatan || ALL_REGION_VALUE}
                      onValueChange={(value) => {
                        setKecamatan(value === ALL_REGION_VALUE || value === null ? "" : value);
                        setDesa("");
                        setPage(1);
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ALL_REGION_VALUE}>Semua kecamatan</SelectItem>
                        {kecamatanOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Desa</Label>
                  {access.locked_filters.desa ? (
                    <LockedRegionValue value={access.locked_filters.desa} />
                  ) : (
                    <Select
                      items={[{ value: ALL_REGION_VALUE, label: "Semua desa" }, ...desaOptions.map((option) => ({ value: option, label: option }))]}
                      disabled={!provinsi || !kotaKabupaten || !kecamatan}
                      value={desa || ALL_REGION_VALUE}
                      onValueChange={(value) => {
                        setDesa(value === ALL_REGION_VALUE || value === null ? "" : value);
                        setPage(1);
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ALL_REGION_VALUE}>Semua desa</SelectItem>
                        {desaOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[190px_220px_minmax(280px,1fr)_auto] xl:items-end">
              <div className="space-y-2">
                <Label htmlFor="monitoring-month">Bulan Grafik</Label>
                <Input
                  id="monitoring-month"
                  type="month"
                  max={response.business_date.slice(0, 7)}
                  value={month}
                  onChange={(event) => {
                    setMonth(event.target.value);
                    setPage(1);
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label>Status Pengisian</Label>
                <Select
                  items={[
                    { value: "all", label: "Semua status" },
                    { value: "complete", label: "Lengkap" },
                    { value: "not_filled", label: "Belum diisi" },
                    { value: "requires_review", label: "Plan Revenue perlu review" },
                  ]}
                  value={status}
                  onValueChange={(value) => {
                    setStatus(value as KdkmpMonitoringStatus);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua status</SelectItem>
                    <SelectItem value="complete">Lengkap</SelectItem>
                    <SelectItem value="not_filled">Belum diisi</SelectItem>
                    <SelectItem value="requires_review">Plan Revenue perlu review</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="monitoring-search">Cari KDKMP</Label>
                <div className="relative">
                  <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                  <Input
                    id="monitoring-search"
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder="Nama koperasi, NIK, manager, atau wilayah..."
                    className="pl-9"
                  />
                </div>
              </div>

              <Button type="submit">Terapkan Filter</Button>
            </div>
          </form>

          {response.selected_kdkmp && response.monthly_financial_matrix ? (
            <MonthlyFinancialMatrixChart
              kdkmp={response.selected_kdkmp}
              matrix={response.monthly_financial_matrix}
              detailDate={response.filters.detail_date}
              onDateClick={(date) => {
                setDetailDate(date);
                setPage(1);
              }}
            />
          ) : (
            <div className="rounded-lg border border-dashed bg-muted/10 px-5 py-8 text-center text-sm text-muted-foreground">
              Lanjutkan Pohon EBITDA sampai memilih Desa untuk melihat grafik KDKMP.
            </div>
          )}

          {response.selected_kdkmp && response.filters.detail_date ? (
            <>
              <div className="rounded-md border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                Menampilkan rincian KDKMP untuk <span className="font-medium text-foreground">{formatDate(response.filters.detail_date)}</span>.
              </div>

              <div className="overflow-x-auto">
                <Table className="min-w-300">
                  <TableHeader>
                    <TableRow>
                      <TableHead>KDKMP / Manager</TableHead>
                      <TableHead>Wilayah</TableHead>
                      {dashboardFields.map((field) => (
                        <TableHead key={field.key}>{field.label}</TableHead>
                      ))}
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {response.entries.data.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={dashboardFields.length + 4} className="py-10 text-center text-muted-foreground">
                          Tidak ada data yang sesuai dengan filter.
                        </TableCell>
                      </TableRow>
                    ) : null}
                    {response.entries.data.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <p className="font-medium">{entry.name ?? "-"}</p>
                          <p className="text-xs text-muted-foreground">NIK {entry.nik ?? "-"}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{entry.manager?.email ?? "Akun manager belum tersedia"}</p>
                        </TableCell>
                        <TableCell>
                          <p>
                            {entry.desa ?? "-"}, {entry.kecamatan ?? "-"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {entry.kota_kabupaten ?? "-"}, {entry.provinsi ?? "-"}
                          </p>
                        </TableCell>
                        {dashboardFields.map((field) => (
                          <TableCell key={field.key} className="tabular-nums">
                            {formatManualValue(entry.daily_entry?.[field.key], field.isRupiah === true)}
                          </TableCell>
                        ))}
                        <TableCell>
                          <StatusBadge entry={entry.daily_entry} />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={!entry.manager}
                            onClick={() => {
                              if (!entry.manager) {
                                return;
                              }
                              if (entry.metrics.task_completion_rate < 100) {
                                toast.error("Task belum selesai semua atau belum ada.");
                                return;
                              }
                              window.open(`/admin/kdkmp-dashboard/${entry.id}/tasks/${response.filters.detail_date}`, "_blank", "noopener,noreferrer");
                            }}
                          >
                            Lihat Task
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex flex-col gap-3 border-t pt-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                <p>
                  Menampilkan {formatNumber(from)}-{formatNumber(to)} dari {formatNumber(meta.total)} KDKMP
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={meta.page <= 1}
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                  >
                    Sebelumnya
                  </Button>
                  <span className="tabular-nums">
                    Halaman {formatNumber(meta.page)} dari {formatNumber(Math.max(1, meta.total_pages))}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={meta.page >= meta.total_pages}
                    onClick={() => setPage((current) => current + 1)}
                  >
                    Berikutnya
                  </Button>
                </div>
              </div>
            </>
          ) : response.selected_kdkmp ? (
            <div className="rounded-lg border border-dashed bg-muted/10 px-5 py-8 text-center text-sm text-muted-foreground">
              Klik salah satu tanggal pada grafik untuk melihat rincian KDKMP per hari.
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
