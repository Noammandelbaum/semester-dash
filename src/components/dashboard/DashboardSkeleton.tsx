"use client";

import { Skeleton, SkeletonCourseCard } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

/**
 * DashboardSkeleton
 * Loading state for the entire dashboard
 * Matches the layout of DashboardContent
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="טוען דשבורד...">
      {/* Greeting skeleton */}
      <div className="mb-6">
        <Skeleton variant="text" width="200px" height="2rem" />
        <Skeleton variant="text" width="150px" height="1rem" className="mt-2" />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Progress + Stats */}
        <div className="lg:col-span-2 space-y-6">
          {/* Progress ring skeleton */}
          <div className="flex justify-center">
            <Skeleton variant="circular" width={160} height={160} />
          </div>

          {/* Quick stats skeleton */}
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} hover={false}>
                <div className="flex items-start gap-3">
                  <Skeleton variant="rounded" width={40} height={40} />
                  <div className="flex-1 space-y-2">
                    <Skeleton variant="text" width="60%" height="0.875rem" />
                    <Skeleton variant="text" width="40%" height="1.5rem" />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Course cards skeleton */}
          <div>
            <Skeleton variant="text" width="120px" height="1.25rem" className="mb-4" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <SkeletonCourseCard key={i} />
              ))}
            </div>
          </div>
        </div>

        {/* Right column: Upcoming deadlines */}
        <div>
          <Card hover={false}>
            <div className="space-y-4">
              <Skeleton variant="text" width="140px" height="1.25rem" />
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-[var(--color-surface-alt)]">
                  <Skeleton variant="circular" width={24} height={24} />
                  <div className="flex-1 space-y-2">
                    <Skeleton variant="text" width="80%" />
                    <div className="flex gap-2">
                      <Skeleton variant="rounded" width={60} height={20} />
                      <Skeleton variant="rounded" width={80} height={20} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
