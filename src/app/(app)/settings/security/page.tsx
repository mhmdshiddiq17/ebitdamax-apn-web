import { SettingsNav } from "@/components/settings/settings-nav";
import { TwoFactorCard } from "@/components/settings/two-factor-card";
import { serverApiFetch } from "@/lib/server-api";
import type { AuthUser } from "@/types/auth";

export const dynamic = "force-dynamic";

export default async function SecuritySettingsPage() {
  const user = await serverApiFetch<AuthUser>("/auth/me");

  return (
    <>
      <div className="space-y-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Pengaturan</h1>
          <p className="text-sm text-muted-foreground">Kelola keamanan akun Anda.</p>
        </div>
        <SettingsNav />
      </div>

      <TwoFactorCard initialEnabled={user.two_factor_enabled} />
    </>
  );
}
