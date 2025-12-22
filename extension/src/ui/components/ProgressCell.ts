/**
 * ProgressCell Component
 *
 * Individual assignment cell in the cumulative view.
 * Shows status: submitted (✓), pending (days until/since), closed without submission (—)
 *
 * Design rules (from ui-design.md):
 * - Submitted: ✓
 * - Future deadline: "בעוד X ימים"
 * - Past deadline (not submitted): "לפני X ימים" (no emphasis on lateness)
 * - Closed without submission: "—"
 * - No deadline yet: empty
 * - Bonus: same color at 40% opacity
 */

import type { AssignmentProgress, AssignmentStatus } from '../../shared/types';

export interface CellConfig {
  type: 'required' | 'bonus' | 'bonus-promoted';
  opacity: number;
}

export interface ProgressCellOptions {
  assignment?: AssignmentProgress;
  courseColor: string;
  cellConfig?: CellConfig;
  onClick?: (assignment: AssignmentProgress) => void;
}

/**
 * Calculate days difference from today
 */
function getDaysDiff(dateStr: string): number {
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Format days difference as text
 */
function formatDaysDiff(days: number): string {
  if (days === 0) return 'היום';
  if (days === 1) return 'מחר';
  if (days > 1) return `בעוד ${days} ימים`;
  if (days === -1) return 'אתמול';
  return `לפני ${Math.abs(days)} ימים`;
}

/**
 * Determine if assignment is closed (deadline passed and not submitted)
 */
function isClosed(assignment: AssignmentProgress): boolean {
  if (assignment.status === 'submitted') return false;
  if (!assignment.dueDate) return false;
  return getDaysDiff(assignment.dueDate) < 0;
}

/**
 * Get cell content based on assignment status
 */
function getCellContent(assignment: AssignmentProgress | undefined): {
  text: string;
  isCheckmark: boolean;
  isClosed: boolean;
  isEmpty: boolean;
} {
  // No assignment - empty cell
  if (!assignment) {
    return { text: '', isCheckmark: false, isClosed: false, isEmpty: true };
  }

  // Submitted - checkmark
  if (assignment.status === 'submitted') {
    return { text: '✓', isCheckmark: true, isClosed: false, isEmpty: false };
  }

  // No due date - empty
  if (!assignment.dueDate) {
    return { text: '', isCheckmark: false, isClosed: false, isEmpty: true };
  }

  const daysDiff = getDaysDiff(assignment.dueDate);

  // Closed without submission (status is already not 'submitted' at this point)
  if (daysDiff < 0) {
    return { text: '—', isCheckmark: false, isClosed: true, isEmpty: false };
  }

  // Future or past with pending status
  return {
    text: formatDaysDiff(daysDiff),
    isCheckmark: false,
    isClosed: false,
    isEmpty: false,
  };
}

/**
 * Create a progress cell element
 */
export function createProgressCell(options: ProgressCellOptions): HTMLElement {
  const { assignment, courseColor, cellConfig, onClick } = options;

  const cell = document.createElement('div');
  cell.className = 'sh-progress-cell';

  // Set background color
  cell.style.backgroundColor = courseColor;

  // Apply opacity based on cell config (bonus cells are 40% opacity)
  const isBonus = cellConfig?.type === 'bonus';
  const isFaded = isBonus || (assignment && isClosed(assignment) && assignment.status !== 'submitted');
  if (isFaded) {
    cell.style.opacity = '0.4';
    cell.classList.add('sh-cell-faded');
  }

  // If bonus-promoted (missed required turned bonus to required), mark it
  if (cellConfig?.type === 'bonus-promoted') {
    cell.classList.add('sh-cell-promoted');
  }

  // Get content
  const { text, isCheckmark, isEmpty } = getCellContent(assignment);

  // Create content element
  const content = document.createElement('span');
  content.className = 'sh-cell-content';

  if (isCheckmark) {
    content.classList.add('sh-cell-checkmark');
    content.textContent = text;
  } else if (!isEmpty) {
    content.classList.add('sh-cell-text');
    content.textContent = text;
  }

  cell.appendChild(content);

  // Add bonus label if applicable
  if (isBonus) {
    const bonusLabel = document.createElement('span');
    bonusLabel.className = 'sh-cell-bonus-label';
    bonusLabel.textContent = 'בונוס';
    cell.appendChild(bonusLabel);
  }

  // Click handler with tooltip
  if (assignment && onClick) {
    cell.classList.add('sh-cell-clickable');
    cell.addEventListener('click', () => onClick(assignment));
    cell.setAttribute('role', 'button');
    cell.setAttribute('tabindex', '0');
    cell.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick(assignment);
      }
    });
  }

  // Tooltip
  if (assignment) {
    cell.title = createTooltipText(assignment);
  }

  return cell;
}

/**
 * Create tooltip text for assignment
 */
function createTooltipText(assignment: AssignmentProgress): string {
  const lines: string[] = [assignment.name];

  if (assignment.sectionName) {
    lines.push(`יחידה: ${assignment.sectionName}`);
  }

  if (assignment.dueDate) {
    const date = new Date(assignment.dueDate);
    lines.push(`תאריך: ${date.toLocaleDateString('he-IL')}`);
    lines.push(`שעה: ${date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}`);
  }

  if (assignment.status === 'submitted') {
    lines.push('סטטוס: הוגש ✓');
  } else if (assignment.dueDate && getDaysDiff(assignment.dueDate) < 0) {
    lines.push('סטטוס: נסגר');
  } else {
    lines.push('סטטוס: פתוח להגשה');
  }

  return lines.join('\n');
}

/**
 * Create an empty cell (placeholder)
 */
export function createEmptyCell(courseColor: string, isBonus = false): HTMLElement {
  return createProgressCell({
    assignment: undefined,
    courseColor,
    cellConfig: isBonus ? { type: 'bonus', opacity: 0.4 } : undefined,
  });
}
