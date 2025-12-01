"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function AccountActions() {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== "DELETE") {
      setError('יש להקליד "DELETE" לאישור');
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch("/api/users/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ confirmation: "DELETE" }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "שגיאה במחיקת החשבון");
      }

      // Success - redirect to home
      await signOut({ callbackUrl: "/" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה לא צפויה");
      setIsDeleting(false);
    }
  };

  const handleDialogClose = () => {
    setShowDeleteDialog(false);
    setDeleteConfirmation("");
    setError(null);
  };

  return (
    <section className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
      <h2 className="text-lg font-semibold text-neutral-900 mb-4">חשבון</h2>

      <div className="space-y-4">
        {/* Logout */}
        <div className="flex items-center justify-between py-3 border-b border-neutral-100">
          <div>
            <p className="text-neutral-900">התנתקות</p>
            <p className="text-sm text-neutral-500">
              התנתק מהחשבון הנוכחי
            </p>
          </div>
          <Button variant="ghost" onClick={handleLogout}>
            התנתק
          </Button>
        </div>

        {/* Delete Account */}
        <div className="flex items-center justify-between py-3">
          <div>
            <p className="text-neutral-900">מחיקת חשבון</p>
            <p className="text-sm text-neutral-500">
              מחיקה לצמיתות של החשבון וכל הנתונים
            </p>
          </div>
          <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <DialogTrigger asChild>
              <Button variant="danger">מחק חשבון</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>מחיקת חשבון</DialogTitle>
                <DialogDescription>
                  פעולה זו תמחק את החשבון שלך וכל הנתונים הקשורים אליו לצמיתות.
                  לא ניתן לבטל פעולה זו.
                </DialogDescription>
              </DialogHeader>

              <div className="my-4 p-4 rounded-lg bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20">
                <p className="text-sm text-[var(--color-danger)] font-medium mb-2">
                  הנתונים הבאים יימחקו:
                </p>
                <ul className="text-sm text-[var(--color-danger)]/80 list-disc list-inside space-y-1">
                  <li>כל הקורסים שלך</li>
                  <li>כל המשימות והמטלות</li>
                  <li>כל הסמסטרים</li>
                  <li>הגדרות ופרופיל</li>
                </ul>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deleteConfirmation">
                  הקלד <span className="font-mono font-bold">DELETE</span> לאישור
                </Label>
                <Input
                  id="deleteConfirmation"
                  type="text"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  placeholder="DELETE"
                  disabled={isDeleting}
                  className="font-mono"
                />
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-[var(--color-danger)]/10 text-[var(--color-danger)] text-sm">
                  {error}
                </div>
              )}

              <DialogFooter>
                <Button
                  variant="ghost"
                  onClick={handleDialogClose}
                  disabled={isDeleting}
                >
                  ביטול
                </Button>
                <Button
                  variant="danger"
                  onClick={handleDeleteAccount}
                  isLoading={isDeleting}
                  disabled={deleteConfirmation !== "DELETE"}
                >
                  מחק חשבון לצמיתות
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </section>
  );
}
