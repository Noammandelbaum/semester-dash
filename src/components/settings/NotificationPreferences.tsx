"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface UserPreferences {
  id: string;
  emailNotifications: boolean;
  inAppNotifications: boolean;
  reminderDaysBefore: number[];
  quietHoursStart: number | null;
  quietHoursEnd: number | null;
}

interface NotificationPreferencesProps {
  preferences: UserPreferences;
  onPreferencesUpdated?: () => void;
}

const REMINDER_OPTIONS = [
  { value: 0, label: "ביום ההגשה" },
  { value: 1, label: "יום לפני" },
  { value: 3, label: "3 ימים לפני" },
  { value: 7, label: "שבוע לפני" },
];

export function NotificationPreferences({
  preferences,
  onPreferencesUpdated,
}: NotificationPreferencesProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localPrefs, setLocalPrefs] = useState({
    inAppNotifications: preferences.inAppNotifications,
    emailNotifications: preferences.emailNotifications,
    reminderDaysBefore: preferences.reminderDaysBefore,
  });

  const handleToggle = async (
    field: "inAppNotifications" | "emailNotifications",
    value: boolean
  ) => {
    const newPrefs = { ...localPrefs, [field]: value };
    setLocalPrefs(newPrefs);
    await savePreferences({ [field]: value });
  };

  const handleReminderToggle = async (days: number, checked: boolean) => {
    let newReminders: number[];
    if (checked) {
      newReminders = [...localPrefs.reminderDaysBefore, days].sort(
        (a, b) => a - b
      );
    } else {
      newReminders = localPrefs.reminderDaysBefore.filter((d) => d !== days);
    }

    setLocalPrefs({ ...localPrefs, reminderDaysBefore: newReminders });
    await savePreferences({ reminderDaysBefore: newReminders });
  };

  const savePreferences = async (data: Partial<typeof localPrefs>) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/users/preferences", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "שגיאה בשמירת ההגדרות");
      }

      onPreferencesUpdated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה לא צפויה");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
      <h2 className="text-lg font-semibold text-neutral-900 mb-4">התראות</h2>

      <div className="space-y-6">
        {/* Notification Toggles */}
        <div className="space-y-4">
          {/* In-app notifications */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="inAppNotifications" className="text-base">
                התראות באפליקציה
              </Label>
              <p className="text-sm text-neutral-500">
                קבל התראות בתוך האפליקציה
              </p>
            </div>
            <Checkbox
              id="inAppNotifications"
              checked={localPrefs.inAppNotifications}
              onCheckedChange={(checked) =>
                handleToggle("inAppNotifications", !!checked)
              }
              disabled={isLoading}
            />
          </div>

          {/* Email notifications */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="emailNotifications" className="text-base">
                התראות באימייל
              </Label>
              <p className="text-sm text-neutral-500">
                קבל התראות לכתובת האימייל שלך
              </p>
              <p className="text-xs text-neutral-400 mt-1">
                (בקרוב - כרגע לא פעיל)
              </p>
            </div>
            <Checkbox
              id="emailNotifications"
              checked={localPrefs.emailNotifications}
              onCheckedChange={(checked) =>
                handleToggle("emailNotifications", !!checked)
              }
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Reminder Timing */}
        <div className="pt-4 border-t border-neutral-100">
          <Label className="text-base mb-3 block">מתי לשלוח תזכורות?</Label>
          <div className="space-y-3">
            {REMINDER_OPTIONS.map((option) => (
              <div key={option.value} className="flex items-center gap-3">
                <Checkbox
                  id={`reminder-${option.value}`}
                  checked={localPrefs.reminderDaysBefore.includes(option.value)}
                  onCheckedChange={(checked) =>
                    handleReminderToggle(option.value, !!checked)
                  }
                  disabled={isLoading}
                />
                <Label
                  htmlFor={`reminder-${option.value}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 rounded-lg bg-[var(--color-danger)]/10 text-[var(--color-danger)] text-sm">
            {error}
          </div>
        )}

        {/* Loading indicator */}
        {isLoading && (
          <p className="text-sm text-neutral-500">שומר שינויים...</p>
        )}
      </div>
    </section>
  );
}
