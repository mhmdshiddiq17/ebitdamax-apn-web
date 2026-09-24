import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { serverApiFetch } from "@/lib/server-api";
import type { AuthUser } from "@/types/auth";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await serverApiFetch<AuthUser>("/auth/me");

  return (
    <>
      <div>
        <h1 className="font-heading text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Selamat datang, {user.name}.</p>
      </div>

      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="text-base">Akun Anda</CardTitle>
          <CardDescription>Informasi sesi saat ini.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Nama</span>
            <span className="font-medium">{user.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Email</span>
            <span className="font-medium">{user.email}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Role</span>
            <Badge>{user.role?.name ?? "Tanpa role"}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Domain</span>
            <span className="font-medium uppercase">{user.role?.domain ?? "-"}</span>
          </div>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        Dashboard KDKMP dan fitur manager akan dibangun pada sprint berikutnya.
      </p>
    </>
  );
}
