import { AppearanceForm } from "@/components/settings/appearance-form";
import { SettingsNav } from "@/components/settings/settings-nav";

export default function AppearanceSettingsPage() {
  return (
    <>
      <div className="space-y-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Pengaturan</h1>
          <p className="text-sm text-muted-foreground">Sesuaikan tampilan aplikasi.</p>
        </div>
        <SettingsNav />
      </div>

      <AppearanceForm />
    </>
  );
}
