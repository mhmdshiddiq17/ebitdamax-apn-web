"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError, apiFetch } from "@/lib/api";

export function TwoFactorChallengeForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    try {
      await apiFetch("/auth/two-factor-challenge", {
        method: "POST",
        body: JSON.stringify({ code }),
      });
      toast.success("Verifikasi berhasil");
      router.replace("/dashboard");
      router.refresh();
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        toast.error(error.message);
        router.replace("/login");
        return;
      }
      toast.error(error instanceof Error ? error.message : "Kode tidak valid");
      setCode("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Verifikasi 2FA</CardTitle>
        <CardDescription>
          Masukkan kode 6 digit dari aplikasi authenticator, atau salah satu recovery code Anda.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Kode verifikasi</Label>
            <Input
              id="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456 atau KODE-RECOVERY"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              autoFocus
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Memverifikasi…" : "Verifikasi"}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Salah menekan tombol?{" "}
            <button
              type="button"
              className="underline underline-offset-4 hover:text-foreground"
              onClick={() => router.replace("/login")}
            >
              Kembali ke halaman masuk
            </button>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
