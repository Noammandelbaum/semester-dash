/**
 * CumulativeView Component
 *
 * The main dashboard view showing all courses in columns with progress cells.
 * Follows the design from ui-design.md.
 */

import type { SemesterData, CourseWithMeta, AssignmentProgress } from '../../../shared/types';
import { createCourseColumn, createRowNumbers } from '../../components/CourseColumn';
import { createModal, showModal, hideModal } from '../../components/Modal';
import { createInput, getInputValue } from '../../components/Input';
import { createButton } from '../../components/Button';

export interface CumulativeViewOptions {
  semester: SemesterData;
  onCourseEdit?: (course: CourseWithMeta, updates: Partial<CourseWithMeta>) => void;
  onAssignmentClick?: (assignment: AssignmentProgress) => void;
}

/**
 * Get maximum number of rows needed across all courses
 */
function getMaxRows(semester: SemesterData): number {
  const courseMaxes = semester.courses.map(
    (c) => c.totalAssignments ?? 13
  );
  return Math.max(...courseMaxes, 13);
}

/**
 * Get assignments for a specific course
 */
function getAssignmentsForCourse(
  semester: SemesterData,
  courseMoodleId: string
): AssignmentProgress[] {
  return semester.assignments.filter((a) => a.courseMoodleId === courseMoodleId);
}

/**
 * Create the cumulative view grid
 */
export function createCumulativeView(options: CumulativeViewOptions): HTMLElement {
  const { semester, onCourseEdit, onAssignmentClick } = options;

  const container = document.createElement('div');
  container.className = 'sh-cumulative-view';

  // If no courses, show empty state
  if (semester.courses.length === 0) {
    const emptyState = document.createElement('div');
    emptyState.className = 'sh-empty-state';
    emptyState.innerHTML = `
      <div class="sh-empty-icon">📚</div>
      <h3>אין קורסים עדיין</h3>
      <p>התחל את ה-Onboarding כדי להוסיף קורסים</p>
    `;
    container.appendChild(emptyState);
    return container;
  }

  const maxRows = getMaxRows(semester);

  // Grid container
  const grid = document.createElement('div');
  grid.className = 'sh-cumulative-grid';

  // Row numbers column (on the right for RTL)
  const rowNumbers = createRowNumbers(maxRows);
  grid.appendChild(rowNumbers);

  // Course columns
  semester.courses.forEach((course) => {
    const assignments = getAssignmentsForCourse(semester, course.moodleId);

    const column = createCourseColumn({
      course,
      assignments,
      maxRows,
      onCourseClick: onCourseEdit ? (c) => showCourseEditModal(c, onCourseEdit) : undefined,
      onAssignmentClick,
    });

    grid.appendChild(column);
  });

  container.appendChild(grid);

  return container;
}

/**
 * Show course edit modal
 */
function showCourseEditModal(
  course: CourseWithMeta,
  onSave: (course: CourseWithMeta, updates: Partial<CourseWithMeta>) => void
): void {
  const content = document.createElement('div');
  content.className = 'sh-course-edit-form';

  // Credits input
  const creditsInput = createInput('נקודות זכות', 'edit-credits', {
    type: 'number',
    value: course.credits ?? '',
    min: 0,
    max: 10,
    step: 0.5,
  });
  content.appendChild(creditsInput);

  // Weight input
  const weightInput = createInput('אחוז מהציון', 'edit-weight', {
    type: 'number',
    value: course.assignmentWeight ?? '',
    min: 0,
    max: 100,
  });
  content.appendChild(weightInput);

  // Total assignments
  const totalInput = createInput('סה"כ הגשות', 'edit-total', {
    type: 'number',
    value: course.totalAssignments ?? 13,
    min: 1,
    max: 30,
  });
  content.appendChild(totalInput);

  // Required assignments
  const requiredInput = createInput('הגשות חובה', 'edit-required', {
    type: 'number',
    value: course.requiredAssignments ?? '',
    min: 0,
    max: 30,
  });
  content.appendChild(requiredInput);

  // Actions
  const actions = document.createElement('div');
  actions.className = 'sh-modal-actions';

  let modalEl: HTMLElement;

  const saveBtn = createButton('שמירה', () => {
    const updates: Partial<CourseWithMeta> = {};

    const credits = getInputValue(creditsInput);
    if (credits) updates.credits = parseFloat(credits);

    const weight = getInputValue(weightInput);
    if (weight) updates.assignmentWeight = parseInt(weight, 10);

    const total = getInputValue(totalInput);
    if (total) updates.totalAssignments = parseInt(total, 10);

    const required = getInputValue(requiredInput);
    if (required) updates.requiredAssignments = parseInt(required, 10);

    // Validate
    if (
      updates.requiredAssignments !== undefined &&
      updates.totalAssignments !== undefined &&
      updates.requiredAssignments > updates.totalAssignments
    ) {
      alert('מספר הגשות החובה לא יכול להיות גדול ממספר ההגשות הכולל');
      return;
    }

    hideModal(modalEl);
    onSave(course, updates);
  }, { variant: 'primary' });

  const cancelBtn = createButton('ביטול', () => {
    hideModal(modalEl);
  }, { variant: 'secondary' });

  actions.appendChild(saveBtn);
  actions.appendChild(cancelBtn);
  content.appendChild(actions);

  modalEl = createModal(course.name, content, {
    showClose: true,
    closeOnBackdrop: true,
  });

  document.body.appendChild(modalEl);
  showModal(modalEl);
}

/**
 * Create assignment detail modal content
 */
export function showAssignmentDetailModal(assignment: AssignmentProgress): void {
  const content = document.createElement('div');
  content.className = 'sh-assignment-detail';

  // Status
  const statusEl = document.createElement('div');
  statusEl.className = 'sh-detail-row';

  const statusLabel = document.createElement('span');
  statusLabel.className = 'sh-detail-label';
  statusLabel.textContent = 'סטטוס:';
  statusEl.appendChild(statusLabel);

  const statusValue = document.createElement('span');
  statusValue.className = 'sh-detail-value';
  switch (assignment.status) {
    case 'submitted':
      statusValue.textContent = 'הוגש ✓';
      statusValue.classList.add('sh-status-submitted');
      break;
    case 'pending':
      statusValue.textContent = 'ממתין להגשה';
      statusValue.classList.add('sh-status-pending');
      break;
    case 'overdue':
      statusValue.textContent = 'עבר הזמן';
      statusValue.classList.add('sh-status-overdue');
      break;
    case 'not_required':
      statusValue.textContent = 'לא נדרש';
      statusValue.classList.add('sh-status-not-required');
      break;
  }
  statusEl.appendChild(statusValue);
  content.appendChild(statusEl);

  // Section
  if (assignment.sectionName) {
    const sectionEl = document.createElement('div');
    sectionEl.className = 'sh-detail-row';

    const sectionLabel = document.createElement('span');
    sectionLabel.className = 'sh-detail-label';
    sectionLabel.textContent = 'יחידה:';
    sectionEl.appendChild(sectionLabel);

    const sectionValue = document.createElement('span');
    sectionValue.className = 'sh-detail-value';
    sectionValue.textContent = assignment.sectionName;
    sectionEl.appendChild(sectionValue);

    content.appendChild(sectionEl);
  }

  // Due date
  if (assignment.dueDate) {
    const dateEl = document.createElement('div');
    dateEl.className = 'sh-detail-row';

    const dateLabel = document.createElement('span');
    dateLabel.className = 'sh-detail-label';
    dateLabel.textContent = 'תאריך הגשה:';
    dateEl.appendChild(dateLabel);

    const date = new Date(assignment.dueDate);
    const dateValue = document.createElement('span');
    dateValue.className = 'sh-detail-value';
    dateValue.textContent = date.toLocaleDateString('he-IL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    dateEl.appendChild(dateValue);

    content.appendChild(dateEl);
  }

  // Submitted at
  if (assignment.submittedAt) {
    const submittedEl = document.createElement('div');
    submittedEl.className = 'sh-detail-row';

    const submittedLabel = document.createElement('span');
    submittedLabel.className = 'sh-detail-label';
    submittedLabel.textContent = 'הוגש בתאריך:';
    submittedEl.appendChild(submittedLabel);

    const date = new Date(assignment.submittedAt);
    const submittedValue = document.createElement('span');
    submittedValue.className = 'sh-detail-value';
    submittedValue.textContent = date.toLocaleDateString('he-IL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    submittedEl.appendChild(submittedValue);

    content.appendChild(submittedEl);
  }

  const modal = createModal(assignment.name, content, {
    showClose: true,
    closeOnBackdrop: true,
  });

  document.body.appendChild(modal);
  showModal(modal);
}
