"use client";

import { Card } from "@/components/ui/card";
import { BookOpen, CheckCircle, Clock } from "lucide-react";

/**
 * QuickStats
 * Row of 3 stat cards showing key dashboard metrics
 *
 * Stats:
 * 1. Active courses count
 * 2. Completed assignments
 * 3. This week's deadlines
 *
 * UX: Horizontal scroll on mobile, grid on desktop
 */
interface QuickStatsProps {
  coursesTotal: number;
  assignmentsCompleted: number;
  assignmentsTotal: number;
  thisWeekDeadlines: number;
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtext?: string;
  color: string;
}

function StatCard({ icon, label, value, subtext, color }: StatCardProps) {
  return (
    <Card
      hover={false}
      className="flex-shrink-0 min-w-[140px] snap-center animate-slide-up"
    >
      <div className="flex items-start gap-3">
        <div
          className={`p-2 rounded-lg ${color}`}
          aria-hidden="true"
        >
          {icon}
        </div>
        <div>
          <p className="text-sm text-[var(--color-text-secondary)]">{label}</p>
          <p className="text-2xl font-bold text-[var(--color-text-primary)]">
            {value}
          </p>
          {subtext && (
            <p className="text-xs text-[var(--color-text-muted)]">{subtext}</p>
          )}
        </div>
      </div>
    </Card>
  );
}

export function QuickStats({
  coursesTotal,
  assignmentsCompleted,
  assignmentsTotal,
  thisWeekDeadlines,
}: QuickStatsProps) {
  const completionPercent =
    assignmentsTotal > 0
      ? Math.round((assignmentsCompleted / assignmentsTotal) * 100)
      : 0;

  return (
    <div
      className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide sm:grid sm:grid-cols-3 sm:overflow-visible"
      role="list"
      aria-label="סטטיסטיקות מהירות"
    >
      <StatCard
        icon={<BookOpen className="w-5 h-5 text-[var(--color-primary)]" />}
        label="קורסים פעילים"
        value={coursesTotal}
        color="bg-[var(--color-primary)]/10"
      />
      <StatCard
        icon={<CheckCircle className="w-5 h-5 text-[var(--color-success)]" />}
        label="משימות שהושלמו"
        value={assignmentsCompleted}
        subtext={`${completionPercent}% מתוך ${assignmentsTotal}`}
        color="bg-[var(--color-success)]/10"
      />
      <StatCard
        icon={<Clock className="w-5 h-5 text-[var(--color-warning)]" />}
        label="דדליינים השבוע"
        value={thisWeekDeadlines}
        color="bg-[var(--color-warning)]/10"
      />
    </div>
  );
}
