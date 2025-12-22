/**
 * Content Injector for SemesterHub
 *
 * Injects and manages the SemesterHub container in Moodle pages.
 * When our tab is active, we hide Moodle content and show ours.
 * When another tab is clicked, we restore Moodle content.
 */

// ========================================
// Constants
// ========================================

const CONTAINER_ID = 'semesterhub-root';
const ACTIVE_CLASS = 'semesterhub-active';
const STYLES_ID = 'semesterhub-styles';

// Moodle content selectors to hide when SemesterHub is active
const MOODLE_CONTENT_SELECTORS = [
  '#page-content',
  '#region-main',
  '#region-main-box',
  '[role="main"]',
  '#page-wrapper > #page',       // JCT specific
  '.pagelayout-mydashboard #page-content',
  '#topofscroll',
];

// ========================================
// State
// ========================================

let contentContainer: HTMLDivElement | null = null;
let stylesInjected = false;

// ========================================
// CSS Injection
// ========================================

/**
 * Inject critical CSS styles into the page
 * This is necessary because content scripts can't use CSS imports
 */
export function injectStyles(): void {
  if (stylesInjected || document.getElementById(STYLES_ID)) {
    return;
  }

  const style = document.createElement('style');
  style.id = STYLES_ID;
  style.textContent = `
    /* Hide SemesterHub container by default */
    #${CONTAINER_ID} {
      display: none !important;
    }

    /* When SemesterHub is active - show our container */
    body.${ACTIVE_CLASS} #${CONTAINER_ID} {
      display: block !important;
      position: relative;
      z-index: 100;
      background: #f9fafb;
      min-height: calc(100vh - 60px);
      padding: 1.5rem;
      direction: rtl;
      font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
    }

    /* Hide ALL Moodle content when SemesterHub is active */
    body.${ACTIVE_CLASS} #page-content,
    body.${ACTIVE_CLASS} #region-main,
    body.${ACTIVE_CLASS} #region-main-box,
    body.${ACTIVE_CLASS} [role="main"],
    body.${ACTIVE_CLASS} #topofscroll,
    body.${ACTIVE_CLASS} .drawer-toggles,
    body.${ACTIVE_CLASS} #page > .drawers {
      display: none !important;
    }

    /* Keep only the navbar visible */
    body.${ACTIVE_CLASS} #page-wrapper,
    body.${ACTIVE_CLASS} #page {
      display: block !important;
    }

    /* Spinner animation */
    @keyframes sh-spin {
      to { transform: rotate(360deg); }
    }

    #${CONTAINER_ID} .sh-spinner {
      width: 48px;
      height: 48px;
      border: 4px solid #e5e7eb;
      border-top-color: #0f766e;
      border-radius: 50%;
      animation: sh-spin 1s linear infinite;
    }

    #${CONTAINER_ID} .sh-loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 300px;
      gap: 1rem;
    }

    #${CONTAINER_ID} .sh-loading p {
      color: #4b5563;
      font-size: 1.125rem;
    }
  `;

  document.head.appendChild(style);
  stylesInjected = true;
  console.log('[SemesterHub] Styles injected. Style element:', document.getElementById(STYLES_ID));
}

// ========================================
// Container Injection
// ========================================

/**
 * Inject the SemesterHub content container into the page
 * @returns The injected container, or null if injection failed
 */
export function injectContentArea(): HTMLDivElement | null {
  // Inject styles first
  injectStyles();

  // Don't inject twice
  if (contentContainer && document.contains(contentContainer)) {
    console.log('[SemesterHub] Content area already injected');
    return contentContainer;
  }

  // Create the container
  contentContainer = document.createElement('div');
  contentContainer.id = CONTAINER_ID;
  contentContainer.setAttribute('dir', 'rtl');
  contentContainer.setAttribute('lang', 'he');

  // Initial loading state
  contentContainer.innerHTML = `
    <div class="sh-loading">
      <div class="sh-spinner"></div>
      <p>טוען...</p>
    </div>
  `;

  // Find where to inject
  const insertionPoint = findInsertionPoint();

  if (insertionPoint && insertionPoint.parentNode) {
    // Insert BEFORE the insertion point (as a sibling)
    insertionPoint.parentNode.insertBefore(contentContainer, insertionPoint);
    console.log('[SemesterHub] Content area injected before:', insertionPoint.id || insertionPoint.className);
  } else {
    // Fallback: append to #page or body
    const page = document.querySelector('#page');
    if (page) {
      page.appendChild(contentContainer);
      console.log('[SemesterHub] Content area appended to #page');
    } else {
      document.body.appendChild(contentContainer);
      console.log('[SemesterHub] Content area appended to body (fallback)');
    }
  }

  return contentContainer;
}

/**
 * Find the best place to inject our content container
 * We want to inject as a sibling of the main content area, not inside it
 *
 * JCT Structure:
 *   #page > .main-inner-wrapper > #topofscroll > #learnrpage > .contentwrapper
 *
 * General Moodle Structure:
 *   #page > #page-content > #region-main-box > #region-main
 */
function findInsertionPoint(): Element | null {
  // JCT specific: find #topofscroll and return it (we'll insert BEFORE it)
  const topofscroll = document.querySelector('#topofscroll');
  if (topofscroll) {
    console.log('[SemesterHub] Found #topofscroll, will insert before it');
    return topofscroll;
  }

  // General Moodle: find #page-content
  const pageContent = document.querySelector('#page-content');
  if (pageContent) {
    console.log('[SemesterHub] Found #page-content, will insert before it');
    return pageContent;
  }

  // Fallback: find #page and insert at the end
  const page = document.querySelector('#page');
  if (page) {
    console.log('[SemesterHub] Found #page, will append to it');
    return null; // Signal to use appendChild instead
  }

  return null;
}

// ========================================
// Container Management
// ========================================

/**
 * Remove the content container from the page
 */
export function removeContentArea(): void {
  if (contentContainer && document.contains(contentContainer)) {
    contentContainer.remove();
    console.log('[SemesterHub] Content area removed');
  }
  contentContainer = null;

  // Also remove active state
  document.body.classList.remove(ACTIVE_CLASS);
}

/**
 * Show our content container and hide Moodle content
 */
export function showContentArea(): void {
  // Ensure styles are injected
  injectStyles();

  document.body.classList.add(ACTIVE_CLASS);

  if (contentContainer) {
    contentContainer.style.display = 'block';
  }

  console.log('[SemesterHub] Content area shown, body class:', document.body.className);
}

/**
 * Hide our content container and restore Moodle content
 */
export function hideContentArea(): void {
  document.body.classList.remove(ACTIVE_CLASS);

  if (contentContainer) {
    contentContainer.style.display = 'none';
  }

  console.log('[SemesterHub] Content area hidden, Moodle restored');
}

/**
 * Check if SemesterHub content area is currently visible
 */
export function isContentAreaVisible(): boolean {
  return document.body.classList.contains(ACTIVE_CLASS);
}

/**
 * Get the content container element
 * @returns The container element, or null if not injected
 */
export function getContentContainer(): HTMLDivElement | null {
  return contentContainer;
}

/**
 * Set the content of the container
 * @param html - HTML string or element to set as content
 */
export function setContentAreaContent(content: string | HTMLElement): void {
  if (!contentContainer) {
    console.warn('[SemesterHub] Cannot set content: container not injected');
    return;
  }

  if (typeof content === 'string') {
    contentContainer.innerHTML = content;
  } else {
    contentContainer.innerHTML = '';
    contentContainer.appendChild(content);
  }
}

/**
 * Show loading state in the container
 * @param message - Optional loading message (default: "טוען...")
 */
export function showLoading(message = 'טוען...'): void {
  setContentAreaContent(`
    <div class="sh-loading">
      <div class="sh-spinner"></div>
      <p>${message}</p>
    </div>
  `);
}

/**
 * Show error state in the container
 * @param message - Error message to display
 */
export function showError(message: string): void {
  setContentAreaContent(`
    <div class="sh-error">
      <p class="sh-error-icon">⚠️</p>
      <p class="sh-error-message">${message}</p>
      <button class="sh-button sh-button-primary" onclick="location.reload()">
        נסה שוב
      </button>
    </div>
  `);
}
