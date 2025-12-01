"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { AssignmentsListView } from "./components/AssignmentsListView";
import { AssignmentsKanbanView } from "./components/AssignmentsKanbanView";
import { List, LayoutGrid, Search, X } from "lucide-react";
import type { AssignmentStatus, AssignmentPriority } from "@prisma/client";

/**
 * Assignments Page
 * Central view of all assignments across courses
 *
 * Features:
 * - List view (table) and Kanban board toggle
 * - Filter by course, status, priority
 * - Search by title
 * - URL state persistence
 *
 * UX: "בוא נתמקד באחד" - supportive, not overwhelming
 */

interface Course {
  id: string;
  name: string;
  color: string | null;
  courseCode: string | null;
}

interface Assignment {
  id: string;
  title: string;
  description: string | null;
  dueDate: string;
  status: AssignmentStatus;
  priority: AssignmentPriority;
  weight: number | null;
  courseId: string;
  course: Course;
}

type ViewMode = "list" | "kanban";

export default function AssignmentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Data state
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state from URL
  const [viewMode, setViewMode] = useState<ViewMode>(
    (searchParams.get("view") as ViewMode) || "list"
  );
  const [courseFilter, setCourseFilter] = useState<string>(
    searchParams.get("course") || "all"
  );
  const [statusFilter, setStatusFilter] = useState<string>(
    searchParams.get("status") || "all"
  );
  const [priorityFilter, setPriorityFilter] = useState<string>(
    searchParams.get("priority") || "all"
  );
  const [searchQuery, setSearchQuery] = useState<string>(
    searchParams.get("q") || ""
  );

  // Update URL when filters change
  const updateURL = useCallback(
    (params: Record<string, string>) => {
      const newParams = new URLSearchParams(searchParams.toString());
      Object.entries(params).forEach(([key, value]) => {
        if (value && value !== "all" && value !== "") {
          newParams.set(key, value);
        } else {
          newParams.delete(key);
        }
      });
      router.replace(`/dashboard/assignments?${newParams.toString()}`, {
        scroll: false,
      });
    },
    [router, searchParams]
  );

  // Fetch courses
  const fetchCourses = useCallback(async () => {
    try {
      const response = await fetch("/api/courses");
      if (!response.ok) throw new Error("Failed to fetch courses");
      const data = await response.json();
      setCourses(data.courses);
    } catch (err) {
      console.error("Error fetching courses:", err);
    }
  }, []);

  // Fetch assignments
  const fetchAssignments = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Build query string
      const params = new URLSearchParams();
      if (courseFilter && courseFilter !== "all") {
        params.set("courseId", courseFilter);
      }
      if (statusFilter && statusFilter !== "all") {
        params.set("status", statusFilter);
      }
      if (priorityFilter && priorityFilter !== "all") {
        params.set("priority", priorityFilter);
      }

      const response = await fetch(`/api/assignments?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch assignments");
      const data = await response.json();

      // Client-side search filter
      let filteredAssignments = data.assignments;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filteredAssignments = filteredAssignments.filter(
          (a: Assignment) =>
            a.title.toLowerCase().includes(query) ||
            a.description?.toLowerCase().includes(query)
        );
      }

      setAssignments(filteredAssignments);
    } catch (err) {
      setError(err instanceof Error ? err.message : "אירעה שגיאה בטעינת המשימות");
    } finally {
      setIsLoading(false);
    }
  }, [courseFilter, statusFilter, priorityFilter, searchQuery]);

  // Initial fetch
  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  // Handlers
  const handleViewChange = (view: ViewMode) => {
    setViewMode(view);
    updateURL({ view });
  };

  const handleCourseChange = (value: string) => {
    setCourseFilter(value);
    updateURL({ course: value });
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    updateURL({ status: value });
  };

  const handlePriorityChange = (value: string) => {
    setPriorityFilter(value);
    updateURL({ priority: value });
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    // Debounce URL update for search
  };

  const handleSearchSubmit = () => {
    updateURL({ q: searchQuery });
  };

  const clearFilters = () => {
    setCourseFilter("all");
    setStatusFilter("all");
    setPriorityFilter("all");
    setSearchQuery("");
    router.replace("/dashboard/assignments", { scroll: false });
  };

  const handleStatusUpdate = async (
    assignmentId: string,
    newStatus: AssignmentStatus
  ) => {
    try {
      const response = await fetch(`/api/assignments/${assignmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error("Failed to update status");

      // Refresh assignments
      await fetchAssignments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה בעדכון הסטטוס");
    }
  };

  const hasActiveFilters =
    courseFilter !== "all" ||
    statusFilter !== "all" ||
    priorityFilter !== "all" ||
    searchQuery !== "";

  // Loading skeleton
  if (isLoading && assignments.length === 0) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="flex gap-4">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="כל המשימות"
        subtitle="צפה ונהל את כל המשימות שלך במקום אחד"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "list" ? "primary" : "ghost"}
              size="sm"
              onClick={() => handleViewChange("list")}
              className="min-h-[44px] min-w-[44px]"
              aria-label="תצוגת רשימה"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "kanban" ? "primary" : "ghost"}
              size="sm"
              onClick={() => handleViewChange("kanban")}
              className="min-h-[44px] min-w-[44px]"
              aria-label="תצוגת קנבן"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-[300px]">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]" />
          <Input
            type="text"
            placeholder="חיפוש לפי כותרת..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit()}
            className="ps-9"
          />
        </div>

        {/* Course filter */}
        <Select value={courseFilter} onValueChange={handleCourseChange}>
          <SelectTrigger className="w-[160px] min-h-[44px]">
            <SelectValue placeholder="כל הקורסים" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל הקורסים</SelectItem>
            {courses.map((course) => (
              <SelectItem key={course.id} value={course.id}>
                {course.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status filter */}
        <Select value={statusFilter} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-[140px] min-h-[44px]">
            <SelectValue placeholder="כל הסטטוסים" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל הסטטוסים</SelectItem>
            <SelectItem value="NOT_STARTED">לא התחיל</SelectItem>
            <SelectItem value="IN_PROGRESS">בתהליך</SelectItem>
            <SelectItem value="COMPLETED">הושלם</SelectItem>
          </SelectContent>
        </Select>

        {/* Priority filter */}
        <Select value={priorityFilter} onValueChange={handlePriorityChange}>
          <SelectTrigger className="w-[140px] min-h-[44px]">
            <SelectValue placeholder="כל העדיפויות" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל העדיפויות</SelectItem>
            <SelectItem value="HIGH">גבוהה</SelectItem>
            <SelectItem value="MEDIUM">בינונית</SelectItem>
            <SelectItem value="LOW">נמוכה</SelectItem>
          </SelectContent>
        </Select>

        {/* Clear filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="min-h-[44px] text-[var(--color-text-secondary)]"
          >
            <X className="h-4 w-4 me-1" />
            נקה פילטרים
          </Button>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-lg bg-[var(--color-danger)]/10 text-[var(--color-danger)]">
          {error}
          <button
            onClick={fetchAssignments}
            className="underline hover:no-underline ms-2"
          >
            נסה שוב
          </button>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && assignments.length === 0 && (
        <EmptyState
          illustration={hasActiveFilters ? "no-results" : "empty-assignments"}
          title={hasActiveFilters ? "לא נמצאו משימות" : "אין משימות עדיין"}
          description={
            hasActiveFilters
              ? "נסה לשנות את הפילטרים או לחפש משהו אחר"
              : "הוסף משימות דרך דפי הקורסים שלך"
          }
          actionLabel={hasActiveFilters ? "נקה פילטרים" : undefined}
          onAction={hasActiveFilters ? clearFilters : undefined}
        />
      )}

      {/* Content */}
      {!error && assignments.length > 0 && (
        <>
          {viewMode === "list" ? (
            <AssignmentsListView
              assignments={assignments}
              onStatusChange={handleStatusUpdate}
              onRefresh={fetchAssignments}
            />
          ) : (
            <AssignmentsKanbanView
              assignments={assignments}
              onStatusChange={handleStatusUpdate}
              onRefresh={fetchAssignments}
            />
          )}
        </>
      )}
    </div>
  );
}
