"use client";

import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api";

type Mode = "status" | "enable-password" | "enroll" | "codes" | "regenerate-password" | "disable-password";

type EnableResponse = { secret: string; otpauth_uri: string };
type CodesResponse = { recovery_codes: string[] };

export function TwoFactorCard({ initialEnabled }: { initialEnabled: boolean }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("status");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [secret, setSecret] = useState("");
  const [uri, setUri] = useState("");
  const [codes, setCodes] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setMode("status");
    setPassword("");
    setCode("");
    setSecret("");
    setUri("");
  }

  async function handleEnable(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    try {
      const data = await apiFetch<EnableResponse>("/two-factor/enable", {
        method: "POST",
        body: JSON.stringify({ current_password: password }),
      });
      setSecret(data.secret);
      setUri(data.otpauth_uri);
      setPassword("");
      setMode("enroll");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal memulai aktivasi 2FA");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    try {
      const data = await apiFetch<CodesResponse>("/two-factor/confirm", {
        method: "POST",
        body: JSON.stringify({ code }),
      });
      setCodes(data.recovery_codes);
      setCode("");
      setMode("codes");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Kode tidak valid");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRegenerate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    try {
      const data = await apiFetch<CodesResponse>("/two-factor/recovery-codes", {
        method: "POST",
        body: JSON.stringify({ current_password: password }),
      });
      setCodes(data.recovery_codes);
      setPassword("");
      setMode("codes");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal membuat recovery codes");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDisable(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    try {
      await apiFetch("/two-factor", {
        method: "DELETE",
        body: JSON.stringify({ current_password: password }),
      });
      toast.success("2FA dinonaktifkan");
      reset();
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menonaktifkan 2FA");
    } finally {
      setSubmitting(false);
    }
  }

  async function copyText(value: string, message: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(message);
    } catch {
      toast.error("Gagal menyalin, salin manual dari layar");
    }
  }

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">Autentikasi Dua Faktor (2FA)</CardTitle>
          <Badge variant={initialEnabled ? "default" : "secondary"}>
            {initialEnabled ? "Aktif" : "Nonaktif"}
          </Badge>
        </div>
        <CardDescription>
          Kode TOTP dari aplikasi authenticator (Google Authenticator, Authy, dsb).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {mode === "status" && !initialEnabled ? (
          <Button onClick={() => setMode("enable-password")}>Aktifkan 2FA</Button>
        ) : null}

        {mode === "status" && initialEnabled ? (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setMode("regenerate-password")}>
              Buat ulang recovery codes
            </Button>
            <Button variant="destructive" onClick={() => setMode("disable-password")}>
              Nonaktifkan 2FA
            </Button>
          </div>
        ) : null}

        {(mode === "enable-password" || mode === "regenerate-password" || mode === "disable-password") ? (
          <form
            onSubmit={
              mode === "enable-password" ? handleEnable : mode === "regenerate-password" ? handleRegenerate : handleDisable
            }
            className="space-y-3"
          >
            <div className="space-y-2">
              <Label htmlFor="two_factor_password">Kata sandi saat ini</Label>
              <Input
                id="two_factor_password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="submit"
                variant={mode === "disable-password" ? "destructive" : "default"}
                disabled={submitting}
              >
                {submitting
                  ? "Memproses…"
                  : mode === "enable-password"
                    ? "Lanjutkan"
                    : mode === "regenerate-password"
                      ? "Buat ulang"
                      : "Nonaktifkan"}
              </Button>
              <Button type="button" variant="ghost" onClick={reset} disabled={submitting}>
                Batal
              </Button>
            </div>
          </form>
        ) : null}

        {mode === "enroll" ? (
          <form onSubmit={handleConfirm} className="space-y-4">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Pindai QR berikut dengan aplikasi authenticator, lalu masukkan kode 6 digit yang tampil.
              </p>
              <div className="w-fit rounded-lg bg-white p-3">
                <QRCodeSVG value={uri} size={160} marginSize={0} />
              </div>
              <div className="flex items-center gap-2">
                <code className="rounded-md bg-muted px-2 py-1 font-mono text-xs break-all">{secret}</code>
                <Button type="button" variant="ghost" size="sm" onClick={() => copyText(secret, "Secret disalin")}>
                  Salin
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="two_factor_code">Kode verifikasi</Label>
              <Input
                id="two_factor_code"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="123456"
                maxLength={6}
                value={code}
                onChange={(event) => setCode(event.target.value)}
                required
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Memverifikasi…" : "Konfirmasi & Aktifkan"}
              </Button>
              <Button type="button" variant="ghost" onClick={reset} disabled={submitting}>
                Batal
              </Button>
            </div>
          </form>
        ) : null}

        {mode === "codes" ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Simpan kode ini di tempat aman. Setiap kode hanya bisa dipakai sekali dan tidak akan ditampilkan lagi.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {codes.map((recoveryCode) => (
                <code key={recoveryCode} className="rounded-md bg-muted px-2 py-1 font-mono text-xs">
                  {recoveryCode}
                </code>
              ))}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => copyText(codes.join("\n"), "Recovery codes disalin")}>
                Salin semua
              </Button>
              <Button type="button" onClick={reset}>
                Selesai
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
