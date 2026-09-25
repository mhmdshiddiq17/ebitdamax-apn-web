"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, UserRound } from "lucide-react";
import { useState } from "react";
import { CustomerAnalysisFormDialog } from "@/components/customer-analysis/customer-analysis-form-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiFetch } from "@/lib/api";
import { formatDate } from "@/lib/formatters";
import type { CustomerAnalysis, CustomerAnalysesResponse } from "@/types/customer-analysis";

export function CustomerAnalysisWorkspace({ initialData }: { initialData: CustomerAnalysesResponse }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<CustomerAnalysis | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [detail, setDetail] = useState<CustomerAnalysis | null>(null);
  const { data, isFetching } = useQuery({ queryKey: ["customer-analyses"], queryFn: () => apiFetch<CustomerAnalysesResponse>("/customer-analyses"), initialData });
  const analyses = data?.data ?? [];
  const options = data?.options ?? initialData.options;

  function openCreate() { setEditing(null); setFormOpen(true); }
  function openEdit(analysis: CustomerAnalysis) { setDetail(null); setEditing(analysis); setFormOpen(true); }

  return (
    <div className="space-y-4" data-tour="customer-analyses">
      <div className="flex flex-wrap items-center gap-2"><p className="text-sm text-muted-foreground">Kumpulkan persona pelanggan dari hasil wawancara di KDKMP Anda.</p><Button className="ml-auto" onClick={openCreate}><Plus /> Tambah narasumber</Button></div>
      {analyses.length === 0 ? <Card className="border-dashed"><CardContent className="flex min-h-56 flex-col items-center justify-center gap-3 text-center"><div className="rounded-full bg-primary/10 p-3 text-primary"><UserRound className="size-7" /></div><div><p className="font-medium">Belum ada narasumber</p><p className="mt-1 text-sm text-muted-foreground">Tambahkan wawancara pertama untuk memahami kebutuhan pelanggan.</p></div><Button variant="outline" onClick={openCreate} disabled={isFetching}><Plus /> Tambah narasumber</Button></CardContent></Card> : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{analyses.map((analysis) => <Card key={analysis.id} className="flex flex-col"><CardHeader><CardTitle>{analysis.full_name}</CardTitle><CardDescription>{analysis.age} tahun · {analysis.gender_label}</CardDescription><CardAction><Button variant="ghost" size="icon-sm" aria-label={`Edit ${analysis.full_name}`} onClick={() => openEdit(analysis)}><Pencil /></Button></CardAction></CardHeader><CardContent className="flex flex-1 flex-col gap-3"><div className="flex flex-wrap gap-2"><Badge variant="outline">{analysis.occupation_label}</Badge><Badge variant={analysis.sentiment <= 2 ? "destructive" : analysis.sentiment >= 4 ? "default" : "secondary"}>{analysis.sentiment_label}</Badge></div><p className="line-clamp-3 text-sm text-muted-foreground">{analysis.summary}</p><div className="mt-auto flex items-center justify-between gap-2 pt-2"><span className="text-xs text-muted-foreground">{formatDate(analysis.created_at)}</span><Button variant="outline" size="sm" onClick={() => setDetail(analysis)}>Lihat detail</Button></div></CardContent></Card>)}</div>}
      {formOpen ? <CustomerAnalysisFormDialog key={editing?.id ?? "new"} analysis={editing} occupations={options.occupations} sentiments={options.sentiments} open={formOpen} onOpenChange={setFormOpen} onSaved={() => void queryClient.invalidateQueries({ queryKey: ["customer-analyses"] })} /> : null}
      <Dialog open={detail !== null} onOpenChange={(open) => !open && setDetail(null)}>{detail ? <DialogContent className="sm:max-w-xl"><DialogHeader><DialogTitle>{detail.full_name}</DialogTitle><DialogDescription>{detail.occupation_label} · {detail.age} tahun · {detail.gender_label}</DialogDescription></DialogHeader><div className="space-y-4 py-2 text-sm"><div><p className="font-medium">Tujuan wawancara</p><p className="mt-1 whitespace-pre-wrap text-muted-foreground">{detail.interview_purpose}</p></div><div><p className="font-medium">Ringkasan</p><p className="mt-1 whitespace-pre-wrap text-muted-foreground">{detail.summary}</p></div><Badge variant={detail.sentiment <= 2 ? "destructive" : detail.sentiment >= 4 ? "default" : "secondary"}>{detail.sentiment_label}</Badge></div></DialogContent> : null}</Dialog>
    </div>
  );
}
