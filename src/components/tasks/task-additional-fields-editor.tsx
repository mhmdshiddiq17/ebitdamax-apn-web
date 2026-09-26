"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { INPUT_TYPE_OPTIONS, OPTION_BASED_INPUT_TYPES, SHOW_WHEN_OPTIONS } from "@/lib/task-constants";

export type DraftAdditionalField = {
  id?: number;
  label: string;
  input_type: string;
  show_when: string;
  is_required: boolean;
  optionsText: string;
};

export const EMPTY_DRAFT_FIELD: DraftAdditionalField = {
  label: "",
  input_type: "text",
  show_when: "finish",
  is_required: false,
  optionsText: "",
};

type Props = {
  value: DraftAdditionalField[];
  onChange: (value: DraftAdditionalField[]) => void;
};

export function TaskAdditionalFieldsEditor({ value, onChange }: Props) {
  function updateField(index: number, patch: Partial<DraftAdditionalField>) {
    onChange(value.map((field, fieldIndex) => (fieldIndex === index ? { ...field, ...patch } : field)));
  }

  return (
    <div className="space-y-3 rounded-lg border border-border p-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium">Field tambahan</p>
          <p className="text-xs text-muted-foreground">
            Field dinamis yang diisi saat mulai atau menyelesaikan task.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => onChange([...value, { ...EMPTY_DRAFT_FIELD }])}>
          <Plus />
          Tambah Field
        </Button>
      </div>

      {value.length === 0 ? (
        <p className="text-sm text-muted-foreground">Belum ada field tambahan.</p>
      ) : (
        <div className="space-y-3">
          {value.map((field, index) => {
            const usesOptions = OPTION_BASED_INPUT_TYPES.includes(field.input_type);

            return (
              <div key={index} className="space-y-2 rounded-md border border-border/70 p-3">
                <div className="grid gap-2 sm:grid-cols-[1fr_150px_150px_auto_auto]">
                  <div className="space-y-1">
                    <Label htmlFor={`field_label_${index}`} className="text-xs">
                      Label
                    </Label>
                    <Input
                      id={`field_label_${index}`}
                      value={field.label}
                      onChange={(event) => updateField(index, { label: event.target.value })}
                      maxLength={255}
                      placeholder="Contoh: Jumlah Pelanggan"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Tipe input</Label>
                    <Select
                      items={INPUT_TYPE_OPTIONS}
                      value={field.input_type}
                      onValueChange={(selected) => updateField(index, { input_type: selected ?? "text" })}
                    >
                      <SelectTrigger className="w-full" aria-label={`Tipe input baris ${index + 1}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {INPUT_TYPE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Tampil saat</Label>
                    <Select
                      items={SHOW_WHEN_OPTIONS}
                      value={field.show_when}
                      onValueChange={(selected) => updateField(index, { show_when: selected ?? "finish" })}
                    >
                      <SelectTrigger className="w-full" aria-label={`Tampil saat baris ${index + 1}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SHOW_WHEN_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <label className="flex cursor-pointer items-center gap-2 self-end pb-1.5 text-sm">
                    <Checkbox
                      checked={field.is_required}
                      onCheckedChange={(checked) => updateField(index, { is_required: checked === true })}
                      aria-label={`Wajib baris ${index + 1}`}
                    />
                    Wajib
                  </label>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="self-end"
                    aria-label={`Hapus field baris ${index + 1}`}
                    onClick={() => onChange(value.filter((_, fieldIndex) => fieldIndex !== index))}
                  >
                    <Trash2 />
                  </Button>
                </div>

                {usesOptions ? (
                  <div className="space-y-1">
                    <Label htmlFor={`field_options_${index}`} className="text-xs">
                      Opsi (satu per baris)
                    </Label>
                    <Textarea
                      id={`field_options_${index}`}
                      value={field.optionsText}
                      onChange={(event) => updateField(index, { optionsText: event.target.value })}
                      rows={3}
                      placeholder={"Tunai\nQRIS"}
                    />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
