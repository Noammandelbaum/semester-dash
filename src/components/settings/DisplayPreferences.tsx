"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UserPreferences {
  id: string;
  theme: string;
}

interface DisplayPreferencesProps {
  preferences: UserPreferences;
  onPreferencesUpdated?: () => void;
}

export function DisplayPreferences({
  preferences,
  onPreferencesUpdated,
}: DisplayPreferencesProps) {
  const t = useTranslations("settings");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState(preferences.theme);

  const THEME_OPTIONS = [
    { value: "system", label: t("themeOptions.system") },
    { value: "light", label: t("themeOptions.light") },
    { value: "dark", label: t("themeOptions.dark") },
  ];

  const handleThemeChange = async (newTheme: string) => {
    setTheme(newTheme);
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/users/preferences", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ theme: newTheme }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "שגיאה בשמירת ההגדרות");
      }

      onPreferencesUpdated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה לא צפויה");
      setTheme(preferences.theme); // Revert on error
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
      <h2 className="text-lg font-semibold text-neutral-900 mb-4">תצוגה</h2>

      <div className="space-y-4">
        {/* Theme Selection */}
        <div className="space-y-2">
          <Label htmlFor="theme">ערכת נושא</Label>
          <Select
            value={theme}
            onValueChange={handleThemeChange}
            disabled={isLoading}
          >
            <SelectTrigger id="theme" className="w-full sm:w-64">
              <SelectValue placeholder="בחר ערכת נושא" />
            </SelectTrigger>
            <SelectContent>
              {THEME_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-neutral-500">
            מצב כהה יהיה זמין בקרוב
          </p>
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
