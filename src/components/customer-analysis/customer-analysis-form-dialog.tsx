"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api";
import type { CustomerAnalysis, CustomerAnalysisOption, CustomerAnalysisSentimentOption } from "@/types/customer-analysis";

type Props = {
  analysis: CustomerAnalysis | null;
  occupations: CustomerAnalysisOption[];
  sentiments: CustomerAnalysisSentimentOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
};

export function CustomerAnalysisFormDialog({ analysis, occupations, sentiments, open, onOpenChange, onSaved }: Props) {
  const [fullName, setFullName] = useState(analysis?.full_name ?? "");
  const [occupationRole, setOccupationRole] = useState(analysis?.occupation_role ?? "");
  const [occupationOther, setOccupationOther] = useState(analysis?.occupation_other ?? "");
  const [age, setAge] = useState(analysis ? String(analysis.age) : "");
  const [gender, setGender] = useState(analysis?.gender ?? "");
  const [interviewPurpose, setInterviewPurpose] = useState(analysis?.interview_purpose ?? "");
  const [summary, setSummary] = useState(analysis?.summary ?? "");
  const [sentiment, setSentiment] = useState(String(analysis?.sentiment ?? 3));
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    const payload = {
      full_name: fullName,
      occupation_role: occupationRole,
      occupation_other: occupationOther || null,
      age: Number(age),
      gender,
      interview_purpose: interviewPurpose,
      summary,
      sentiment: Number(sentiment),
    };

    try {
      if (analysis) {
        await apiFetch(`/customer-analyses/${analysis.id}`, { method: "PUT", body: JSON.stringify(payload) });
        toast.success("Customer Analysis diperbarui.");
      } else {
        await apiFetch("/customer-analyses", { method: "POST", body: JSON.stringify(payload) });
        toast.success("Narasumber ditambahkan.");
      }
      onSaved();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan Customer Analysis");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>{analysis ? "Edit Narasumber" : "Tambah Narasumber"}</DialogTitle>
            <DialogDescription>Catat persona dan hasil wawancara pelanggan KDKMP Anda.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2"><Label htmlFor="customer-name">Nama lengkap</Label><Input id="customer-name" value={fullName} onChange={(event) => setFullName(event.target.value)} maxLength={255} required /></div>
            <div className="space-y-2"><Label htmlFor="customer-occupation">Pekerjaan atau peran</Label><Select items={occupations} value={occupationRole || null} onValueChange={(value) => setOccupationRole(value ?? "")}><SelectTrigger id="customer-occupation" className="w-full"><SelectValue placeholder="Pilih pekerjaan" /></SelectTrigger><SelectContent>{occupations.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label htmlFor="customer-age">Umur</Label><Input id="customer-age" type="number" min={1} max={120} value={age} onChange={(event) => setAge(event.target.value)} required /></div>
            {occupationRole === "other" ? <div className="space-y-2 sm:col-span-2"><Label htmlFor="customer-occupation-other">Pekerjaan atau peran lainnya</Label><Input id="customer-occupation-other" value={occupationOther} onChange={(event) => setOccupationOther(event.target.value)} maxLength={255} required /></div> : null}
            <div className="space-y-2"><Label htmlFor="customer-gender">Jenis kelamin</Label><Select items={[{ value: "male", label: "Laki-laki" }, { value: "female", label: "Perempuan" }]} value={gender || null} onValueChange={(value) => setGender(value ?? "")}><SelectTrigger id="customer-gender" className="w-full"><SelectValue placeholder="Pilih jenis kelamin" /></SelectTrigger><SelectContent><SelectItem value="male">Laki-laki</SelectItem><SelectItem value="female">Perempuan</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label htmlFor="customer-sentiment">Sentimen</Label><Select items={sentiments.map((option) => ({ value: String(option.value), label: option.label }))} value={sentiment} onValueChange={(value) => setSentiment(value ?? "3")}><SelectTrigger id="customer-sentiment" className="w-full"><SelectValue /></SelectTrigger><SelectContent>{sentiments.map((option) => <SelectItem key={option.value} value={String(option.value)}>{option.label}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2 sm:col-span-2"><Label htmlFor="customer-purpose">Tujuan wawancara</Label><Textarea id="customer-purpose" value={interviewPurpose} onChange={(event) => setInterviewPurpose(event.target.value)} maxLength={1000} rows={3} required /></div>
            <div className="space-y-2 sm:col-span-2"><Label htmlFor="customer-summary">Ringkasan wawancara</Label><Textarea id="customer-summary" value={summary} onChange={(event) => setSummary(event.target.value)} maxLength={5000} rows={5} required /></div>
          </div>
          <DialogFooter><Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Batal</Button><Button type="submit" disabled={submitting}>{submitting ? "Menyimpan…" : "Simpan"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
