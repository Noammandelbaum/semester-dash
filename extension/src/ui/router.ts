/**
 * Simple Router for SemesterHub
 *
 * Manages navigation between views within the injected content area.
 * Views: loading, onboarding, dashboard, settings
 */

import type { ViewName } from '../shared/types';

// ========================================
// Types
// ========================================

type ViewChangeCallback = (view: ViewName) => void;

// ========================================
// State
// ========================================

let currentView: ViewName = 'loading';
const viewChangeListeners: Set<ViewChangeCallback> = new Set();

// ========================================
// Navigation
// ========================================

/**
 * Navigate to a specific view
 * @param view - The view to navigate to
 */
export function navigate(view: ViewName): void {
  if (currentView === view) {
    console.log(`[SemesterHub Router] Already on view: ${view}`);
    return;
  }

  const previousView = currentView;
  currentView = view;

  console.log(`[SemesterHub Router] Navigating: ${previousView} → ${view}`);

  // Notify all listeners
  viewChangeListeners.forEach((callback) => {
    try {
      callback(view);
    } catch (error) {
      console.error('[SemesterHub Router] Error in view change callback:', error);
    }
  });
}

/**
 * Get the current view name
 * @returns The current view
 */
export function getCurrentView(): ViewName {
  return currentView;
}

/**
 * Subscribe to view change events
 * @param callback - Function to call when view changes
 * @returns Unsubscribe function
 */
export function onViewChange(callback: ViewChangeCallback): () => void {
  viewChangeListeners.add(callback);

  // Return unsubscribe function
  return () => {
    viewChangeListeners.delete(callback);
  };
}

// ========================================
// View Helpers
// ========================================

/**
 * Check if currently on a specific view
 * @param view - The view to check
 */
export function isOnView(view: ViewName): boolean {
  return currentView === view;
}

/**
 * Navigate back to dashboard (default view)
 */
export function goToDashboard(): void {
  navigate('dashboard');
}

/**
 * Navigate to settings
 */
export function goToSettings(): void {
  navigate('settings');
}

/**
 * Navigate to onboarding
 */
export function goToOnboarding(): void {
  navigate('onboarding');
}

/**
 * Show loading view
 */
export function showLoading(): void {
  navigate('loading');
}

// ========================================
// Reset
// ========================================

/**
 * Reset router state (for cleanup/testing)
 */
export function resetRouter(): void {
  currentView = 'loading';
  viewChangeListeners.clear();
}
