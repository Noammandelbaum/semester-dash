/**
 * Israeli Academic Semester Templates
 * Default dates and naming conventions for Israeli universities
 */

import type { SemesterType } from "@/schemas/semester";

export interface SemesterTemplate {
  type: SemesterType;
  getDefaultDates: (year: number) => { start: Date; end: Date };
  nameTemplate: (year: number) => string;
  hebrewLabel: string;
}

/**
 * Convert Gregorian year to Hebrew year representation
 * e.g., 2024 -> "תשפ"ה" (5785)
 *
 * Note: This is a simplified version. Hebrew year starts in fall,
 * so academic year 2024-2025 is תשפ"ה
 */
export function getHebrewYear(gregorianYear: number): string {
  // Academic year 2024-2025 corresponds to Hebrew year 5785 (תשפ"ה)
  // The Hebrew year changes in September/October
  const hebrewYear = gregorianYear + 3761;

  // Hebrew year number representation for years 5780-5790
  const hebrewYearMap: Record<number, string> = {
    5780: 'תש"פ',
    5781: 'תשפ"א',
    5782: 'תשפ"ב',
    5783: 'תשפ"ג',
    5784: 'תשפ"ד',
    5785: 'תשפ"ה',
    5786: 'תשפ"ו',
    5787: 'תשפ"ז',
    5788: 'תשפ"ח',
    5789: 'תשפ"ט',
    5790: 'תש"צ',
    5791: 'תשצ"א',
  };

  return hebrewYearMap[hebrewYear] || `${hebrewYear}`;
}

/**
 * Semester Templates for Israeli Academic Calendar
 *
 * Typical Israeli academic calendar:
 * - Semester A (Fall): October 15 - February 15
 * - Semester B (Spring): March 1 - June 30
 * - Summer Semester: July 1 - August 31
 */
export const SEMESTER_TEMPLATES: Record<SemesterType, SemesterTemplate> = {
  A: {
    type: "A",
    hebrewLabel: "סמסטר א'",
    getDefaultDates: (year: number) => ({
      start: new Date(year, 9, 15), // October 15
      end: new Date(year + 1, 1, 15), // February 15 (next year)
    }),
    nameTemplate: (year: number) => `סמסטר א' ${getHebrewYear(year)}`,
  },
  B: {
    type: "B",
    hebrewLabel: "סמסטר ב'",
    getDefaultDates: (year: number) => ({
      start: new Date(year, 2, 1), // March 1
      end: new Date(year, 5, 30), // June 30
    }),
    nameTemplate: (year: number) => `סמסטר ב' ${getHebrewYear(year - 1)}`, // Same Hebrew year as Semester A
  },
  SUMMER: {
    type: "SUMMER",
    hebrewLabel: "סמסטר קיץ",
    getDefaultDates: (year: number) => ({
      start: new Date(year, 6, 1), // July 1
      end: new Date(year, 7, 31), // August 31
    }),
    nameTemplate: (year: number) => `קיץ ${year}`,
  },
};

/**
 * Get all semester templates as an array
 */
export function getAllTemplates(): SemesterTemplate[] {
  return Object.values(SEMESTER_TEMPLATES);
}

/**
 * Get the current suggested semester based on today's date
 */
export function getSuggestedSemester(): { type: SemesterType; year: number } {
  const today = new Date();
  const month = today.getMonth(); // 0-11
  const year = today.getFullYear();

  // October - February: Semester A
  if (month >= 9 || month <= 1) {
    return {
      type: "A",
      year: month >= 9 ? year : year - 1, // If Jan/Feb, use previous year
    };
  }

  // March - June: Semester B
  if (month >= 2 && month <= 5) {
    return {
      type: "B",
      year: year,
    };
  }

  // July - September: Summer
  return {
    type: "SUMMER",
    year: year,
  };
}

/**
 * Generate a semester name from type and year
 */
export function generateSemesterName(type: SemesterType, year: number): string {
  return SEMESTER_TEMPLATES[type].nameTemplate(year);
}

/**
 * Get default dates for a semester type
 */
export function getSemesterDates(type: SemesterType, year: number): { start: Date; end: Date } {
  return SEMESTER_TEMPLATES[type].getDefaultDates(year);
}

/**
 * Calculate semester progress percentage
 * @param startDate Semester start date
 * @param endDate Semester end date
 * @returns Progress percentage (0-100)
 */
export function calculateSemesterProgress(startDate: Date, endDate: Date): number {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Before semester starts
  if (now < start) return 0;

  // After semester ends
  if (now > end) return 100;

  // During semester
  const totalDuration = end.getTime() - start.getTime();
  const elapsed = now.getTime() - start.getTime();

  return Math.round((elapsed / totalDuration) * 100);
}

/**
 * Calculate current week number in semester
 * @param startDate Semester start date
 * @returns Current week number (1-based)
 */
export function getCurrentWeek(startDate: Date): number {
  const now = new Date();
  const start = new Date(startDate);

  if (now < start) return 0;

  const diffTime = now.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  return Math.floor(diffDays / 7) + 1;
}

/**
 * Calculate total weeks in semester
 */
export function getTotalWeeks(startDate: Date, endDate: Date): number {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  return Math.ceil(diffDays / 7);
}
