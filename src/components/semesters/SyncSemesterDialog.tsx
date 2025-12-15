"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { useExtensionStatus } from "@/components/onboarding/ExtensionStatus";
import { getMoodleUrlByInstitutionId } from "@/lib/institutions";

// Types
type SyncStep =
  | "idle"
  | "opening"
  | "login_required"
  | "loading_courses"
  | "select_courses"
  | "loading_sections"
  | "select_sections"
  | "syncing"
  | "success"
  | "error";

interface MoodleCourse {
  moodleId: string;
  name: string;
  url: string;
}

interface SyncSemesterDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSyncComplete?: () => void;
  /** Moodle URL - if provided, skips detection */
  moodleUrl?: string;
}

export function SyncSemesterDialog({
  open,
  onOpenChange,
  onSyncComplete,
  moodleUrl: moodleUrlProp,
}: SyncSemesterDialogProps) {
  const router = useRouter();
  const { isInstalled } = useExtensionStatus();

  // State
  const [step, setStep] = useState<SyncStep>("idle");
  const [courses, setCourses] = useState<MoodleCourse[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [sections, setSections] = useState<Record<string, string[]>>({});
  const [selectedSections, setSelectedSections] = useState<Record<string, string[]>>({});
  const [progress, setProgress] = useState({ current: 0, total: 0, courseName: "" });
  const [error, setError] = useState<string>("");
  const [moodleUrl, setMoodleUrl] = useState<string>(moodleUrlProp || "");
  const [loginCountdown, setLoginCountdown] = useState(120);

  // Update moodleUrl if prop changes
  useEffect(() => {
    if (moodleUrlProp) {
      setMoodleUrl(moodleUrlProp);
    }
  }, [moodleUrlProp]);

  // Get Moodle URL from user's institution (only if not provided as prop)
  useEffect(() => {
    // Skip if moodleUrl already provided via prop
    if (moodleUrlProp) return;

    async function fetchMoodleUrl() {
      try {
        const res = await fetch("/api/users/preferences");
        if (res.ok) {
          const data = await res.json();
          if (data.institutionId && data.institutionId !== "other") {
            const url = getMoodleUrlByInstitutionId(data.institutionId);
            if (url) setMoodleUrl(url);
          }
        }
      } catch {
        // Will use detection fallback
      }
    }
    fetchMoodleUrl();
  }, [moodleUrlProp]);

  // Login countdown timer
  useEffect(() => {
    if (step === "login_required" && loginCountdown > 0) {
      const timer = setTimeout(() => setLoginCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [step, loginCountdown]);

  // Event listeners for extension communication
  useEffect(() => {
    const handlers: Record<string, (e: CustomEvent) => void> = {
      "semesterhub-moodle-login-required": () => {
        setStep("login_required");
        setLoginCountdown(120);
      },
      "semesterhub-moodle-login-success": () => {
        setStep("loading_courses");
      },
      "semesterhub-courses-ready": (e) => {
        const { courses } = e.detail;
        setCourses(courses);
        setSelectedCourses([]); // Default: no courses selected
        setStep("select_courses");
      },
      "semesterhub-sections-ready": (e) => {
        const { sections } = e.detail;
        setSections(sections);
        // Default: all sections selected
        const defaultSelected: Record<string, string[]> = {};
        Object.entries(sections).forEach(([courseId, secs]) => {
          defaultSelected[courseId] = secs as string[];
        });
        setSelectedSections(defaultSelected);
        setStep("select_sections");
      },
      "semesterhub-sync-progress": (e) => {
        setProgress(e.detail);
      },
      "semesterhub-sync-complete": async (e) => {
        if (e.detail.success && e.detail.courses) {
          // Save to database via API
          try {
            setStep("syncing");

            // Extract universityId from moodleUrl
            const moodleUrlObj = new URL(e.detail.moodleUrl);
            const universityId = moodleUrlObj.hostname.split('.')[1] || 'unknown';

            const response = await fetch("/api/sync/moodle", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                universityId,
                moodleUrl: e.detail.moodleUrl,
                courses: e.detail.courses,
                assignments: e.detail.assignments || [],
              }),
            });

            if (!response.ok) {
              throw new Error("שגיאה בשמירת הנתונים");
            }

            setStep("success");
            if (onSyncComplete) {
              onSyncComplete();
            } else {
              setTimeout(() => router.push("/dashboard"), 2000);
            }
          } catch (err) {
            setError(err instanceof Error ? err.message : "שגיאה בשמירה");
            setStep("error");
          }
        } else if (e.detail.success) {
          // Legacy: no data, just success
          setStep("success");
          if (onSyncComplete) {
            onSyncComplete();
          } else {
            setTimeout(() => router.push("/dashboard"), 2000);
          }
        } else {
          setError(e.detail.error || "אירעה שגיאה");
          setStep("error");
        }
      },
      "semesterhub-moodle-url-detected": (e) => {
        if (e.detail.moodleUrl) {
          setMoodleUrl(e.detail.moodleUrl);
        }
      },
    };

    Object.entries(handlers).forEach(([event, handler]) => {
      document.addEventListener(event, handler as EventListener);
    });

    return () => {
      Object.entries(handlers).forEach(([event, handler]) => {
        document.removeEventListener(event, handler as EventListener);
      });
    };
  }, [router, onSyncComplete]);

  // Flag to auto-start sync when moodleUrl is detected
  const [pendingSync, setPendingSync] = useState(false);

  // Auto-start sync when moodleUrl is detected and pendingSync is true
  useEffect(() => {
    if (pendingSync && moodleUrl) {
      setPendingSync(false);
      setStep("opening");
      document.dispatchEvent(
        new CustomEvent("semesterhub-webapp-command", {
          detail: { action: "openMoodleAndGetCourses", moodleUrl },
        })
      );
    }
  }, [pendingSync, moodleUrl]);

  // Timeout for moodleUrl detection
  useEffect(() => {
    if (pendingSync && !moodleUrl) {
      const timeout = setTimeout(() => {
        if (pendingSync) {
          setPendingSync(false);
          setError("לא הצלחנו לזהות את כתובת המודל. נסה לפתוח את אתר המודל בכרטיסייה אחרת.");
          setStep("error");
        }
      }, 5000); // 5 second timeout
      return () => clearTimeout(timeout);
    }
  }, [pendingSync, moodleUrl]);

  // Actions
  const handleStartSync = () => {
    if (!moodleUrl) {
      // Try to detect from extension, then auto-start sync
      setPendingSync(true);
      setStep("opening"); // Show loading state while detecting
      document.dispatchEvent(
        new CustomEvent("semesterhub-webapp-command", {
          detail: { action: "detectMoodleUrl" },
        })
      );
      return;
    }

    setStep("opening");
    document.dispatchEvent(
      new CustomEvent("semesterhub-webapp-command", {
        detail: { action: "openMoodleAndGetCourses", moodleUrl },
      })
    );
  };

  const handleContinueToSections = () => {
    setStep("loading_sections");
    document.dispatchEvent(
      new CustomEvent("semesterhub-webapp-command", {
        detail: {
          action: "getSectionsForCourses",
          courses: selectedCourses,
          moodleUrl,
        },
      })
    );
  };

  const handleSync = () => {
    setStep("syncing");
    const coursesToSync = selectedCourses.map((id) => {
      const course = courses.find((c) => c.moodleId === id);
      return {
        moodleId: id,
        name: course?.name,
        url: course?.url,
        selectedSections: selectedSections[id] || [],
      };
    });

    document.dispatchEvent(
      new CustomEvent("semesterhub-webapp-command", {
        detail: {
          action: "syncSelectedCourses",
          courses: coursesToSync,
          moodleUrl,
        },
      })
    );
  };

  const handleReset = () => {
    setStep("idle");
    setCourses([]);
    setSelectedCourses([]);
    setSections({});
    setSelectedSections({});
    setProgress({ current: 0, total: 0, courseName: "" });
    setError("");
    setLoginCountdown(120);
  };

  const toggleCourse = (courseId: string) => {
    setSelectedCourses((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    );
  };

  const toggleSection = (courseId: string, section: string) => {
    setSelectedSections((prev) => {
      const current = prev[courseId] || [];
      return {
        ...prev,
        [courseId]: current.includes(section)
          ? current.filter((s) => s !== section)
          : [...current, section],
      };
    });
  };

  // Render different steps
  const renderContent = () => {
    switch (step) {
      case "idle":
        return (
          <div className="space-y-4 text-center">
            {!isInstalled ? (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertCircle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                <p className="text-sm text-yellow-800">
                  התוסף לא מותקן. יש להתקין את התוסף כדי לסנכרן.
                </p>
              </div>
            ) : (
              <>
                <p className="text-muted-foreground">
                  לחץ על הכפתור כדי לפתוח את המודל ולסנכרן את הקורסים שלך
                </p>
                <Button onClick={handleStartSync} size="lg">
                  פתח את המודל וסנכרן
                </Button>
              </>
            )}
          </div>
        );

      case "opening":
        return (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p>פותח את המודל...</p>
          </div>
        );

      case "login_required":
        return (
          <div className="flex flex-col items-center gap-4 py-8">
            <AlertCircle className="h-12 w-12 text-orange-500" />
            <p className="text-lg font-medium">אנא התחבר למודל בחלון שנפתח</p>
            <p className="text-sm text-muted-foreground">
              זמן נותר: {Math.floor(loginCountdown / 60)}:{String(loginCountdown % 60).padStart(2, "0")}
            </p>
          </div>
        );

      case "loading_courses":
        return (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p>טוען קורסים...</p>
          </div>
        );

      case "select_courses":
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              בחר את הקורסים שברצונך לסנכרן:
            </p>
            <div className="max-h-64 overflow-y-auto space-y-2 border rounded-lg p-3">
              {courses.map((course) => (
                <label
                  key={course.moodleId}
                  className="flex items-center gap-3 p-2 hover:bg-muted rounded cursor-pointer"
                >
                  <Checkbox
                    checked={selectedCourses.includes(course.moodleId)}
                    onCheckedChange={() => toggleCourse(course.moodleId)}
                  />
                  <span className="text-sm">{course.name}</span>
                </label>
              ))}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                נבחרו {selectedCourses.length} מתוך {courses.length} קורסים
              </span>
              <Button
                onClick={handleContinueToSections}
                disabled={selectedCourses.length === 0}
              >
                המשך
              </Button>
            </div>
          </div>
        );

      case "loading_sections":
        return (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p>טוען יחידות הוראה...</p>
          </div>
        );

      case "select_sections":
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              בחר את יחידות ההוראה שברצונך לעקוב אחריהן:
            </p>
            <div className="max-h-64 overflow-y-auto space-y-4 border rounded-lg p-3">
              {selectedCourses.map((courseId) => {
                const course = courses.find((c) => c.moodleId === courseId);
                const courseSections = sections[courseId] || [];

                if (courseSections.length === 0) return null;

                return (
                  <div key={courseId} className="space-y-2">
                    <p className="font-medium text-sm">{course?.name}</p>
                    <div className="mr-4 space-y-1">
                      {courseSections.map((section) => (
                        <label
                          key={section}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <Checkbox
                            checked={selectedSections[courseId]?.includes(section)}
                            onCheckedChange={() => toggleSection(courseId, section)}
                          />
                          <span className="text-sm">{section}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSync}>סנכרן</Button>
            </div>
          </div>
        );

      case "syncing":
        return (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p>מסנכרן קורס {progress.current} מתוך {progress.total}...</p>
            {progress.courseName && (
              <p className="text-sm text-muted-foreground">{progress.courseName}</p>
            )}
            <Progress value={(progress.current / progress.total) * 100} className="w-full" />
          </div>
        );

      case "success":
        return (
          <div className="flex flex-col items-center gap-4 py-8">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <p className="text-lg font-medium">הסנכרון הושלם בהצלחה!</p>
            <p className="text-sm text-muted-foreground">
              מעביר אותך לדשבורד...
            </p>
          </div>
        );

      case "error":
        return (
          <div className="flex flex-col items-center gap-4 py-8">
            <XCircle className="h-12 w-12 text-red-500" />
            <p className="text-lg font-medium">אירעה שגיאה</p>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button onClick={handleReset} variant="secondary">
              נסה שוב
            </Button>
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <div dir="rtl">
          <DialogHeader>
            <DialogTitle>סנכרון סמסטר</DialogTitle>
          </DialogHeader>
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
