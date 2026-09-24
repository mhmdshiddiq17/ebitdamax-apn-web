/** Opsi enum task (mirror app/Enums backend). */

export const BMC_STATUS_OPTIONS = [
  { value: "belum_dipetakan", label: "Belum Dipetakan" },
  { value: "key_partnerships", label: "Key Partnerships" },
  { value: "key_activities", label: "Key Activities" },
  { value: "key_resources", label: "Key Resources" },
  { value: "value_propositions", label: "Value Propositions" },
  { value: "customer_relationships", label: "Customer Relationships" },
  { value: "channels", label: "Channels" },
  { value: "customer_segments", label: "Customer Segments" },
  { value: "cost_structure", label: "Cost Structure" },
  { value: "revenue_streams", label: "Revenue Streams" },
];

export const PERIOD_OPTIONS = [
  { value: "once", label: "Sekali" },
  { value: "daily", label: "Harian" },
  { value: "weekly", label: "Mingguan" },
  { value: "monthly", label: "Bulanan" },
];

export const INPUT_TYPE_OPTIONS = [
  { value: "text", label: "Text" },
  { value: "textarea", label: "Textarea" },
  { value: "integer", label: "Integer" },
  { value: "decimal", label: "Decimal" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "datetime", label: "Datetime" },
  { value: "time", label: "Time" },
  { value: "boolean", label: "Boolean" },
  { value: "select", label: "Select" },
  { value: "radio", label: "Radio" },
  { value: "checkbox", label: "Checkbox" },
  { value: "file", label: "File Upload" },
];

export const SHOW_WHEN_OPTIONS = [
  { value: "start", label: "Mulai Task" },
  { value: "finish", label: "Selesaikan Task" },
];

export const OPTION_BASED_INPUT_TYPES = ["select", "radio", "checkbox"];

/** Role operasional KDKMP (urutan tampil mengikuti aplikasi lama). */
export const OPERATIONAL_ATTENDANCE_ROLES = [
  { key: "pramuniaga", label: "Pramuniaga" },
  { key: "kasir", label: "Kasir" },
  { key: "karyawan_umkm", label: "Karyawan UMKM" },
  { key: "security", label: "Security" },
  { key: "driver_truck", label: "Driver Truck" },
  { key: "driver_pickup", label: "Driver Pickup" },
  { key: "driver_motor_roda_tiga", label: "Driver Motor Roda Tiga" },
];
