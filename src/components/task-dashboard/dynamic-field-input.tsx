"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { DashboardAdditionalField } from "@/types/task-dashboard";

export type AdditionalFieldValue = string | string[];

type Props = {
  field: DashboardAdditionalField;
  value: AdditionalFieldValue | undefined;
  onValueChange: (value: AdditionalFieldValue) => void;
  file: File | null;
  onFileChange: (file: File | null) => void;
};

export function DynamicFieldInput({ field, value, onValueChange, file, onFileChange }: Props) {
  const inputId = `field_${field.id}`;
  const stringValue = typeof value === "string" ? value : "";

  switch (field.input_type) {
    case "textarea":
      return (
        <div className="space-y-1">
          <Label htmlFor={inputId}>
            {field.label} {field.is_required ? <span className="text-destructive">*</span> : null}
          </Label>
          <Textarea
            id={inputId}
            value={stringValue}
            onChange={(event) => onValueChange(event.target.value)}
            rows={2}
          />
        </div>
      );

    case "integer":
    case "decimal":
    case "number":
      return (
        <div className="space-y-1">
          <Label htmlFor={inputId}>
            {field.label} {field.is_required ? <span className="text-destructive">*</span> : null}
          </Label>
          <Input
            id={inputId}
            type="number"
            step={field.input_type === "integer" ? 1 : "any"}
            value={stringValue}
            onChange={(event) => onValueChange(event.target.value)}
          />
        </div>
      );

    case "date":
    case "datetime":
    case "time":
      return (
        <div className="space-y-1">
          <Label htmlFor={inputId}>
            {field.label} {field.is_required ? <span className="text-destructive">*</span> : null}
          </Label>
          <Input
            id={inputId}
            type={field.input_type === "datetime" ? "datetime-local" : field.input_type}
            value={stringValue}
            onChange={(event) => onValueChange(event.target.value)}
          />
        </div>
      );

    case "boolean":
      return (
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={value === "1"}
            onCheckedChange={(checked) => onValueChange(checked === true ? "1" : "0")}
            aria-label={field.label}
          />
          {field.label}
        </label>
      );

    case "select":
      return (
        <div className="space-y-1">
          <Label htmlFor={inputId}>
            {field.label} {field.is_required ? <span className="text-destructive">*</span> : null}
          </Label>
          <select
            id={inputId}
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            value={stringValue}
            onChange={(event) => onValueChange(event.target.value)}
          >
            <option value="">Pilih…</option>
            {field.options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      );

    case "radio":
      return (
        <div className="space-y-1">
          <p className="text-sm font-medium">
            {field.label} {field.is_required ? <span className="text-destructive">*</span> : null}
          </p>
          <div className="flex flex-wrap gap-3">
            {field.options.map((option) => (
              <label key={option} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name={inputId}
                  value={option}
                  checked={stringValue === option}
                  onChange={() => onValueChange(option)}
                  className="size-4 accent-primary"
                />
                {option}
              </label>
            ))}
          </div>
        </div>
      );

    case "checkbox": {
      const selected = Array.isArray(value) ? value : [];

      return (
        <div className="space-y-1">
          <p className="text-sm font-medium">
            {field.label} {field.is_required ? <span className="text-destructive">*</span> : null}
          </p>
          <div className="flex flex-wrap gap-3">
            {field.options.map((option) => {
              const checked = selected.includes(option);

              return (
                <label key={option} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(state) =>
                      onValueChange(
                        state === true
                          ? [...selected, option]
                          : selected.filter((item) => item !== option),
                      )
                    }
                    aria-label={option}
                  />
                  {option}
                </label>
              );
            })}
          </div>
        </div>
      );
    }

    case "file":
      return (
        <div className="space-y-1">
          <Label htmlFor={inputId}>
            {field.label} {field.is_required ? <span className="text-destructive">*</span> : null}
          </Label>
          <Input
            id={inputId}
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.jpg,.jpeg,.png"
            onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
          />
          {file ? <p className="text-xs text-muted-foreground">{file.name}</p> : null}
        </div>
      );

    default:
      return (
        <div className="space-y-1">
          <Label htmlFor={inputId}>
            {field.label} {field.is_required ? <span className="text-destructive">*</span> : null}
          </Label>
          <Input
            id={inputId}
            value={stringValue}
            onChange={(event) => onValueChange(event.target.value)}
          />
        </div>
      );
  }
}
