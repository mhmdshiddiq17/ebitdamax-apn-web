const rupiahFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("id-ID");

const dateFormatter = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" });

/** Format angka menjadi Rupiah tanpa desimal (mis. Rp100.000). */
export function formatRupiah(value: number): string {
  return rupiahFormatter.format(value).replace(/\s/g, "");
}

/** Format angka dengan pemisah ribuan Indonesia. */
export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

/** Format tanggal ISO menjadi tanggal Indonesia (mis. 24 Sep 2026). */
export function formatDate(value: string): string {
  return dateFormatter.format(new Date(value));
}
