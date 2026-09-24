"use client";

import { ArrowLeft, ArrowRight, Check, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import type { AuthUser } from "@/types/auth";

type TourStep = {
  target: string;
  title: string;
  description: string;
  path: string;
};

type TargetRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

const TOUR_STEPS: TourStep[] = [
  {
    target: '[data-tour="sidebar-navigation"]',
    title: "Navigasi aplikasi",
    description: "Gunakan menu untuk membuka Dashboard, Tugas Harian, Meeting, LMS, dan fitur lainnya.",
    path: "/dashboard",
  },
  {
    target: '[data-tour="page-content"]',
    title: "Area kerja",
    description: "Konten halaman aktif tampil di sini. Ringkasan akun dan informasi penting ditampilkan ringkas.",
    path: "/dashboard",
  },
  {
    target: '[data-tour="user-menu"]',
    title: "Menu akun",
    description: "Atur profil, keamanan akun (2FA), atau keluar dari aplikasi dari menu ini.",
    path: "/dashboard",
  },
];

const POPOVER_WIDTH = 320;
const POPOVER_HEIGHT = 220;
const STEP_STORAGE_KEY = "ebitda-manager-onboarding-step";

function getTargetRect(target: HTMLElement): TargetRect {
  const rect = target.getBoundingClientRect();
  return { top: rect.top, left: rect.left, width: rect.width, height: rect.height };
}

function getPopoverPosition(rect: TargetRect): { top: number; left: number } {
  const gap = 16;
  const top =
    rect.top + rect.height + gap + POPOVER_HEIGHT <= window.innerHeight
      ? rect.top + rect.height + gap
      : Math.max(gap, rect.top - POPOVER_HEIGHT - gap);
  const left = Math.min(Math.max(gap, rect.left), Math.max(gap, window.innerWidth - POPOVER_WIDTH - gap));
  return { top, left };
}

export function OnboardingTour({ user }: { user: AuthUser }) {
  const router = useRouter();
  const pathname = usePathname();

  const isKdkmpManager = user.role?.domain === "kdkmp" && user.role?.slug === "manager";
  const shouldShow = isKdkmpManager && !user.has_completed_onboarding;

  const [isOpen, setIsOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);

  // Diturunkan saat render: tour otomatis tertutup ketika status onboarding selesai.
  const isActive = isOpen && shouldShow;

  const currentStep = TOUR_STEPS[stepIndex];
  const isLastStep = stepIndex === TOUR_STEPS.length - 1;
  const popoverPosition = useMemo(() => (targetRect ? getPopoverPosition(targetRect) : null), [targetRect]);

  const complete = useCallback(() => {
    sessionStorage.removeItem(STEP_STORAGE_KEY);
    setIsOpen(false);

    // Tour tetap ditutup walau API gagal; status dicoba lagi saat halaman dimuat ulang.
    apiFetch("/users/complete-onboarding", { method: "POST" })
      .catch(() => undefined)
      .finally(() => router.refresh());
  }, [router]);

  useEffect(() => {
    if (!shouldShow) {
      return;
    }

    const savedStep = Number.parseInt(sessionStorage.getItem(STEP_STORAGE_KEY) ?? "0", 10);
    const initialStep = savedStep >= 0 && savedStep < TOUR_STEPS.length ? savedStep : 0;

    const timer = window.setTimeout(() => {
      setStepIndex(initialStep);
      setIsOpen(true);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [shouldShow]);

  useEffect(() => {
    if (!isActive || !currentStep) {
      return;
    }

    let frame = 0;
    const target = document.querySelector<HTMLElement>(currentStep.target);

    const updatePosition = () => {
      frame = 0;

      if (!target) {
        setTargetRect(null);
        return;
      }

      const rect = getTargetRect(target);
      setTargetRect(rect.width > 0 && rect.height > 0 ? rect : null);
    };

    const schedule = () => {
      if (frame === 0) {
        frame = window.requestAnimationFrame(updatePosition);
      }
    };

    schedule();
    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", schedule, true);

    return () => {
      if (frame !== 0) {
        window.cancelAnimationFrame(frame);
      }
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule, true);
    };
  }, [currentStep, isActive, pathname]);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        complete();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [complete, isActive]);

  const moveToStep = (nextIndex: number) => {
    const nextStep = TOUR_STEPS[nextIndex];
    if (!nextStep) {
      return;
    }

    sessionStorage.setItem(STEP_STORAGE_KEY, String(nextIndex));
    setStepIndex(nextIndex);

    if (nextStep.path !== pathname) {
      router.push(nextStep.path);
    }
  };

  if (!isActive || !currentStep || !targetRect || !popoverPosition) {
    return null;
  }

  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed z-[60] rounded-md border-2 border-primary transition-all duration-200"
        style={{
          top: targetRect.top - 4,
          left: targetRect.left - 4,
          width: targetRect.width + 8,
          height: targetRect.height + 8,
          boxShadow: "0 0 0 9999px var(--overlay)",
        }}
      />

      <section
        aria-label="Panduan penggunaan aplikasi"
        aria-live="polite"
        className="fixed z-[62] w-[min(320px,calc(100vw-32px))] rounded-xl border border-border bg-card p-5 text-card-foreground shadow-lg"
        style={popoverPosition}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium tracking-wide text-primary uppercase">
              Langkah {stepIndex + 1} dari {TOUR_STEPS.length}
            </p>
            <h2 className="mt-1 text-base font-semibold">{currentStep.title}</h2>
          </div>
          <Button type="button" variant="ghost" size="icon-sm" aria-label="Lewati panduan" onClick={complete}>
            <X />
          </Button>
        </div>

        <p className="mt-3 text-sm leading-6 text-muted-foreground">{currentStep.description}</p>

        <div className="mt-5 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={stepIndex === 0}
            onClick={() => moveToStep(stepIndex - 1)}
          >
            <ArrowLeft />
            Kembali
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => (isLastStep ? complete() : moveToStep(stepIndex + 1))}
          >
            {isLastStep ? <Check /> : <ArrowRight />}
            {isLastStep ? "Selesai" : "Lanjutkan"}
          </Button>
        </div>
      </section>
    </>
  );
}
