import { TwoFactorChallengeForm } from "@/components/two-factor-challenge-form";

export default function TwoFactorChallengePage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-4">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-lg font-bold text-primary-foreground">
          E
        </div>
        <div>
          <p className="font-heading text-lg font-semibold leading-tight">EBITDA Max</p>
          <p className="text-sm text-muted-foreground">Agrinas Pangan Nusantara</p>
        </div>
      </div>
      <TwoFactorChallengeForm />
    </div>
  );
}
