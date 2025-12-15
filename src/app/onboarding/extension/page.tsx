"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Puzzle,
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
import { SyncSemesterDialog } from "@/components/semesters/SyncSemesterDialog";
import { getMoodleUrlByInstitutionId, getInstitutionById } from "@/lib/institutions";

/**
 * Extension Step (Step 2)
 *
 * Check if extension is installed:
 * - If yes: show "Connect to Moodle" button → opens SyncSemesterDialog
 * - If no: show installation instructions
 *
 * UX: Clear status, easy to install
 */

const CHROME_STORE_URL = "#"; // TODO: Add actual Chrome Web Store URL

export default function ExtensionPage() {
  const router = useRouter();
  const { status: extensionStatus, isInstalled } = useExtensionStatus();
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const [institutionId, setInstitutionId] = useState<string | null>(null);
  const [isLoadingPrefs, setIsLoadingPrefs] = useState(true);

  // Fetch institution from user preferences
  useEffect(() => {
    async function fetchPreferences() {
      try {
        const res = await fetch("/api/users/preferences");
        if (res.ok) {
          const prefs = await res.json();
          setInstitutionId(prefs.institutionId || null);
        }
      } catch (error) {
        console.error("Failed to load preferences:", error);
      } finally {
        setIsLoadingPrefs(false);
      }
    }
    fetchPreferences();
  }, []);

  const institution = institutionId ? getInstitutionById(institutionId) : null;
  const moodleUrl = institutionId ? getMoodleUrlByInstitutionId(institutionId) : null;

  const handleSyncComplete = () => {
    // Sync successful - move to completion
    router.push("/onboarding/complete");
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
      {(extensionStatus === "checking" || isLoadingPrefs) && (
        <div className="text-center py-4">
          <Loader2 className="w-6 h-6 mx-auto text-[var(--color-primary)] animate-spin" />
        </div>
      )}

      {!isInstalled && extensionStatus !== "checking" && !isLoadingPrefs && (
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

      {isInstalled && !isLoadingPrefs && (
        <div className="space-y-4">
          {/* Success state - ready to connect */}
          <div className="bg-[var(--color-success)]/5 rounded-lg p-4 border border-[var(--color-success)]/20">
            <div className="flex items-center gap-2 text-[var(--color-success)] mb-2">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">מעולה! התוסף מותקן</span>
            </div>
            <p className="text-sm text-[var(--color-text-secondary)]">
              {institution
                ? `עכשיו נוכל לסנכרן את הקורסים שלך מ-${institution.name}`
                : "עכשיו נוכל לסנכרן את הקורסים שלך מ-Moodle"}
            </p>
          </div>

          {/* Connect to Moodle Button */}
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={() => setSyncDialogOpen(true)}
            disabled={!moodleUrl}
          >
            התחבר ל-Moodle וסנכרן קורסים
          </Button>

          {!moodleUrl && (
            <p className="text-sm text-[var(--color-warning)] text-center">
              לא נמצאה כתובת Moodle למוסד שנבחר
            </p>
          )}

          {/* Sync Dialog */}
          <SyncSemesterDialog
            open={syncDialogOpen}
            onOpenChange={setSyncDialogOpen}
            onSyncComplete={handleSyncComplete}
            moodleUrl={moodleUrl || undefined}
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 mt-6">
        <Button
          variant="ghost"
          onClick={handleBack}
          className="flex-1"
        >
          <ArrowRight className="w-4 h-4 ml-2" />
          חזרה
        </Button>
        <Button
          variant="ghost"
          onClick={handleSkip}
          className="flex-1 text-[var(--color-text-muted)]"
        >
          דלג לעת עתה
        </Button>
      </div>
    </OnboardingCard>
  );
}
