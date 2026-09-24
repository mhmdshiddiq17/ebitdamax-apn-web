import { redirect } from "next/navigation";
import { UsersTable } from "@/components/users/users-table";
import { ApiError } from "@/lib/api";
import { serverApiFetch } from "@/lib/server-api";
import type { Paginated } from "@/types/api";
import type { AuthUser } from "@/types/auth";
import type { KdkmpRef, RegionOption, UserRoleRef, UserRow } from "@/types/user";

export const dynamic = "force-dynamic";

type UsersPageData = {
  initialData: Paginated<UserRow>;
  roles: UserRoleRef[];
  kdkmpOptions: KdkmpRef[];
  regionOptions: RegionOption[];
  currentUserId: number;
};

async function loadUsersPage(): Promise<UsersPageData> {
  const [initialData, rolesResponse, regionResponse, kdkmpResponse, currentUser] = await Promise.all([
    serverApiFetch<Paginated<UserRow>>("/users?page=1"),
    serverApiFetch<Paginated<UserRoleRef>>("/roles?domain=kdkmp&sort=name&direction=asc&page=1"),
    serverApiFetch<{ regions: RegionOption[] | null }>("/region-options"),
    serverApiFetch<{ kdkmp: KdkmpRef[] | null }>("/kdkmp-options"),
    serverApiFetch<AuthUser>("/auth/me"),
  ]);

  return {
    initialData,
    roles: rolesResponse.data,
    kdkmpOptions: kdkmpResponse.kdkmp ?? [],
    regionOptions: regionResponse.regions ?? [],
    currentUserId: currentUser.id,
  };
}

export default async function UsersPage() {
  let pageData: UsersPageData;

  try {
    pageData = await loadUsersPage();
  } catch (error) {
    if (error instanceof ApiError && error.status === 403) {
      redirect("/dashboard");
    }
    throw error;
  }

  return (
    <>
      <div>
        <h1 className="font-heading text-2xl font-semibold">Pengguna</h1>
        <p className="text-sm text-muted-foreground">
          Kelola akun manager dan manager wilayah KDKMP beserta cakupan dan dokumen SK.
        </p>
      </div>

      <UsersTable
        initialData={pageData.initialData}
        roles={pageData.roles}
        kdkmpOptions={pageData.kdkmpOptions}
        regionOptions={pageData.regionOptions}
        currentUserId={pageData.currentUserId}
      />
    </>
  );
}
