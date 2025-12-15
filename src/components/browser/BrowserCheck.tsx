"use client";

import { useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { detectBrowser } from "@/lib/browser-detection";

/**
 * Client-side browser detection component
 *
 * Checks if the user is on an unsupported browser and redirects to /unsupported-browser
 * This is done client-side because:
 * 1. More accurate user-agent detection
 * 2. Avoids Next.js 16 middleware deprecation
 * 3. Simpler implementation
 */
export function BrowserCheck({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  // Calculate browser support status - memoized to prevent recalculation
  const { shouldRender, shouldRedirect } = useMemo(() => {
    // Skip check on allowed pages
    const allowedPaths = ["/unsupported-browser", "/privacy", "/terms"];
    if (allowedPaths.some(path => pathname?.startsWith(path))) {
      return { shouldRender: true, shouldRedirect: false };
    }

    // Check browser - only on client
    if (typeof window === "undefined") {
      return { shouldRender: true, shouldRedirect: false };
    }

    const browserInfo = detectBrowser();
    if (!browserInfo.isSupported) {
      return { shouldRender: false, shouldRedirect: true };
    }

    return { shouldRender: true, shouldRedirect: false };
  }, [pathname]);

  // Handle redirect - using immediate execution instead of effect
  if (shouldRedirect && typeof window !== "undefined") {
    router.replace("/unsupported-browser");
    return null;
  }

  if (!shouldRender) {
    return null;
  }

  return <>{children}</>;
}
