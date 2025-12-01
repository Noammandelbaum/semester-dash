"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  createdAt: string;
}

interface ProfileSectionProps {
  profile: UserProfile;
  onProfileUpdated?: () => void;
}

export function ProfileSection({ profile, onProfileUpdated }: ProfileSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState(profile.name || "");

  const handleSave = async () => {
    if (!name.trim()) {
      setError("שם הוא שדה חובה");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/users/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "שגיאה בעדכון הפרופיל");
      }

      setIsEditing(false);
      onProfileUpdated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה לא צפויה");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setName(profile.name || "");
    setError(null);
    setIsEditing(false);
  };

  return (
    <section className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
      <h2 className="text-lg font-semibold text-neutral-900 mb-4">פרופיל</h2>

      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="shrink-0">
          {profile.image ? (
            <img
              src={profile.image}
              alt={profile.name || "User"}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white text-xl font-medium">
              {(profile.name || profile.email || "?")[0].toUpperCase()}
            </div>
          )}
        </div>

        {/* Profile Info */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name">שם</Label>
            {isEditing ? (
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                placeholder="הזן את שמך"
              />
            ) : (
              <p className="text-neutral-900">{profile.name || "לא הוגדר"}</p>
            )}
          </div>

          {/* Email (read-only) */}
          <div className="space-y-1.5">
            <Label htmlFor="email">אימייל</Label>
            <p className="text-neutral-600 text-sm">
              {profile.email || "לא זמין"}
            </p>
            <p className="text-neutral-400 text-xs">
              לא ניתן לשנות (מקושר לחשבון Google)
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg bg-[var(--color-danger)]/10 text-[var(--color-danger)] text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSave}
                  isLoading={isLoading}
                >
                  שמור
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                  disabled={isLoading}
                >
                  ביטול
                </Button>
              </>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                עריכה
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
