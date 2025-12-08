"use client";

import { useState, useEffect } from "react";
import { CheckCircle, XCircle, Loader2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * ExtensionStatus
 *
 * Component that checks if the SemesterHub browser extension is installed.
 * Uses window.__SEMESTERHUB_EXTENSION__ injected by the content script.
 *
 * States:
 * - checking: Initial state, checking for extension
 * - installed: Extension detected
 * - not_installed: Extension not found
 */

// Type for the extension marker
declare global {
  interface Window {
    __SEMESTERHUB_EXTENSION__?: {
      version: string;
      ready: boolean;
    };
  }
}

export type ExtensionStatusType = "checking" | "installed" | "not_installed";

interface ExtensionStatusProps {
  onStatusChange?: (status: ExtensionStatusType) => void;
  showInstallButton?: boolean;
  className?: string;
}

const CHROME_STORE_URL = "#"; // TODO: Add actual Chrome Web Store URL when published

export function ExtensionStatus({
  onStatusChange,
  showInstallButton = true,
  className,
}: ExtensionStatusProps) {
  const [status, setStatus] = useState<ExtensionStatusType>("checking");

  useEffect(() => {
    // Check for extension presence
    const checkExtension = () => {
      if (window.__SEMESTERHUB_EXTENSION__?.ready) {
        setStatus("installed");
        onStatusChange?.("installed");
      } else {
        setStatus("not_installed");
        onStatusChange?.("not_installed");
      }
    };

    // Wait a bit for the content script to inject the marker
    const timeout = setTimeout(checkExtension, 500);

    // Also listen for the extension's ready event
    const handleExtensionReady = () => {
      setStatus("installed");
      onStatusChange?.("installed");
    };

    window.addEventListener("semesterhub-extension-ready", handleExtensionReady);

    return () => {
      clearTimeout(timeout);
      window.removeEventListener("semesterhub-extension-ready", handleExtensionReady);
    };
  }, [onStatusChange]);

  return (
    <div className={cn("rounded-lg border p-4", className)}>
      {status === "checking" && (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-[var(--color-primary)] animate-spin" />
          </div>
          <div>
            <p className="font-medium text-[var(--color-text-primary)]">
              בודק התקנת התוסף...
            </p>
            <p className="text-sm text-[var(--color-text-muted)]">
              רגע אחד
            </p>
          </div>
        </div>
      )}

      {status === "installed" && (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[var(--color-success)]/10 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-[var(--color-success)]" />
          </div>
          <div>
            <p className="font-medium text-[var(--color-text-primary)]">
              התוסף מותקן
            </p>
            <p className="text-sm text-[var(--color-text-muted)]">
              {window.__SEMESTERHUB_EXTENSION__?.version && (
                <>גרסה {window.__SEMESTERHUB_EXTENSION__.version}</>
              )}
            </p>
          </div>
        </div>
      )}

      {status === "not_installed" && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--color-warning)]/10 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-[var(--color-warning)]" />
            </div>
            <div>
              <p className="font-medium text-[var(--color-text-primary)]">
                התוסף לא מותקן
              </p>
              <p className="text-sm text-[var(--color-text-muted)]">
                התקן את התוסף כדי לסנכרן מ-Moodle
              </p>
            </div>
          </div>

          {showInstallButton && (
            <Button
              variant="primary"
              size="sm"
              className="w-full"
              onClick={() => window.open(CHROME_STORE_URL, "_blank")}
            >
              <ExternalLink className="w-4 h-4 ml-2" />
              התקן תוסף Chrome
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Hook to check extension status
 */
export function useExtensionStatus(): {
  status: ExtensionStatusType;
  isInstalled: boolean;
  isChecking: boolean;
} {
  const [status, setStatus] = useState<ExtensionStatusType>("checking");

  useEffect(() => {
    const checkExtension = () => {
      if (window.__SEMESTERHUB_EXTENSION__?.ready) {
        setStatus("installed");
      } else {
        setStatus("not_installed");
      }
    };

    const timeout = setTimeout(checkExtension, 500);

    const handleExtensionReady = () => {
      setStatus("installed");
    };

    window.addEventListener("semesterhub-extension-ready", handleExtensionReady);

    return () => {
      clearTimeout(timeout);
      window.removeEventListener("semesterhub-extension-ready", handleExtensionReady);
    };
  }, []);

  return {
    status,
    isInstalled: status === "installed",
    isChecking: status === "checking",
  };
}
