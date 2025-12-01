"use client";

import { Button } from "@/components/ui/button";
import { CreateCourseDialog } from "@/components/courses/create-course-dialog";
import { Plus } from "lucide-react";

/**
 * QuickAddButtons
 * Quick action buttons for adding courses and assignments
 *
 * UX: Prominent, accessible buttons for common actions
 */
interface QuickAddButtonsProps {
  onCourseCreated: () => void;
  onAssignmentCreated?: () => void;
}

export function QuickAddButtons({
  onCourseCreated,
  onAssignmentCreated,
}: QuickAddButtonsProps) {
  return (
    <div className="flex flex-wrap gap-3">
      <CreateCourseDialog onCourseCreated={onCourseCreated} />

      {/* Assignment button - will open dialog when course detail is implemented */}
      <Button
        variant="secondary"
        className="min-h-[44px]"
        onClick={onAssignmentCreated}
        disabled={!onAssignmentCreated}
      >
        <Plus className="w-4 h-4 me-2" aria-hidden="true" />
        הוסף משימה
      </Button>
    </div>
  );
}
