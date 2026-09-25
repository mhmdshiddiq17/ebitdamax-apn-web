"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api";
import type { AuthUser } from "@/types/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

function formatFileSize(size: number) {
  return size < 1024 * 1024 ? `${Math.ceil(size / 1024)} KB` : `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function ProfileForm({ user }: { user: AuthUser }) {
  const router = useRouter();
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [submitting, setSubmitting] = useState(false);

  const unchanged = name === user.name && email === user.email;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    try {
      await apiFetch<AuthUser>("/profile", {
        method: "PATCH",
        body: JSON.stringify({ name, email }),
      });
      toast.success("Profil diperbarui");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal memperbarui profil");
    } finally {
      setSubmitting(false);
    }
  }

  const isKdkmpManager = user.role?.domain === "kdkmp" && user.role.slug === "manager";

  return (
    <div className="space-y-4">
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="text-base">Profil</CardTitle>
          <CardDescription>Nama dan email yang dipakai untuk masuk.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama</Label>
              <Input
                id="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={255}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={submitting || unchanged}>
              {submitting ? "Menyimpan…" : "Simpan"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {isKdkmpManager ? <ManagerSKCard document={user.manager_sk_document} /> : null}
    </div>
  );
}

function ManagerSKCard({ document }: { document: AuthUser["manager_sk_document"] }) {
  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle className="text-base">SK Manager</CardTitle>
        <CardDescription>Dokumen penugasan Manager KDKMP yang diunggah administrator.</CardDescription>
      </CardHeader>
      <CardContent>
        {document ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0 text-sm">
              <p className="truncate font-medium">{document.name}</p>
              <p className="text-muted-foreground">{formatFileSize(document.size)} · Diunggah {new Date(document.uploaded_at).toLocaleDateString("id-ID", { dateStyle: "medium" })}</p>
            </div>
            <Button render={<a href={`${API_BASE}${document.preview_url}`} target="_blank" rel="noreferrer" />} variant="outline" size="sm">
              Lihat SK
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Belum ada dokumen SK yang diunggah. Hubungi administrator untuk menambahkannya.</p>
        )}
      </CardContent>
    </Card>
  );
}
