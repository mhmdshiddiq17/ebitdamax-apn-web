"use client";

import { Send } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api";

export function AnnouncementWorkspace() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const result = await apiFetch<{ recipients_count: number }>("/announcements", { method: "POST", body: JSON.stringify({ title, message }) });
      setTitle("");
      setMessage("");
      toast.success(`Pengumuman dikirim kepada ${result.recipients_count} Manager KDKMP.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal mengirim pengumuman");
    } finally {
      setSubmitting(false);
    }
  }

  return <form onSubmit={submit}><Card className="max-w-3xl"><CardHeader><CardTitle>Buat Pengumuman</CardTitle><CardDescription>Pengumuman ini akan dikirim kepada seluruh Manager KDKMP.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="space-y-2"><Label htmlFor="announcement-title">Judul</Label><Input id="announcement-title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={255} required /></div><div className="space-y-2"><Label htmlFor="announcement-message">Pesan</Label><Textarea id="announcement-message" value={message} onChange={(event) => setMessage(event.target.value)} maxLength={5000} rows={7} required /></div><Button type="submit" disabled={submitting}><Send /> {submitting ? "Mengirim…" : "Kirim pengumuman"}</Button></CardContent></Card></form>;
}
