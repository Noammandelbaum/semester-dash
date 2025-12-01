import { Skeleton } from "@/components/ui/skeleton";

/**
 * Calendar Page Loading State
 * Shows skeleton while data loads
 */
export default function CalendarLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>

      {/* Navigation skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-10 w-10" />
        </div>
        <Skeleton className="h-10 w-24" />
      </div>

      {/* Calendar grid skeleton */}
      <div className="border border-[var(--color-border)] rounded-lg overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-[var(--color-border)]">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="p-3 text-center">
              <Skeleton className="h-4 w-8 mx-auto" />
            </div>
          ))}
        </div>

        {/* Week rows */}
        {[...Array(5)].map((_, weekIndex) => (
          <div
            key={weekIndex}
            className="grid grid-cols-7 border-b border-[var(--color-border)] last:border-b-0"
          >
            {[...Array(7)].map((_, dayIndex) => (
              <div
                key={dayIndex}
                className="min-h-[100px] p-2 border-e border-[var(--color-border)] last:border-e-0"
              >
                <Skeleton className="h-5 w-5 mb-2" />
                {weekIndex % 2 === 0 && dayIndex % 3 === 0 && (
                  <Skeleton className="h-6 w-full rounded" />
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
