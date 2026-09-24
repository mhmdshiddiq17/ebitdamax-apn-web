export type UserRole = {
  id: number;
  name: string;
  slug: string;
  level: "staff" | "manager" | "superadmin";
  domain: "apn" | "kdkmp";
};

export type AuthUser = {
  id: number;
  name: string;
  username: string | null;
  email: string;
  email_verified_at: string | null;
  sdm_kdkmp_entry_id: number | null;
  has_completed_onboarding: boolean;
  two_factor_enabled: boolean;
  role: UserRole | null;
};
