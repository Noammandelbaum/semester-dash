/**
 * Loading Overlay Component for SemesterHub
 *
 * Full-screen loading indicator with message.
 * Used during async operations like syncing.
 */

// ========================================
// Types
// ========================================

export interface LoadingOverlayOptions {
  message?: string;
  showSpinner?: boolean;
}

// ========================================
// State
// ========================================

let overlayElement: HTMLDivElement | null = null;

// ========================================
// Create/Update
// ========================================

/**
 * Create the loading overlay element
 */
function createOverlay(options: LoadingOverlayOptions): HTMLDivElement {
  const overlay = document.createElement('div');
  overlay.id = 'semesterhub-loading-overlay';
  overlay.className = 'sh-loading-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.9);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    direction: rtl;
    opacity: 0;
    transition: opacity 0.2s ease;
  `;

  overlay.innerHTML = `
    <div class="sh-loading-content" style="
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    ">
      ${options.showSpinner !== false ? `
        <div class="sh-loading-spinner" style="
          width: 48px;
          height: 48px;
          border: 4px solid #e5e7eb;
          border-top-color: #0f766e;
          border-radius: 50%;
          animation: sh-spin 1s linear infinite;
        "></div>
      ` : ''}
      <p class="sh-loading-message" style="
        font-size: 16px;
        color: #374151;
        font-family: system-ui, -apple-system, sans-serif;
        margin: 0;
      ">${options.message || 'טוען...'}</p>
    </div>
  `;

  return overlay;
}

/**
 * Inject spinner animation styles
 */
function injectStyles(): void {
  if (document.getElementById('semesterhub-loading-styles')) return;

  const style = document.createElement('style');
  style.id = 'semesterhub-loading-styles';
  style.textContent = `
    @keyframes sh-spin {
      to {
        transform: rotate(360deg);
      }
    }
  `;

  document.head.appendChild(style);
}

// ========================================
// Public API
// ========================================

/**
 * Show loading overlay with message
 * @param message - Message to display
 */
export function showLoading(message: string = 'טוען...'): void {
  injectStyles();

  if (overlayElement) {
    // Update existing overlay
    updateLoadingMessage(message);
    return;
  }

  overlayElement = createOverlay({ message });
  document.body.appendChild(overlayElement);

  // Trigger animation
  requestAnimationFrame(() => {
    if (overlayElement) {
      overlayElement.style.opacity = '1';
    }
  });
}

/**
 * Hide loading overlay
 */
export function hideLoading(): void {
  if (!overlayElement) return;

  overlayElement.style.opacity = '0';

  setTimeout(() => {
    if (overlayElement) {
      overlayElement.remove();
      overlayElement = null;
    }
  }, 200);
}

/**
 * Update loading message
 * @param message - New message to display
 */
export function updateLoadingMessage(message: string): void {
  if (!overlayElement) return;

  const messageEl = overlayElement.querySelector('.sh-loading-message');
  if (messageEl) {
    messageEl.textContent = message;
  }
}

/**
 * Check if loading is visible
 */
export function isLoadingVisible(): boolean {
  return overlayElement !== null;
}

// ========================================
// Progress Variant
// ========================================

/**
 * Show loading with progress
 * @param current - Current step
 * @param total - Total steps
 * @param message - Optional message
 */
export function showLoadingProgress(
  current: number,
  total: number,
  message?: string
): void {
  const progressMessage = message
    ? `${message} (${current}/${total})`
    : `${current} מתוך ${total}`;

  showLoading(progressMessage);
}

// ========================================
// Export Component
// ========================================

export default {
  showLoading,
  hideLoading,
  updateLoadingMessage,
  isLoadingVisible,
  showLoadingProgress,
};
