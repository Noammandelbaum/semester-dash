/**
 * Semester Utilities
 *
 * Functions for determining current semester based on date.
 * Israeli academic year follows Hebrew calendar:
 * - Semester A (א'): October - February
 * - Semester B (ב'): March - June
 * - Summer: July - September
 */

import { SemesterType } from "@prisma/client";

export interface SemesterSuggestion {
  type: SemesterType;
  year: number; // Academic year (e.g., 2024 for תשפ"ה which is 2024-2025)
  name: string; // e.g., "סמסטר א' תשפ"ה"
}

export interface SuggestedSemester {
  suggested: SemesterSuggestion;
  alternatives?: SemesterSuggestion[];
}

/**
 * Hebrew year letters mapping
 */
const HEBREW_YEAR_LETTERS: Record<number, string> = {
  2020: "תשפ״א",
  2021: "תשפ״ב",
  2022: "תשפ״ג",
  2023: "תשפ״ד",
  2024: "תשפ״ה",
  2025: "תשפ״ו",
  2026: "תשפ״ז",
  2027: "תשפ״ח",
  2028: "תשפ״ט",
  2029: "תש״צ",
  2030: "תשצ״א",
};

/**
 * Get Hebrew year name for academic year
 */
export function getHebrewYearName(academicYear: number): string {
  return HEBREW_YEAR_LETTERS[academicYear] || `${academicYear}`;
}

/**
 * Get semester type display name in Hebrew
 */
export function getSemesterTypeName(type: SemesterType): string {
  switch (type) {
    case "A":
      return "סמסטר א'";
    case "B":
      return "סמסטר ב'";
    case "SUMMER":
      return "סמסטר קיץ";
  }
}

/**
 * Generate full semester name
 */
export function getSemesterFullName(type: SemesterType, year: number): string {
  return `${getSemesterTypeName(type)} ${getHebrewYearName(year)}`;
}

/**
 * Get academic year for a given date
 * Academic year starts in September/October
 * e.g., October 2024 - August 2025 = academic year 2024 (תשפ"ה)
 */
export function getAcademicYear(date: Date = new Date()): number {
  const month = date.getMonth(); // 0-11
  const year = date.getFullYear();

  // September onwards = next academic year
  if (month >= 8) {
    // September = 8
    return year;
  }
  // January-August = previous academic year
  return year - 1;
}

/**
 * Suggest current semester based on date
 * Returns suggested semester and alternatives if near boundary
 */
export function suggestCurrentSemester(
  date: Date = new Date()
): SuggestedSemester {
  const month = date.getMonth(); // 0-11
  const academicYear = getAcademicYear(date);

  // Clear zones - single suggestion
  // November-January = Semester A (clear)
  if (month >= 10 || month === 0) {
    return {
      suggested: {
        type: "A",
        year: academicYear,
        name: getSemesterFullName("A", academicYear),
      },
    };
  }

  // April-May = Semester B (clear)
  if (month >= 3 && month <= 4) {
    return {
      suggested: {
        type: "B",
        year: academicYear,
        name: getSemesterFullName("B", academicYear),
      },
    };
  }

  // Ambiguous zones - offer alternatives

  // February-March = End of A / Start of B
  if (month >= 1 && month <= 2) {
    return {
      suggested: {
        type: "B",
        year: academicYear,
        name: getSemesterFullName("B", academicYear),
      },
      alternatives: [
        {
          type: "A",
          year: academicYear,
          name: getSemesterFullName("A", academicYear),
        },
      ],
    };
  }

  // June = End of B / Start of Summer
  if (month === 5) {
    return {
      suggested: {
        type: "B",
        year: academicYear,
        name: getSemesterFullName("B", academicYear),
      },
      alternatives: [
        {
          type: "SUMMER",
          year: academicYear,
          name: getSemesterFullName("SUMMER", academicYear),
        },
      ],
    };
  }

  // July-August = Summer
  if (month >= 6 && month <= 7) {
    return {
      suggested: {
        type: "SUMMER",
        year: academicYear,
        name: getSemesterFullName("SUMMER", academicYear),
      },
    };
  }

  // September-October = End of Summer / Start of A (next year)
  if (month >= 8 && month <= 9) {
    const nextAcademicYear = academicYear;
    return {
      suggested: {
        type: "A",
        year: nextAcademicYear,
        name: getSemesterFullName("A", nextAcademicYear),
      },
      alternatives: [
        {
          type: "SUMMER",
          year: academicYear - 1,
          name: getSemesterFullName("SUMMER", academicYear - 1),
        },
      ],
    };
  }

  // Fallback
  return {
    suggested: {
      type: "A",
      year: academicYear,
      name: getSemesterFullName("A", academicYear),
    },
  };
}

/**
 * Get approximate start date for a semester
 */
export function getSemesterStartDate(
  type: SemesterType,
  academicYear: number
): Date {
  switch (type) {
    case "A":
      return new Date(academicYear, 9, 1); // October 1
    case "B":
      return new Date(academicYear + 1, 2, 1); // March 1 (next calendar year)
    case "SUMMER":
      return new Date(academicYear + 1, 6, 1); // July 1
  }
}

/**
 * Get approximate end date for a semester
 */
export function getSemesterEndDate(
  type: SemesterType,
  academicYear: number
): Date {
  switch (type) {
    case "A":
      return new Date(academicYear + 1, 1, 28); // End of February
    case "B":
      return new Date(academicYear + 1, 5, 30); // End of June
    case "SUMMER":
      return new Date(academicYear + 1, 8, 30); // End of September
  }
}
