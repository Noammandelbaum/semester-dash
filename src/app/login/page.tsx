"use client";

import { signIn, useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

function LoginContent() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [status, router]);

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl: "/dashboard" });
  };

  // Show loading while checking auth status
  if (status === "loading" || status === "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-[var(--color-text-muted)]">טוען...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center p-4">
      <div className="animate-slide-up w-full max-w-md">
        <Card className="text-center" hover={false}>
          <CardHeader>
            <div className="mx-auto mb-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                SD
              </div>
            </div>
            <CardTitle className="text-2xl">ברוכים הבאים!</CardTitle>
            <CardDescription>
              התחבר כדי לנהל את הסמסטר שלך
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-100 text-red-700 text-sm mb-4">
                שגיאת התחברות: {error}
              </div>
            )}

            <Button
              onClick={handleGoogleSignIn}
              size="lg"
              className="w-full gap-3"
            >
              <GoogleIcon />
              התחבר עם Google
            </Button>

            <p className="text-xs text-[var(--color-text-muted)] mt-4">
              בהתחברות אתה מסכים ל
              <a href="#" className="underline mx-1">תנאי השימוש</a>
              ול
              <a href="#" className="underline mx-1">מדיניות הפרטיות</a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path
        fill="currentColor"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="currentColor"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="currentColor"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="currentColor"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">טוען...</div>}>
      <LoginContent />
    </Suspense>
  );
}
