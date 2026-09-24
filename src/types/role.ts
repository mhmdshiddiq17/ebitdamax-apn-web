export type RoleLevel = "staff" | "manager" | "superadmin";
export type RoleDomain = "apn" | "kdkmp";

export type Role = {
  id: number;
  uuid: string;
  domain: RoleDomain;
  name: string;
  slug: string;
  level: RoleLevel;
  level_label: string;
  users_count: number;
  created_at: string;
  updated_at: string;
};
