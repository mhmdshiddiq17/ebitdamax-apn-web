"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useMounted } from "@/hooks/use-mounted";
import { cn } from "@/lib/utils";

const options = [
  { value: "light", title: "Terang", icon: Sun },
  { value: "dark", title: "Gelap", icon: Moon },
  { value: "system", title: "Sistem", icon: Monitor },
];

export function AppearanceForm() {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle className="text-base">Tampilan</CardTitle>
        <CardDescription>Pilih tema antarmuka. Pilihan tersimpan di perangkat ini.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Pilihan tema">
          {options.map((option) => {
            const active = mounted && theme === option.value;

            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={active}
                onClick={() => setTheme(option.value)}
                className={cn(buttonVariants({ variant: active ? "default" : "outline", size: "sm" }))}
              >
                <option.icon />
                {option.title}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
