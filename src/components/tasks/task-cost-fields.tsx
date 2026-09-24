"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatRupiah } from "@/lib/formatters";
import type { CostBreakdown } from "@/types/task";

const COMPONENTS: Array<{ key: keyof CostBreakdown; label: string }> = [
  { key: "man", label: "Man" },
  { key: "machine", label: "Machine" },
  { key: "method", label: "Method" },
  { key: "material", label: "Material" },
];

type Props = {
  idPrefix: string;
  title: string;
  value: CostBreakdown;
  onChange: (value: CostBreakdown) => void;
};

export function TaskCostFields({ idPrefix, title, value, onChange }: Props) {
  const total = COMPONENTS.reduce((sum, component) => sum + (value[component.key] || 0), 0);

  return (
    <div className="space-y-2 rounded-lg border border-border p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">
          Total: <span className="font-medium text-foreground tabular-nums">{formatRupiah(total)}</span>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {COMPONENTS.map((component) => {
          const inputId = `${idPrefix}_${component.key}`;

          return (
            <div key={component.key} className="space-y-1">
              <Label htmlFor={inputId} className="text-xs">
                {component.label}
              </Label>
              <Input
                id={inputId}
                type="number"
                min={0}
                step={1000}
                value={String(value[component.key] ?? 0)}
                onChange={(event) =>
                  onChange({
                    ...value,
                    [component.key]: Math.max(0, Number(event.target.value) || 0),
                  })
                }
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
