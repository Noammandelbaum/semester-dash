"use client";

import { useEffect, useState } from "react";
import {
  ProfileSection,
  NotificationPreferences,
  DisplayPreferences,
  AccountActions,
} from "@/components/settings";
import { Skeleton } from "@/components/ui/skeleton";

interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  createdAt: string;
}

interface UserPreferences {
  id: string;
  emailNotifications: boolean;
  inAppNotifications: boolean;
  reminderDaysBefore: number[];
  quietHoursStart: number | null;
  quietHoursEnd: number | null;
  theme: string;
  onboardingComplete: boolean;
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [profileRes, preferencesRes] = await Promise.all([
        fetch("/api/users/profile"),
        fetch("/api/users/preferences"),
      ]);

      if (!profileRes.ok || !preferencesRes.ok) {
        throw new Error("שגיאה בטעינת ההגדרות");
      }

      const profileData = await profileRes.json();
      const preferencesData = await preferencesRes.json();

      setProfile(profileData);
      setPreferences(preferencesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה לא צפויה");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">הגדרות</h1>
        <SettingsSkeleton />
      </div>
    );
  }

  if (error || !profile || !preferences) {
    return (
      <div className="max-w-2xl mx-auto p-4 sm:p-6 lg:p-8">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-6">הגדרות</h1>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
          <p className="text-[var(--color-danger)]">
            {error || "שגיאה בטעינת ההגדרות"}
          </p>
          <button
            onClick={fetchData}
            className="mt-4 text-[var(--color-primary)] hover:underline"
          >
            נסה שנית
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">הגדרות</h1>

      <ProfileSection profile={profile} onProfileUpdated={fetchData} />

      <NotificationPreferences
        preferences={preferences}
        onPreferencesUpdated={fetchData}
      />

      <DisplayPreferences
        preferences={preferences}
        onPreferencesUpdated={fetchData}
      />

      <AccountActions />
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Profile Skeleton */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
        <Skeleton className="h-6 w-20 mb-4" />
        <div className="flex items-start gap-4">
          <Skeleton className="w-16 h-16 rounded-full" />
          <div className="flex-1 space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-5 w-32" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-5 w-48" />
            </div>
          </div>
        </div>
      </div>

      {/* Notifications Skeleton */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
        <Skeleton className="h-6 w-20 mb-4" />
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-6 w-10 rounded" />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-4 w-44" />
            </div>
            <Skeleton className="h-6 w-10 rounded" />
          </div>
        </div>
      </div>

      {/* Display Skeleton */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
        <Skeleton className="h-6 w-16 mb-4" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-64" />
        </div>
      </div>

      {/* Account Skeleton */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
        <Skeleton className="h-6 w-16 mb-4" />
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3">
            <div className="space-y-1">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-4 w-36" />
            </div>
            <Skeleton className="h-10 w-20" />
          </div>
          <div className="flex items-center justify-between py-3">
            <div className="space-y-1">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
      </div>
    </div>
  );
}
