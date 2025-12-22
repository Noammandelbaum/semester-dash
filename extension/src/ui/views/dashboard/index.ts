/**
 * Dashboard View
 *
 * Main view showing the cumulative progress across all courses
 */

import type { SemesterData, CourseWithMeta, AssignmentProgress } from '../../../shared/types';
import { createHeader } from '../../components/Header';
import { createCumulativeView, showAssignmentDetailModal } from './CumulativeView';
import { createSpinner } from '../../components/Spinner';

// ========================================
// Types
// ========================================

export interface DashboardData {
  semester: SemesterData;
  onSync: () => Promise<void>;
  onEditCourse: (course: CourseWithMeta, updates: Partial<CourseWithMeta>) => void;
  onSettings: () => void;
  onEditCourses?: () => void;
}

interface DashboardState {
  isSyncing: boolean;
  lastSyncTime: string | null;
  error: string | null;
}

// ========================================
// State
// ========================================

let state: DashboardState = {
  isSyncing: false,
  lastSyncTime: null,
  error: null,
};

let containerRef: HTMLElement | null = null;
let dataRef: DashboardData | null = null;

// ========================================
// Helpers
// ========================================

/**
 * Format time for display
 */
function formatLastSyncTime(dateStr: string | null): string {
  if (!dateStr) return '';

  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'עכשיו';
  if (diffMins < 60) return `לפני ${diffMins} דקות`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `לפני ${diffHours} שעות`;

  return date.toLocaleDateString('he-IL', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ========================================
// Rendering
// ========================================

/**
 * Render the dashboard
 */
function render(): void {
  if (!containerRef || !dataRef) return;

  containerRef.innerHTML = '';
  containerRef.className = 'sh-dashboard';

  // Header
  const header = createHeader({
    title: 'SemesterHub',
    semesterName: dataRef.semester.name,
    lastSyncTime: formatLastSyncTime(state.lastSyncTime || dataRef.semester.lastSyncedAt),
    onSync: handleSync,
    onSettings: dataRef.onSettings,
  });
  containerRef.appendChild(header);

  // Main content
  const main = document.createElement('main');
  main.className = 'sh-dashboard-main';

  if (state.isSyncing) {
    // Show loading
    const loading = createSpinner({ message: 'מסנכרן נתונים...' });
    main.appendChild(loading);
  } else if (state.error) {
    // Show error
    const errorEl = document.createElement('div');
    errorEl.className = 'sh-error';
    errorEl.innerHTML = `
      <div class="sh-error-icon">⚠️</div>
      <p class="sh-error-message">${state.error}</p>
    `;
    main.appendChild(errorEl);
  } else {
    // Show cumulative view
    const cumulativeView = createCumulativeView({
      semester: dataRef.semester,
      onCourseEdit: dataRef.onEditCourse,
      onAssignmentClick: handleAssignmentClick,
    });
    main.appendChild(cumulativeView);
  }

  containerRef.appendChild(main);

  // Footer
  const footer = document.createElement('footer');
  footer.className = 'sh-footer';

  const lastSyncSpan = document.createElement('span');
  lastSyncSpan.textContent = `עדכון אחרון: ${formatLastSyncTime(state.lastSyncTime || dataRef.semester.lastSyncedAt)}`;
  footer.appendChild(lastSyncSpan);

  const versionSpan = document.createElement('span');
  versionSpan.textContent = 'SemesterHub v1.0';
  footer.appendChild(versionSpan);

  containerRef.appendChild(footer);
}

// ========================================
// Event Handlers
// ========================================

async function handleSync(): Promise<void> {
  if (!dataRef || state.isSyncing) return;

  state = { ...state, isSyncing: true, error: null };
  render();

  try {
    await dataRef.onSync();
    state = {
      ...state,
      isSyncing: false,
      lastSyncTime: new Date().toISOString(),
    };
  } catch (error) {
    state = {
      ...state,
      isSyncing: false,
      error: error instanceof Error ? error.message : 'שגיאה בסנכרון',
    };
  }

  render();
}

function handleAssignmentClick(assignment: AssignmentProgress): void {
  showAssignmentDetailModal(assignment);
}

// ========================================
// Main Export
// ========================================

/**
 * Render the dashboard view
 */
export function renderDashboard(container: HTMLElement, data: DashboardData): void {
  containerRef = container;
  dataRef = data;

  state = {
    isSyncing: false,
    lastSyncTime: data.semester.lastSyncedAt,
    error: null,
  };

  render();
}

/**
 * Update dashboard with new data (for reactivity)
 */
export function updateDashboard(data: Partial<DashboardData>): void {
  if (!dataRef) return;

  dataRef = { ...dataRef, ...data };
  render();
}

/**
 * Reset dashboard state
 */
export function resetDashboard(): void {
  state = {
    isSyncing: false,
    lastSyncTime: null,
    error: null,
  };
  containerRef = null;
  dataRef = null;
}
