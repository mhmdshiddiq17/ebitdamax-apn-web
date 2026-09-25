import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AppHeader } from "@/components/app-header";
import { AppSidebar } from "@/components/app-sidebar";
import { OnboardingTour } from "@/components/onboarding-tour";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { serverApiFetch, UnauthorizedError } from "@/lib/server-api";
import type { AuthUser } from "@/types/auth";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: ReactNode }) {
  let user: AuthUser;

  try {
    user = await serverApiFetch<AuthUser>("/auth/me");
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      redirect("/login");
    }
    throw error;
  }

  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <SidebarInset className="min-w-0 overflow-x-hidden">
        <AppHeader user={user} />
        <div className="flex min-w-0 flex-1 flex-col gap-6 overflow-x-hidden p-4 sm:p-6" data-tour="page-content">
          {children}
        </div>
      </SidebarInset>
      <OnboardingTour user={user} />
    </SidebarProvider>
  );
}
