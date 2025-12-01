"use client";

import { useRouter } from "next/navigation";
import { GraduationCap, ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OnboardingCard } from "@/components/onboarding";

/**
 * Welcome Step (Step 1)
 *
 * First onboarding screen:
 * - Greeting + value proposition
 * - Call to action to start
 * - Skip option always visible in header
 *
 * UX: 5 seconds to read, clear value proposition
 */

export default function WelcomePage() {
  const router = useRouter();

  const handleStart = () => {
    router.push("/onboarding/semester");
  };

  return (
    <OnboardingCard currentStep={1}>
      {/* Icon */}
      <div className="flex justify-center mb-6">
        <div className="w-20 h-20 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center">
          <GraduationCap className="w-10 h-10 text-[var(--color-primary)]" />
        </div>
      </div>

      {/* Title */}
      <h1 className="text-2xl sm:text-3xl font-bold text-center text-[var(--color-text-primary)] mb-3">
        ברוך הבא ל-SemesterHub
      </h1>

      {/* Tagline */}
      <p className="text-lg text-center text-[var(--color-primary)] font-medium mb-6">
        הסמסטר שלך, במבט אחד
      </p>

      {/* Value propositions */}
      <div className="space-y-3 mb-8">
        <ValueProp icon={<Sparkles className="w-5 h-5" />}>
          צפה בכל המטלות והדדליינים במקום אחד
        </ValueProp>
        <ValueProp icon={<Sparkles className="w-5 h-5" />}>
          עקוב אחרי ההתקדמות שלך בכל קורס
        </ValueProp>
        <ValueProp icon={<Sparkles className="w-5 h-5" />}>
          קבל תזכורות חכמות לפני ההגשות
        </ValueProp>
      </div>

      {/* CTA */}
      <Button
        variant="primary"
        size="lg"
        className="w-full min-h-[48px]"
        onClick={handleStart}
      >
        <span>בוא נתחיל</span>
        <ArrowLeft className="w-5 h-5 mr-2" />
      </Button>

      {/* Time estimate */}
      <p className="text-center text-sm text-[var(--color-text-muted)] mt-4">
        ההגדרה תיקח פחות מ-2 דקות
      </p>
    </OnboardingCard>
  );
}

function ValueProp({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 text-[var(--color-text-secondary)]">
      <div className="text-[var(--color-primary)]">{icon}</div>
      <span>{children}</span>
    </div>
  );
}
