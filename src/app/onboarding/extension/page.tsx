"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Puzzle,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  CheckCircle,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  OnboardingCard,
  ExtensionStatus,
  useExtensionStatus,
} from "@/components/onboarding";

/**
 * Extension Step (Step 2)
 *
 * Check if extension is installed:
 * - If yes: show "Connect to Moodle" button
 * - If no: show installation instructions
 *
 * UX: Clear status, easy to install
 */

const CHROME_STORE_URL = "#"; // TODO: Add actual Chrome Web Store URL

export default function ExtensionPage() {
  const router = useRouter();
  const { status: extensionStatus, isInstalled } = useExtensionStatus();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Handle sync completion from extension
  const handleSyncComplete = useCallback(
    (event: Event) => {
      const customEvent = event as CustomEvent<{
        success: boolean;
        coursesCount?: number;
        error?: string;
      }>;

      setIsSyncing(false);

      if (customEvent.detail.success) {
        // Sync successful - move to completion
        router.push("/onboarding/complete");
      } else {
        setSyncError(customEvent.detail.error || "שגיאה בסנכרון");
      }
    },
    [router]
  );

  useEffect(() => {
    // Listen for sync completion from extension
    window.addEventListener("semesterhub-sync-complete", handleSyncComplete);

    return () => {
      window.removeEventListener("semesterhub-sync-complete", handleSyncComplete);
    };
  }, [handleSyncComplete]);

  const handleConnectToMoodle = () => {
    setIsSyncing(true);
    setSyncError(null);

    // Dispatch event to extension to start sync
    window.dispatchEvent(
      new CustomEvent("semesterhub-webapp-command", {
        detail: { action: "openMoodleAndSync" },
      })
    );

    // Timeout fallback - if no response in 30 seconds, show error
    setTimeout(() => {
      if (isSyncing) {
        setIsSyncing(false);
        setSyncError("לא התקבלה תגובה מהתוסף. וודא שהמודל פתוח.");
      }
    }, 30000);
  };

  const handleBack = () => {
    router.push("/onboarding/welcome");
  };

  const handleSkip = () => {
    router.push("/dashboard");
  };

  return (
    <OnboardingCard currentStep={2}>
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center mx-auto mb-4">
          <Puzzle className="w-6 h-6 text-[var(--color-primary)]" />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-[var(--color-text-primary)] mb-2">
          התקן את התוסף
        </h1>
        <p className="text-[var(--color-text-muted)]">
          התוסף מאפשר סנכרון אוטומטי של הקורסים והמטלות שלך מ-Moodle
        </p>
      </div>

      {/* Extension Status */}
      <ExtensionStatus
        showInstallButton={false}
        className="mb-6 border-[var(--color-border)]"
      />

      {/* Content based on status */}
      {extensionStatus === "checking" && (
        <div className="text-center py-4">
          <Loader2 className="w-6 h-6 mx-auto text-[var(--color-primary)] animate-spin" />
        </div>
      )}

      {!isInstalled && extensionStatus !== "checking" && (
        <div className="space-y-4">
          {/* Installation Instructions */}
          <div className="bg-[var(--color-bg-secondary)] rounded-lg p-4 border border-[var(--color-border)]">
            <h3 className="font-medium text-[var(--color-text-primary)] mb-3">
              איך להתקין:
            </h3>
            <ol className="space-y-2 text-sm text-[var(--color-text-secondary)]">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center flex-shrink-0 text-xs font-medium text-[var(--color-primary)]">
                  1
                </span>
                <span>לחץ על כפתור ההתקנה למטה</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center flex-shrink-0 text-xs font-medium text-[var(--color-primary)]">
                  2
                </span>
                <span>לחץ &quot;Add to Chrome&quot; בחנות</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center flex-shrink-0 text-xs font-medium text-[var(--color-primary)]">
                  3
                </span>
                <span>רענן את הדף הזה</span>
              </li>
            </ol>
          </div>

          {/* Install Button */}
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={() => window.open(CHROME_STORE_URL, "_blank")}
          >
            <ExternalLink className="w-5 h-5 ml-2" />
            התקן מחנות Chrome
          </Button>

          {/* Refresh Button */}
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="w-4 h-4 ml-2" />
            רענן דף לבדיקה מחדש
          </Button>
        </div>
      )}

      {isInstalled && (
        <div className="space-y-4">
          {/* Success state - ready to connect */}
          <div className="bg-[var(--color-success)]/5 rounded-lg p-4 border border-[var(--color-success)]/20">
            <div className="flex items-center gap-2 text-[var(--color-success)] mb-2">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">מעולה! התוסף מותקן</span>
            </div>
            <p className="text-sm text-[var(--color-text-secondary)]">
              עכשיו נוכל לסנכרן את הקורסים שלך מ-Moodle
            </p>
          </div>

          {/* Error Message */}
          {syncError && (
            <div className="p-3 rounded-lg bg-[var(--color-danger)]/10 text-[var(--color-danger)] text-sm">
              {syncError}
            </div>
          )}

          {/* Connect to Moodle Button */}
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={handleConnectToMoodle}
            disabled={isSyncing}
            isLoading={isSyncing}
          >
            {isSyncing ? (
              "מסנכרן מ-Moodle..."
            ) : (
              <>
                התחבר ל-Moodle
                <ArrowLeft className="w-5 h-5 mr-2" />
              </>
            )}
          </Button>

          {isSyncing && (
            <p className="text-center text-sm text-[var(--color-text-muted)]">
              יש לפתוח את Moodle ולבחור קורסים לסנכרון
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 mt-6">
        <Button
          variant="ghost"
          onClick={handleBack}
          disabled={isSyncing}
          className="flex-1"
        >
          <ArrowRight className="w-4 h-4 ml-2" />
          חזרה
        </Button>
        <Button
          variant="ghost"
          onClick={handleSkip}
          disabled={isSyncing}
          className="flex-1 text-[var(--color-text-muted)]"
        >
          דלג לעת עתה
        </Button>
      </div>
    </OnboardingCard>
  );
}
