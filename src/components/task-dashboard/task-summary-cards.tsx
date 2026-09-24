import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TaskDashboardResponse } from "@/types/task-dashboard";

type Props = {
  summary: TaskDashboardResponse["summary"];
  businessDate: string;
};

const dateFormatter = new Intl.DateTimeFormat("id-ID", { dateStyle: "full" });

export function TaskSummaryCards({ summary, businessDate }: Props) {
  const metrics = [
    { label: "Total task", value: summary.total },
    { label: "Belum dimulai", value: summary.pending },
    { label: "Sedang dikerjakan", value: summary.in_progress },
    { label: "Selesai", value: summary.completed },
  ];

  return (
    <section aria-label="Ringkasan task" className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Tanggal bisnis: <span className="font-medium text-foreground">{dateFormatter.format(new Date(businessDate))}</span>
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{metric.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tabular-nums">{metric.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
