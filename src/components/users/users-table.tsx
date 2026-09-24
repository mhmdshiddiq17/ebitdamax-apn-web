"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Eye, Pencil, Plus, Search, Trash2, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserFormDialog } from "@/components/users/user-form-dialog";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Paginated } from "@/types/api";
import type { KdkmpRef, RegionOption, RegionalAssignment, UserRoleRef, UserRow } from "@/types/user";

const dateFormatter = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" });
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

function assignmentLabel(assignment: RegionalAssignment): string {
  switch (assignment.scope_level) {
    case "province":
      return `Provinsi ${assignment.provinsi}`;
    case "regency":
      return `Kab/Kota ${assignment.kota_kabupaten ?? "-"}, ${assignment.provinsi}`;
    default:
      return `Kec. ${assignment.kecamatan ?? "-"}, ${assignment.kota_kabupaten ?? "-"}`;
  }
}

type Props = {
  initialData: Paginated<UserRow>;
  roles: UserRoleRef[];
  kdkmpOptions: KdkmpRef[];
  regionOptions: RegionOption[];
  currentUserId: number;
};

export function UsersTable({ initialData, roles, kdkmpOptions, regionOptions, currentUserId }: Props) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserRow | null>(null);
  const [uploadTarget, setUploadTarget] = useState<UserRow | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const trimmed = searchInput.trim();
      setSearch((previous) => {
        if (previous === trimmed) {
          return previous;
        }
        setPage(1);
        return trimmed;
      });
    }, 350);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const isDefaultQuery = search === "" && roleFilter === "all" && page === 1;

  const { data, isFetching } = useQuery({
    queryKey: ["users", { search, roleFilter, page }],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page) });
      if (search !== "") params.set("search", search);
      if (roleFilter !== "all") params.set("role_id", roleFilter);
      return apiFetch<Paginated<UserRow>>(`/users?${params.toString()}`);
    },
    initialData: isDefaultQuery ? initialData : undefined,
    placeholderData: (previous) => previous,
  });

  const users = data?.data ?? [];
  const meta = data?.meta;

  const deleteMutation = useMutation({
    mutationFn: (user: UserRow) => apiFetch(`/users/${user.id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("User berhasil dihapus.");
      setDeletingUser(null);
      void queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Gagal menghapus user");
      setDeletingUser(null);
    },
  });

  function refresh() {
    void queryClient.invalidateQueries({ queryKey: ["users"] });
  }

  function triggerUpload(user: UserRow) {
    setUploadTarget(user);
    fileInputRef.current?.click();
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    const target = uploadTarget;
    setUploadTarget(null);

    if (!file || !target) {
      return;
    }

    const formData = new FormData();
    formData.append("manager_sk_document", file);

    try {
      await apiFetch(`/users/${target.id}/manager-sk-document`, { method: "POST", body: formData });
      toast.success("Dokumen SK Manager berhasil diunggah.");
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal mengunggah dokumen SK");
    }
  }

  const roleFilterItems = [
    { value: "all", label: "Semua role" },
    ...roles.map((role) => ({ value: String(role.id), label: role.name })),
  ];

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Cari nama, username, atau email…"
            className="w-72 pl-8"
            aria-label="Cari user"
          />
        </div>

        <Select
          items={roleFilterItems}
          value={roleFilter}
          onValueChange={(value) => {
            setRoleFilter(value ?? "all");
            setPage(1);
          }}
        >
          <SelectTrigger className="w-48" aria-label="Filter role">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {roleFilterItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          className="ml-auto"
          onClick={() => {
            setEditingUser(null);
            setFormOpen(true);
          }}
        >
          <Plus />
          Tambah User
        </Button>
      </div>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>KDKMP / Cakupan</TableHead>
              <TableHead>SK Manager</TableHead>
              <TableHead>Dibuat</TableHead>
              <TableHead className="w-28 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  {isFetching ? "Memuat…" : "Belum ada user yang cocok."}
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="font-medium">{user.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {user.username ?? "-"} · {user.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{user.role?.name ?? "Tanpa role"}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {user.kdkmp ? (
                      <span>{user.kdkmp.nama_koperasi ?? `KDKMP #${user.kdkmp.id}`}</span>
                    ) : user.regional_assignments.length > 0 ? (
                      <div className="space-y-0.5">
                        {user.regional_assignments.slice(0, 2).map((assignment, index) => (
                          <div key={index}>{assignmentLabel(assignment)}</div>
                        ))}
                        {user.regional_assignments.length > 2 ? (
                          <div>+{user.regional_assignments.length - 2} cakupan lain</div>
                        ) : null}
                      </div>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    {user.manager_sk_document ? (
                      <div className="flex items-center gap-1">
                        <a
                          href={`${API_BASE}${user.manager_sk_document.preview_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                        >
                          <Eye />
                          Lihat
                        </a>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Ganti SK ${user.name}`}
                          onClick={() => triggerUpload(user)}
                        >
                          <Upload />
                        </Button>
                      </div>
                    ) : user.role?.slug === "manager" ? (
                      <Button variant="outline" size="sm" onClick={() => triggerUpload(user)}>
                        <Upload />
                        Unggah
                      </Button>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {dateFormatter.format(new Date(user.created_at))}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Edit ${user.name}`}
                        onClick={() => {
                          setEditingUser(user);
                          setFormOpen(true);
                        }}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Hapus ${user.name}`}
                        disabled={user.id === currentUserId}
                        onClick={() => setDeletingUser(user)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {meta && meta.total_pages > 1 ? (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Halaman {meta.page} dari {meta.total_pages} · {meta.total} user
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || isFetching}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              <ChevronLeft />
              Sebelumnya
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= meta.total_pages || isFetching}
              onClick={() => setPage((current) => current + 1)}
            >
              Berikutnya
              <ChevronRight />
            </Button>
          </div>
        </div>
      ) : null}

      {formOpen ? (
        <UserFormDialog
          key={editingUser?.id ?? "new"}
          open={formOpen}
          onOpenChange={setFormOpen}
          user={editingUser}
          roles={roles}
          kdkmpOptions={kdkmpOptions}
          regionOptions={regionOptions}
          onSaved={refresh}
        />
      ) : null}

      <AlertDialog open={deletingUser !== null} onOpenChange={(open) => (!open ? setDeletingUser(null) : undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus user?</AlertDialogTitle>
            <AlertDialogDescription>
              Akun &quot;{deletingUser?.name}&quot; akan dihapus permanen beserta laporan tugasnya.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => (deletingUser ? deleteMutation.mutate(deletingUser) : undefined)}
            >
              {deleteMutation.isPending ? "Menghapus…" : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
