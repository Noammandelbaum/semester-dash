"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, ExternalLink, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useExtensionStatus } from "@/components/onboarding";

/**
 * SyncSemesterDialog
 *
 * Dialog that replaces CreateSemesterDialog for Moodle-only architecture.
 * Instead of manually creating a semester, guides user to sync from Moodle.
 *
 * Flow:
 * 1. Check extension status
 * 2. If installed: prompt to open Moodle and sync
 * 3. If not installed: show install instructions
 *
 * The sync will auto-detect semester from course codes (e.g., "5785.1" → Semester A 2024-25)
 */

interface SyncSemesterDialogProps {
  onSyncComplete?: () => void;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

type SyncState = "idle" | "waiting" | "syncing" | "success" | "error";

const CHROME_STORE_URL = "#"; // TODO: Add actual Chrome Web Store URL

export function SyncSemesterDialog({
  onSyncComplete,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: SyncSemesterDialogProps) {
  // Support both controlled and uncontrolled modes
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const { isInstalled, isChecking } = useExtensionStatus();
  const [syncState, setSyncState] = useState<SyncState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [syncedCourses, setSyncedCourses] = useState<number>(0);

  // Handle open change with state reset
  const handleOpenChange = useCallback((newOpen: boolean) => {
    if (!newOpen) {
      // Reset state when closing
      setSyncState("idle");
      setError(null);
      setSyncedCourses(0);
    }
    if (isControlled) {
      controlledOnOpenChange?.(newOpen);
    } else {
      setInternalOpen(newOpen);
    }
  }, [isControlled, controlledOnOpenChange]);

  // Handle sync completion from extension
  const handleSyncComplete = useCallback(
    (event: Event) => {
      const customEvent = event as CustomEvent<{
        success: boolean;
        coursesCount?: number;
        semesterName?: string;
        error?: string;
      }>;

      if (customEvent.detail.success) {
        setSyncState("success");
        setSyncedCourses(customEvent.detail.coursesCount || 0);
        // Notify parent after a short delay to show success state
        setTimeout(() => {
          handleOpenChange(false);
          onSyncComplete?.();
        }, 1500);
      } else {
        setSyncState("error");
        setError(customEvent.detail.error || "שגיאה בסנכרון");
      }
    },
    [onSyncComplete, handleOpenChange]
  );

  useEffect(() => {
    window.addEventListener("semesterhub-sync-complete", handleSyncComplete);

    return () => {
      window.removeEventListener("semesterhub-sync-complete", handleSyncComplete);
    };
  }, [handleSyncComplete]);

  const handleStartSync = () => {
    setSyncState("waiting");
    setError(null);

    // Dispatch event to extension to start sync flow
    window.dispatchEvent(
      new CustomEvent("semesterhub-webapp-command", {
        detail: { action: "openMoodleAndSync" },
      })
    );

    // Set state to syncing after a short delay (user should have Moodle open)
    setTimeout(() => {
      if (syncState === "waiting") {
        setSyncState("syncing");
      }
    }, 2000);
  };

  const handleRetry = () => {
    setSyncState("idle");
    setError(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-[var(--color-primary)]" />
            סנכרון סמסטר חדש
          </DialogTitle>
          <DialogDescription>
            הקורסים והמטלות יתווספו אוטומטית מ-Moodle
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Checking extension */}
          {isChecking && (
            <div className="flex flex-col items-center gap-3 py-6">
              <Loader2 className="w-8 h-8 text-[var(--color-primary)] animate-spin" />
              <p className="text-[var(--color-text-secondary)]">בודק התקנת התוסף...</p>
            </div>
          )}

          {/* Extension not installed */}
          {!isChecking && !isInstalled && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/20">
                <div className="flex items-center gap-2 text-[var(--color-warning)] mb-2">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">התוסף לא מותקן</span>
                </div>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  כדי לסנכרן קורסים מ-Moodle, יש להתקין את תוסף SemesterHub
                </p>
              </div>

              <Button
                variant="primary"
                className="w-full"
                onClick={() => window.open(CHROME_STORE_URL, "_blank")}
              >
                <ExternalLink className="w-4 h-4 ml-2" />
                התקן תוסף Chrome
              </Button>

              <Button
                variant="ghost"
                className="w-full"
                onClick={() => window.location.reload()}
              >
                רענן דף לבדיקה מחדש
              </Button>
            </div>
          )}

          {/* Extension installed - idle state */}
          {!isChecking && isInstalled && syncState === "idle" && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-[var(--color-success)]/5 border border-[var(--color-success)]/20">
                <div className="flex items-center gap-2 text-[var(--color-success)] mb-2">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">התוסף מותקן</span>
                </div>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  לחץ על הכפתור למטה כדי לפתוח את Moodle ולבחור קורסים לסנכרון
                </p>
              </div>

              <div className="bg-[var(--color-bg-secondary)] rounded-lg p-4 border border-[var(--color-border)]">
                <h4 className="font-medium text-[var(--color-text-primary)] mb-2">
                  איך זה עובד:
                </h4>
                <ol className="space-y-1 text-sm text-[var(--color-text-secondary)]">
                  <li>1. Moodle יפתח בלשונית חדשה</li>
                  <li>2. התחבר אם צריך ובחר קורסים לסנכרון</li>
                  <li>3. הקורסים יתווספו אוטומטית לדשבורד</li>
                </ol>
              </div>

              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={handleStartSync}
              >
                <RefreshCw className="w-5 h-5 ml-2" />
                פתח Moodle וסנכרן
              </Button>
            </div>
          )}

          {/* Waiting/Syncing state */}
          {(syncState === "waiting" || syncState === "syncing") && (
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="relative">
                <Loader2 className="w-12 h-12 text-[var(--color-primary)] animate-spin" />
              </div>
              <div className="text-center">
                <p className="font-medium text-[var(--color-text-primary)]">
                  {syncState === "waiting" ? "פותח את Moodle..." : "מסנכרן קורסים..."}
                </p>
                <p className="text-sm text-[var(--color-text-muted)] mt-1">
                  {syncState === "waiting"
                    ? "בחר קורסים בלשונית החדשה"
                    : "אנא המתן, זה עלול לקחת מספר שניות"}
                </p>
              </div>
            </div>
          )}

          {/* Success state */}
          {syncState === "success" && (
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="w-16 h-16 rounded-full bg-[var(--color-success)]/10 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-[var(--color-success)]" />
              </div>
              <div className="text-center">
                <p className="font-medium text-[var(--color-text-primary)]">
                  הסנכרון הושלם!
                </p>
                <p className="text-sm text-[var(--color-text-muted)] mt-1">
                  {syncedCourses > 0
                    ? `נוספו ${syncedCourses} קורסים`
                    : "הקורסים סונכרנו בהצלחה"}
                </p>
              </div>
            </div>
          )}

          {/* Error state */}
          {syncState === "error" && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20">
                <div className="flex items-center gap-2 text-[var(--color-danger)] mb-2">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">שגיאה בסנכרון</span>
                </div>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  {error || "אירעה שגיאה בעת הסנכרון. אנא נסה שנית."}
                </p>
              </div>

              <Button variant="primary" className="w-full" onClick={handleRetry}>
                נסה שנית
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
