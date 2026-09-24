import { redirect } from "next/navigation";
import { RolesTable } from "@/components/roles/roles-table";
import { ApiError } from "@/lib/api";
import { serverApiFetch } from "@/lib/server-api";
import type { Paginated } from "@/types/api";
import type { Role } from "@/types/role";

export const dynamic = "force-dynamic";

export default async function RolesPage() {
  let initialData: Paginated<Role>;

  try {
    initialData = await serverApiFetch<Paginated<Role>>("/roles?domain=kdkmp&sort=name&direction=asc&page=1");
  } catch (error) {
    if (error instanceof ApiError && error.status === 403) {
      redirect("/dashboard");
    }
    throw error;
  }

  return (
    <>
      <div>
        <h1 className="font-heading text-2xl font-semibold">Role</h1>
        <p className="text-sm text-muted-foreground">Kelola role domain KDKMP beserta level aksesnya.</p>
      </div>

      <RolesTable initialData={initialData} />
    </>
  );
}
