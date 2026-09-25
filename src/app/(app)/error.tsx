"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function AppError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-64 items-center justify-center">
      <div className="max-w-md space-y-3 text-center">
        <h2 className="text-lg font-semibold">Halaman belum dapat dimuat</h2>
        <p className="text-sm text-muted-foreground">Periksa koneksi Anda, lalu coba lagi.</p>
        <Button onClick={retry}>Coba lagi</Button>
      </div>
    </div>
  );
}
