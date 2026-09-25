"use client";

import { ArrowLeft, ArrowRight, Check, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
    description: "Gunakan menu untuk membuka Dashboard Gerai, Tugas Harian, Meeting Minutes, dan Action Items.",
    path: "/dashboard/kdkmp",
  },
  {
    target: '[data-tour="kdkmp-metrics"]',
    title: "Ringkasan gerai",
    description: "Pantau revenue, biaya, penyelesaian task, dan ketepatan waktu untuk hari berjalan.",
    path: "/dashboard/kdkmp",
  },
  {
    target: '[data-tour="financial-matrix"]',
    title: "Financial Matrix",
    description: "Bandingkan biaya dan revenue rencana dengan realisasi setiap proses task.",
    path: "/dashboard/kdkmp",
  },
  {
    target: '[data-tour="daily-input"]',
    title: "Input harian",
    description: "Simpan target, kehadiran operasional, dan pilihan task opsional sebelum bekerja.",
    path: "/dashboard/kdkmp/input",
  },
  {
    target: '[data-tour="task-list"]',
    title: "Tugas Harian",
    description: "Mulai dan selesaikan task aktif beserta bukti, field laporan, dan alokasi anggota.",
    path: "/dashboard/tasks",
  },
  {
    target: '[data-tour="meeting-minutes"]',
    title: "Meeting Minutes",
    description: "Catat rapat, lampiran, PIC, tenggat, serta tindak lanjut untuk gerai Anda.",
    path: "/meeting-minutes",
  },
];

const POPOVER_WIDTH = 320;
const POPOVER_HEIGHT = 220;
const TOUR_VERSION = 2;
const STEP_STORAGE_KEY = `ebitda-manager-onboarding-step-v${TOUR_VERSION}`;
const UPDATE_STORAGE_KEY = "ebitda-manager-onboarding-version";

type TourMode = "onboarding" | "update";

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
  const popoverRef = useRef<HTMLElement>(null);

  const isKdkmpManager = user.role?.domain === "kdkmp" && user.role?.slug === "manager";

  const [isOpen, setIsOpen] = useState(false);
  const [showUpdateTour, setShowUpdateTour] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);

  const tourMode: TourMode | null = !isKdkmpManager
    ? null
    : !user.has_completed_onboarding
      ? "onboarding"
      : showUpdateTour
        ? "update"
        : null;

  const isActive = isOpen && tourMode !== null;

  const currentStep = TOUR_STEPS[stepIndex];
  const isLastStep = stepIndex === TOUR_STEPS.length - 1;
  const popoverPosition = useMemo(() => (targetRect ? getPopoverPosition(targetRect) : null), [targetRect]);

  const complete = useCallback(() => {
    sessionStorage.removeItem(STEP_STORAGE_KEY);
    localStorage.setItem(UPDATE_STORAGE_KEY, String(TOUR_VERSION));
    setIsOpen(false);

    if (tourMode === "onboarding") {
      // Tour tetap ditutup walau API gagal; status dicoba lagi saat halaman dimuat ulang.
      apiFetch("/users/complete-onboarding", { method: "POST" })
        .catch(() => undefined)
        .finally(() => router.refresh());
    }
  }, [router, tourMode]);

  useEffect(() => {
    if (!isKdkmpManager || !user.has_completed_onboarding) return;

    const timer = window.setTimeout(() => {
      setShowUpdateTour(Number(localStorage.getItem(UPDATE_STORAGE_KEY) ?? "0") < TOUR_VERSION);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [isKdkmpManager, user.has_completed_onboarding]);

  useEffect(() => {
    if (!tourMode) return;

    const savedStep = Number.parseInt(sessionStorage.getItem(STEP_STORAGE_KEY) ?? "0", 10);
    const initialStep = savedStep >= 0 && savedStep < TOUR_STEPS.length ? savedStep : 0;

    const timer = window.setTimeout(() => {
      setStepIndex(initialStep);
      setIsOpen(true);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [tourMode]);

  useEffect(() => {
    if (isActive && currentStep && currentStep.path !== pathname) {
      router.replace(currentStep.path);
    }
  }, [currentStep, isActive, pathname, router]);

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

  useEffect(() => {
    if (!isActive || !targetRect || !popoverPosition) return;

    const frame = window.requestAnimationFrame(() => popoverRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [isActive, popoverPosition, stepIndex, targetRect]);

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
        ref={popoverRef}
        role="dialog"
        aria-labelledby="onboarding-tour-title"
        aria-describedby="onboarding-tour-description"
        aria-label="Panduan penggunaan aplikasi"
        aria-live="polite"
        tabIndex={-1}
        className="fixed z-[62] w-[min(320px,calc(100vw-32px))] rounded-xl border border-border bg-card p-5 text-card-foreground shadow-lg"
        style={popoverPosition}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium tracking-wide text-primary uppercase">
              Langkah {stepIndex + 1} dari {TOUR_STEPS.length}
            </p>
            <h2 id="onboarding-tour-title" className="mt-1 text-base font-semibold">{currentStep.title}</h2>
          </div>
          <Button type="button" variant="ghost" size="icon-sm" aria-label="Lewati panduan" onClick={complete}>
            <X />
          </Button>
        </div>

        <p id="onboarding-tour-description" className="mt-3 text-sm leading-6 text-muted-foreground">{currentStep.description}</p>

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
