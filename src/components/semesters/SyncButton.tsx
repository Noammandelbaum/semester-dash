"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Check, AlertCircle, Loader2, X, Plus, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useExtensionStatus } from "@/components/onboarding/ExtensionStatus";

type SyncState = "idle" | "loading" | "syncing" | "success" | "error";

interface AssignmentChange {
  id: string;
  title: string;
  action: "created" | "updated";
  changes?: string[];
}

interface SyncResult {
  created: number;
  updated: number;
  unchanged: number;
  changes: AssignmentChange[];
}

interface SyncButtonProps {
  className?: string;
  onSyncComplete?: (result?: SyncResult) => void;
}

const LAST_SYNC_KEY = "semesterhub_last_sync";

/**
 * Format relative time in Hebrew
 */
function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return "עכשיו";
  if (minutes < 60) return `לפני ${minutes} דקות`;
  if (hours < 24) return `לפני ${hours === 1 ? "שעה" : `${hours} שעות`}`;
  if (days === 1) return "אתמול";
  if (days < 7) return `לפני ${days} ימים`;

  return new Date(timestamp).toLocaleDateString("he-IL");
}

/**
 * SyncButton - Continuous sync button for the sidebar
 * Fetches courses from DB and triggers sync via extension
 */
export function SyncButton({ className, onSyncComplete }: SyncButtonProps) {
  const { isInstalled } = useExtensionStatus();
  const [state, setState] = useState<SyncState>("idle");
  const [error, setError] = useState<string>("");
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [syncChanges, setSyncChanges] = useState<AssignmentChange[]>([]);
  const [showChanges, setShowChanges] = useState(false);

  // Load last sync time from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(LAST_SYNC_KEY);
    if (stored) {
      setLastSyncTime(parseInt(stored, 10));
    }
  }, []);

  // Update relative time display periodically
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!lastSyncTime) return;
    const interval = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(interval);
  }, [lastSyncTime]);

  // Save last sync time
  const saveLastSyncTime = useCallback(() => {
    const now = Date.now();
    localStorage.setItem(LAST_SYNC_KEY, now.toString());
    setLastSyncTime(now);
  }, []);

  // Listen for extension events
  useEffect(() => {
    const handleLoginRequired = () => {
      setStatusMessage("ממתין להתחברות ל-Moodle...");
    };

    const handleLoginSuccess = () => {
      setStatusMessage("מתחבר...");
    };

    const handleProgress = (event: CustomEvent) => {
      const { current, total, courseName } = event.detail;
      setStatusMessage(`מסנכרן ${current}/${total}: ${courseName || ""}`);
    };

    const handleSyncComplete = async (event: CustomEvent) => {
      const { success, error: errorMsg, courses, assignments, moodleUrl } = event.detail;

      if (success && (courses || assignments)) {
        // Save synced data to backend
        try {
          setStatusMessage("שומר נתונים...");
          const moodleUrlObj = moodleUrl ? new URL(moodleUrl) : null;
          const universityId = moodleUrlObj?.hostname.split(".")[1] || "unknown";

          const response = await fetch("/api/sync/moodle", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              universityId,
              moodleUrl: moodleUrl || "",
              courses: courses || [],
              assignments: assignments || [],
            }),
          });

          if (!response.ok) {
            throw new Error("שגיאה בשמירת הנתונים");
          }

          const data = await response.json();

          // Build sync result
          const syncResult: SyncResult = {
            created: data.assignments?.created || 0,
            updated: data.assignments?.updated || 0,
            unchanged: data.assignments?.unchanged || 0,
            changes: data.changes || [],
          };

          setState("success");
          setStatusMessage(buildSuccessMessage(syncResult));
          saveLastSyncTime();

          // Show changes if there are any
          if (syncResult.changes.length > 0) {
            setSyncChanges(syncResult.changes);
            setShowChanges(true);

            // Auto-hide changes after 6 seconds
            setTimeout(() => {
              setShowChanges(false);
            }, 6000);
          }

          onSyncComplete?.(syncResult);

          setTimeout(() => {
            setState("idle");
            setStatusMessage("");
          }, 3000);
        } catch (err) {
          setError(err instanceof Error ? err.message : "שגיאה בשמירה");
          setState("error");
          setTimeout(() => setState("idle"), 3000);
        }
      } else if (success) {
        setState("success");
        setStatusMessage("לא נמצאו שינויים");
        saveLastSyncTime();
        onSyncComplete?.();
        setTimeout(() => {
          setState("idle");
          setStatusMessage("");
        }, 2000);
      } else {
        setError(errorMsg || "שגיאה בסנכרון");
        setState("error");
        setStatusMessage("");
        setTimeout(() => setState("idle"), 3000);
      }
    };

    // Build success message from sync result
    const buildSuccessMessage = (result: SyncResult): string => {
      const parts: string[] = [];
      if (result.created > 0) parts.push(`${result.created} חדשות`);
      if (result.updated > 0) parts.push(`${result.updated} עודכנו`);
      if (parts.length === 0) return "לא נמצאו שינויים";
      return parts.join(", ");
    };

    document.addEventListener("semesterhub-moodle-login-required", handleLoginRequired);
    document.addEventListener("semesterhub-moodle-login-success", handleLoginSuccess);
    document.addEventListener("semesterhub-sync-progress", handleProgress as unknown as EventListener);
    document.addEventListener("semesterhub-sync-complete", handleSyncComplete as unknown as EventListener);

    return () => {
      document.removeEventListener("semesterhub-moodle-login-required", handleLoginRequired);
      document.removeEventListener("semesterhub-moodle-login-success", handleLoginSuccess);
      document.removeEventListener("semesterhub-sync-progress", handleProgress as unknown as EventListener);
      document.removeEventListener("semesterhub-sync-complete", handleSyncComplete as unknown as EventListener);
    };
  }, [onSyncComplete, saveLastSyncTime]);

  const handleSync = async () => {
    if (!isInstalled) {
      setError("התוסף לא מותקן");
      setState("error");
      setTimeout(() => setState("idle"), 3000);
      return;
    }

    setState("loading");
    setError("");
    setStatusMessage("טוען קורסים...");

    try {
      // 1. Fetch courses from API
      const response = await fetch("/api/sync/courses");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "שגיאה בטעינת קורסים");
      }

      const { courses, moodleUrl } = data;

      // 2. Send to extension
      setState("syncing");
      setStatusMessage("מתחיל סנכרון...");

      document.dispatchEvent(
        new CustomEvent("semesterhub-webapp-command", {
          detail: {
            action: "syncCoursesWithLogin",
            courses,
            moodleUrl,
          },
        })
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה");
      setState("error");
      setStatusMessage("");
      setTimeout(() => setState("idle"), 3000);
    }
  };

  const renderIcon = () => {
    switch (state) {
      case "loading":
      case "syncing":
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case "success":
        return <Check className="h-4 w-4" />;
      case "error":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <RefreshCw className="h-4 w-4" />;
    }
  };

  const getButtonClass = () => {
    switch (state) {
      case "success":
        return "text-green-600 hover:text-green-700 hover:bg-green-50";
      case "error":
        return "text-red-600 hover:text-red-700 hover:bg-red-50";
      default:
        return "text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/5";
    }
  };

  const getButtonText = () => {
    if (state === "loading") return "טוען...";
    if (state === "syncing") return statusMessage || "מסנכרן...";
    if (state === "success") return statusMessage || "הסנכרון הושלם";
    if (state === "error") return "שגיאה בסנכרון";
    return "סנכרן משימות";
  };

  return (
    <div className={cn("px-4", className)}>
      <Button
        variant="ghost"
        onClick={handleSync}
        disabled={state === "loading" || state === "syncing"}
        className={cn(
          "w-full justify-start gap-2 transition-colors",
          getButtonClass()
        )}
        title={error || "סנכרן משימות מ-Moodle"}
      >
        {renderIcon()}
        <span className="text-sm truncate">{getButtonText()}</span>
      </Button>

      {/* Last sync time */}
      {lastSyncTime && state === "idle" && !showChanges && (
        <p className="text-xs text-[var(--color-text-muted)] mt-1 px-4">
          סנכרון אחרון: {formatRelativeTime(lastSyncTime)}
        </p>
      )}

      {/* Changes list */}
      {showChanges && syncChanges.length > 0 && (
        <div className="mt-2 mx-1 p-2 bg-[var(--color-background)] rounded-lg border border-[var(--color-border)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[var(--color-text-secondary)]">
              שינויים ({syncChanges.length})
            </span>
            <button
              onClick={() => setShowChanges(false)}
              className="p-0.5 hover:bg-[var(--color-border)] rounded transition-colors"
            >
              <X className="h-3 w-3 text-[var(--color-text-muted)]" />
            </button>
          </div>
          <ul className="space-y-1 max-h-32 overflow-y-auto">
            {syncChanges.map((change) => (
              <li
                key={change.id}
                className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]"
              >
                {change.action === "created" ? (
                  <Plus className="h-3 w-3 text-green-600 flex-shrink-0" />
                ) : (
                  <Pencil className="h-3 w-3 text-orange-500 flex-shrink-0" />
                )}
                <span className="truncate" title={change.title}>
                  {change.title}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
