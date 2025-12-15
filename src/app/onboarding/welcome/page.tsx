"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GraduationCap, ArrowLeft, Sparkles, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OnboardingCard } from "@/components/onboarding";
import { INSTITUTIONS, getInstitutionsByType } from "@/lib/institutions";

/**
 * Welcome Step (Step 1)
 *
 * First onboarding screen:
 * - Greeting + value proposition
 * - Institution selection dropdown
 * - Call to action to continue to extension check
 *
 * UX: Quick selection, clear value proposition
 */

export default function WelcomePage() {
  const router = useRouter();
  const [selectedInstitution, setSelectedInstitution] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasConsented, setHasConsented] = useState(false);

  const { universities, colleges } = getInstitutionsByType();

  const canProceed = selectedInstitution && hasConsented;

  const handleStart = async () => {
    if (!canProceed) return;

    setIsLoading(true);

    try {
      // Save institutionId to user preferences
      await fetch("/api/users/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ institutionId: selectedInstitution }),
      });

      // Navigate to extension page
      router.push("/onboarding/extension");
    } catch (error) {
      console.error("Failed to save institution:", error);
      setIsLoading(false);
    }
  };

  const selectedInst = INSTITUTIONS.find((i) => i.id === selectedInstitution);

  return (
    <OnboardingCard currentStep={1}>
      {/* Icon */}
      <div className="flex justify-center mb-6">
        <div className="w-20 h-20 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center">
          <GraduationCap className="w-10 h-10 text-[var(--color-primary)]" />
        </div>
      </div>

      {/* Title */}
      <h1 className="text-2xl sm:text-3xl font-bold text-center text-[var(--color-text-primary)] mb-3">
        ברוך הבא ל-SemesterHub
      </h1>

      {/* Tagline */}
      <p className="text-lg text-center text-[var(--color-primary)] font-medium mb-6">
        הסמסטר שלך, במבט אחד
      </p>

      {/* Value propositions */}
      <div className="space-y-3 mb-6">
        <ValueProp icon={<Sparkles className="w-5 h-5" />}>
          סנכרן אוטומטית מ-Moodle
        </ValueProp>
        <ValueProp icon={<Sparkles className="w-5 h-5" />}>
          צפה בכל המטלות והדדליינים במקום אחד
        </ValueProp>
        <ValueProp icon={<Sparkles className="w-5 h-5" />}>
          עקוב אחרי ההתקדמות שלך בכל קורס
        </ValueProp>
      </div>

      {/* Institution Selection */}
      <div className="space-y-2 mb-6">
        <Label htmlFor="institution">באיזה מוסד אתה לומד?</Label>
        <Select value={selectedInstitution} onValueChange={setSelectedInstitution}>
          <SelectTrigger id="institution" disabled={isLoading}>
            <SelectValue placeholder="בחר מוסד לימודים" />
          </SelectTrigger>
          <SelectContent>
            {/* Universities */}
            <div className="px-2 py-1.5 text-xs font-medium text-[var(--color-text-muted)]">
              אוניברסיטאות
            </div>
            {universities.map((inst) => (
              <SelectItem key={inst.id} value={inst.id}>
                <span className="flex items-center gap-2">
                  {inst.name}
                  {inst.supported && (
                    <CheckCircle className="w-3.5 h-3.5 text-[var(--color-success)]" />
                  )}
                </span>
              </SelectItem>
            ))}

            {/* Colleges */}
            <div className="px-2 py-1.5 text-xs font-medium text-[var(--color-text-muted)] mt-2">
              מכללות
            </div>
            {colleges.map((inst) => (
              <SelectItem key={inst.id} value={inst.id}>
                <span className="flex items-center gap-2">
                  {inst.name}
                  {inst.supported && (
                    <CheckCircle className="w-3.5 h-3.5 text-[var(--color-success)]" />
                  )}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Supported badge */}
        {selectedInst?.supported && (
          <p className="text-sm text-[var(--color-success)] flex items-center gap-1">
            <CheckCircle className="w-4 h-4" />
            מוסד נתמך - סנכרון מלא זמין
          </p>
        )}
        {selectedInst && !selectedInst.supported && (
          <p className="text-sm text-[var(--color-text-muted)]">
            המוסד עדיין לא נבדק - נשמח לתמיכה שלך בבדיקות
          </p>
        )}
      </div>

      {/* Consent Checkbox */}
      <div className="mb-6 p-4 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border)]">
        <div className="flex items-start gap-3">
          <Checkbox
            id="consent"
            checked={hasConsented}
            onCheckedChange={(checked) => setHasConsented(checked === true)}
            disabled={isLoading}
          />
          <label
            htmlFor="consent"
            className="text-sm text-[var(--color-text-secondary)] leading-relaxed cursor-pointer"
          >
            קראתי ואני מסכים/ה ל
            <Link
              href="/terms"
              target="_blank"
              className="text-[var(--color-primary)] hover:underline mx-1"
            >
              תנאי השימוש
            </Link>
            ול
            <Link
              href="/privacy"
              target="_blank"
              className="text-[var(--color-primary)] hover:underline mx-1"
            >
              מדיניות הפרטיות
            </Link>
            , ומאשר/ת את איסוף הנתונים מ-Moodle כמתואר.
          </label>
        </div>
      </div>

      {/* CTA */}
      <Button
        variant="primary"
        size="lg"
        className="w-full min-h-[48px]"
        onClick={handleStart}
        disabled={!canProceed || isLoading}
        isLoading={isLoading}
      >
        <span>המשך</span>
        <ArrowLeft className="w-5 h-5 mr-2" />
      </Button>

      {/* Time estimate */}
      <p className="text-center text-sm text-[var(--color-text-muted)] mt-4">
        ההגדרה תיקח פחות מ-2 דקות
      </p>
    </OnboardingCard>
  );
}

function ValueProp({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 text-[var(--color-text-secondary)]">
      <div className="text-[var(--color-primary)]">{icon}</div>
      <span>{children}</span>
    </div>
  );
}
