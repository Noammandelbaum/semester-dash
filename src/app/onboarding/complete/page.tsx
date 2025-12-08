"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PartyPopper, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OnboardingCard } from "@/components/onboarding";

/**
 * Complete Step (Step 3)
 *
 * Celebration screen:
 * - Congratulate user
 * - Mark onboarding as complete
 * - Auto-redirect to dashboard after 3 seconds
 * - Manual button to go immediately
 *
 * UX: "Magic moment" - user sees their dashboard is ready
 */

export default function CompletePage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(3);
  const [isMarking, setIsMarking] = useState(true);

  // Mark onboarding as complete on mount
  useEffect(() => {
    const markComplete = async () => {
      try {
        await fetch("/api/users/onboarding-complete", {
          method: "POST",
        });
      } catch (err) {
        console.error("Failed to mark onboarding complete:", err);
      } finally {
        setIsMarking(false);
      }
    };

    markComplete();
  }, []);

  // Countdown and redirect
  useEffect(() => {
    if (isMarking) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push("/dashboard");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isMarking, router]);

  const handleGoToDashboard = () => {
    router.push("/dashboard");
  };

  return (
    <OnboardingCard currentStep={3}>
      {/* Celebration Icon */}
      <div className="flex justify-center mb-6">
        <div className="w-24 h-24 rounded-full bg-[var(--color-success)]/10 flex items-center justify-center animate-bounce">
          <PartyPopper className="w-12 h-12 text-[var(--color-success)]" />
        </div>
      </div>

      {/* Title */}
      <h1 className="text-2xl sm:text-3xl font-bold text-center text-[var(--color-text-primary)] mb-3">
        הדשבורד שלך מוכן!
      </h1>

      {/* Subtitle */}
      <p className="text-lg text-center text-[var(--color-text-secondary)] mb-8">
        עכשיו אתה יכול לראות את כל הסמסטר במבט אחד
      </p>

      {/* CTA */}
      <Button
        variant="primary"
        size="lg"
        className="w-full min-h-[48px]"
        onClick={handleGoToDashboard}
      >
        <span>לדשבורד</span>
        <ArrowLeft className="w-5 h-5 mr-2" />
      </Button>

      {/* Countdown */}
      <p className="text-center text-sm text-[var(--color-text-muted)] mt-4">
        {isMarking ? (
          "שומר את ההגדרות..."
        ) : countdown > 0 ? (
          <>מעביר לדשבורד בעוד {countdown} שניות...</>
        ) : (
          "מעביר לדשבורד..."
        )}
      </p>
    </OnboardingCard>
  );
}
