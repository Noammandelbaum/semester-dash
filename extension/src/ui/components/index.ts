/**
 * UI Components Index
 *
 * Re-exports all UI components for easy importing
 */

export { createButton, createIconButton, type ButtonVariant, type ButtonSize, type ButtonOptions } from './Button';
export { createSpinner, createInlineSpinner, type SpinnerSize, type SpinnerOptions } from './Spinner';
export { createModal, showModal, hideModal, showConfirmModal, type ModalOptions } from './Modal';
export {
  createInput,
  createSelect,
  createCheckbox,
  getInputValue,
  getCheckboxValue,
  setInputValue,
  type InputOptions,
  type SelectOption,
  type SelectOptions,
  type CheckboxOptions,
} from './Input';
export { createHeader, createPageHeader, type HeaderOptions } from './Header';
export { createProgressCell, createEmptyCell, type CellConfig, type ProgressCellOptions } from './ProgressCell';
export { createCourseColumn, createRowNumbers, type CourseColumnOptions } from './CourseColumn';
export {
  showLoading,
  hideLoading,
  updateLoadingMessage,
  isLoadingVisible,
  showLoadingProgress,
  type LoadingOverlayOptions,
} from './LoadingOverlay';
