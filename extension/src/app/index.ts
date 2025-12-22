/**
 * App Controllers Index
 *
 * Re-exports all app controllers for easy importing
 */

// Main app controller
export {
  initApp,
  getCurrentUser,
  isReady,
  triggerSync,
  updateSemester,
  setScrapedCourses,
  resetApp,
  storage,
  sync,
} from './app-controller';

// Onboarding controller
export {
  resetOnboardingState,
  getOnboardingState,
  setAvailableCoursesForOnboarding,
  toggleCourseSelection,
  getSelectedCourses,
  setCourseSections,
  toggleSectionSelection,
  setCourseMetadata,
  createSemester,
  completeOnboarding,
  startOnboarding,
  fetchSectionsForCourses,
} from './onboarding-controller';

// Dashboard controller
export {
  initDashboard,
  handleSync,
  isSyncing,
  handleEditCourse,
  updateCourseColor,
  updateCourseMetadata,
  updateAssignmentStatus,
  goToSettings,
  goToDashboard,
  refreshDashboard,
  getCurrentSemesterData,
  calculateStats,
} from './dashboard-controller';

// Error handler
export {
  handleError,
  handleErrorWithMessage,
  getErrorMessage,
  showErrorToast,
  showSuccessToast,
  showInfoToast,
  withErrorHandling,
  injectToastStyles,
} from './error-handler';
