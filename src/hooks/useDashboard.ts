"use client";

import { useState, useEffect, useCallback } from "react";
import type { DashboardStats } from "@/app/api/dashboard/stats/route";

interface UseDashboardResult {
  data: DashboardStats | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook for fetching and caching dashboard statistics
 * Provides loading, error states, and manual refresh capability
 */
export function useDashboard(initialData?: DashboardStats): UseDashboardResult {
  const [data, setData] = useState<DashboardStats | null>(initialData || null);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardStats = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/dashboard/stats");

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("נדרשת התחברות מחדש");
        }
        if (response.status === 429) {
          throw new Error("יותר מדי בקשות. נסה שוב בעוד דקה");
        }
        throw new Error("שגיאה בטעינת נתוני הדשבורד");
      }

      const stats: DashboardStats = await response.json();
      setData(stats);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "שגיאה לא צפויה";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    if (!initialData) {
      fetchDashboardStats();
    }
  }, [initialData, fetchDashboardStats]);

  // Refetch on window focus (for keeping data fresh)
  useEffect(() => {
    const handleFocus = () => {
      // Only refetch if we have data (don't refetch on initial load)
      if (data) {
        fetchDashboardStats();
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [data, fetchDashboardStats]);

  return {
    data,
    isLoading,
    error,
    refresh: fetchDashboardStats,
  };
}
