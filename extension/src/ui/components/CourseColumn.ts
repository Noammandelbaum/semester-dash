/**
 * CourseColumn Component
 *
 * A column representing a single course in the cumulative view.
 * Shows course name, credits, weight, progress cells for assignments.
 */

import type { CourseWithMeta, AssignmentProgress } from '../../shared/types';
import { createProgressCell, type CellConfig } from './ProgressCell';

export interface CourseColumnOptions {
  course: CourseWithMeta;
  assignments: AssignmentProgress[];
  maxRows: number;
  onCourseClick?: (course: CourseWithMeta) => void;
  onAssignmentClick?: (assignment: AssignmentProgress) => void;
}

/**
 * Count how many required assignments were missed (closed without submission)
 */
function countMissedRequired(
  assignments: AssignmentProgress[],
  requiredCount: number
): number {
  // Get assignments sorted by order
  const sorted = [...assignments].sort((a, b) => a.orderInCourse - b.orderInCourse);

  let missed = 0;
  for (let i = 0; i < Math.min(requiredCount, sorted.length); i++) {
    const assignment = sorted[i];
    if (assignment.dueDate) {
      const isPast = new Date(assignment.dueDate) < new Date();
      if (isPast && assignment.status !== 'submitted') {
        missed++;
      }
    }
  }

  return missed;
}

/**
 * Calculate cell configurations for a course
 * Handles bonus promotion when required assignments are missed
 */
function calculateCellConfigs(
  course: CourseWithMeta,
  assignments: AssignmentProgress[]
): CellConfig[] {
  const total = course.totalAssignments ?? 13; // Default: 13 weeks
  const required = course.requiredAssignments ?? total;
  const bonus = total - required;

  // Count how many required we missed
  const missedRequired = countMissedRequired(assignments, required);

  // Adjust counts
  const adjustedRequired = required - missedRequired;
  const promotedBonus = missedRequired; // Bonuses that became required
  const remainingBonus = Math.max(0, bonus - missedRequired);

  const configs: CellConfig[] = [];

  // Regular required cells
  for (let i = 0; i < adjustedRequired; i++) {
    configs.push({ type: 'required', opacity: 1 });
  }

  // Promoted bonus cells (were bonus, now required)
  for (let i = 0; i < promotedBonus; i++) {
    configs.push({ type: 'bonus-promoted', opacity: 1 });
  }

  // Regular bonus cells
  for (let i = 0; i < remainingBonus; i++) {
    configs.push({ type: 'bonus', opacity: 0.4 });
  }

  return configs;
}

/**
 * Calculate completion percentage
 */
function calculateProgress(assignments: AssignmentProgress[], requiredCount: number): number {
  const submitted = assignments.filter((a) => a.status === 'submitted').length;
  if (requiredCount === 0) return 0;
  return Math.round((submitted / requiredCount) * 100);
}

/**
 * Create a course column element
 */
export function createCourseColumn(options: CourseColumnOptions): HTMLElement {
  const { course, assignments, maxRows, onCourseClick, onAssignmentClick } = options;

  const column = document.createElement('div');
  column.className = 'sh-course-column';
  column.style.setProperty('--course-color', course.color);

  // Header section
  const header = document.createElement('div');
  header.className = 'sh-column-header';
  header.style.backgroundColor = course.color;

  if (onCourseClick) {
    header.classList.add('sh-column-header-clickable');
    header.addEventListener('click', () => onCourseClick(course));
    header.setAttribute('role', 'button');
    header.setAttribute('tabindex', '0');
    header.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onCourseClick(course);
      }
    });
  }

  // Course name
  const nameEl = document.createElement('div');
  nameEl.className = 'sh-column-name';
  nameEl.textContent = course.name;
  nameEl.title = course.name;
  header.appendChild(nameEl);

  // Meta row (credits + weight)
  const metaEl = document.createElement('div');
  metaEl.className = 'sh-column-meta';

  if (course.credits) {
    const creditsEl = document.createElement('span');
    creditsEl.textContent = `${course.credits} נ"ז`;
    metaEl.appendChild(creditsEl);
  }

  if (course.assignmentWeight) {
    const weightEl = document.createElement('span');
    weightEl.textContent = `${course.assignmentWeight}%`;
    metaEl.appendChild(weightEl);
  }

  if (metaEl.children.length > 0) {
    header.appendChild(metaEl);
  }

  // Progress bar
  const requiredCount = course.requiredAssignments ?? (course.totalAssignments ?? 13);
  const progress = calculateProgress(assignments, requiredCount);

  const progressContainer = document.createElement('div');
  progressContainer.className = 'sh-column-progress';

  const progressBar = document.createElement('div');
  progressBar.className = 'sh-column-progress-bar';
  progressBar.style.width = `${progress}%`;

  const progressText = document.createElement('span');
  progressText.className = 'sh-column-progress-text';
  progressText.textContent = `${progress}%`;

  progressContainer.appendChild(progressBar);
  progressContainer.appendChild(progressText);
  header.appendChild(progressContainer);

  column.appendChild(header);

  // Cells section
  const cellsContainer = document.createElement('div');
  cellsContainer.className = 'sh-column-cells';

  // Get cell configs
  const cellConfigs = calculateCellConfigs(course, assignments);

  // Sort assignments by order
  const sortedAssignments = [...assignments].sort(
    (a, b) => a.orderInCourse - b.orderInCourse
  );

  // Create cells
  for (let i = 0; i < maxRows; i++) {
    const assignment = sortedAssignments[i];
    const config = cellConfigs[i];

    const cell = createProgressCell({
      assignment,
      courseColor: course.color,
      cellConfig: config,
      onClick: onAssignmentClick,
    });

    cellsContainer.appendChild(cell);
  }

  column.appendChild(cellsContainer);

  return column;
}

/**
 * Create row numbers column (for the left side)
 */
export function createRowNumbers(maxRows: number): HTMLElement {
  const column = document.createElement('div');
  column.className = 'sh-row-numbers';

  // Empty header space
  const headerSpace = document.createElement('div');
  headerSpace.className = 'sh-row-numbers-header';
  column.appendChild(headerSpace);

  // Row numbers
  const numbersContainer = document.createElement('div');
  numbersContainer.className = 'sh-row-numbers-cells';

  for (let i = 1; i <= maxRows; i++) {
    const number = document.createElement('div');
    number.className = 'sh-row-number';
    number.textContent = String(i);
    numbersContainer.appendChild(number);
  }

  column.appendChild(numbersContainer);

  return column;
}
