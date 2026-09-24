export type RegionalScopeLevel = "province" | "regency" | "district";

export type UserRoleRef = {
  id: number;
  name: string;
  slug: string;
  level: string;
  level_label: string;
  domain: string;
};

export type RegionalAssignment = {
  id?: number;
  scope_level: RegionalScopeLevel;
  provinsi: string;
  kota_kabupaten: string | null;
  kecamatan: string | null;
};

export type KdkmpRef = {
  id: number;
  nik: string | null;
  nama_koperasi: string | null;
  provinsi: string | null;
  kota_kabupaten: string | null;
  kecamatan: string | null;
  desa: string | null;
  assigned_manager_user_id: number | null;
};

export type SkDocument = {
  name: string;
  size: number;
  uploaded_at: string;
  preview_url: string;
};

export type UserRow = {
  id: number;
  role_id: number | null;
  sdm_kdkmp_entry_id: number | null;
  name: string;
  username: string | null;
  email: string;
  email_verified_at: string | null;
  has_completed_onboarding: boolean;
  created_at: string;
  updated_at: string;
  role: UserRoleRef | null;
  regional_assignments: RegionalAssignment[];
  kdkmp: KdkmpRef | null;
  manager_sk_document: SkDocument | null;
};

export type RegionOption = {
  provinsi: string;
  kota_kabupaten: string | null;
  kecamatan: string | null;
};
