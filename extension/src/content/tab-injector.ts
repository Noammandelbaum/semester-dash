/**
 * Tab Injection for SemesterHub
 *
 * Injects a "SemesterHub" tab into Moodle's navigation bar.
 * When clicked, dispatches a custom event for the UI to handle.
 */

// ========================================
// Constants
// ========================================

const TAB_KEY = 'semesterhub';
const TAB_EVENT = 'semesterhub-tab-clicked';
const NAV_SELECTOR = 'ul.nav.more-nav.navbar-nav';

// Brand colors
const BRAND_TEAL = '#0f766e';
const BRAND_ORANGE = '#ff6b35';

// ========================================
// State
// ========================================

let injectedTab: HTMLLIElement | null = null;

// ========================================
// Tab Injection
// ========================================

/**
 * Inject SemesterHub tab into Moodle navigation
 * @returns The injected tab element, or null if injection failed
 */
export function injectTab(): HTMLLIElement | null {
  // Don't inject twice
  if (injectedTab && document.contains(injectedTab)) {
    console.log('[SemesterHub] Tab already injected');
    return injectedTab;
  }

  // Find the navigation bar
  const navBar = document.querySelector<HTMLUListElement>(NAV_SELECTOR);
  if (!navBar) {
    console.warn('[SemesterHub] Navigation bar not found');
    return null;
  }

  // Create the tab element
  const tab = createTabElement();

  // Insert as FIRST item in navigation (universal - works for all institutions)
  // Use prepend to ensure it's always first, regardless of institution's nav structure
  navBar.prepend(tab);

  // Force Moodle to NOT move this to "more options" dropdown
  // by setting data attribute and using MutationObserver to keep it in place
  preventMoreMenuMove(tab, navBar);

  injectedTab = tab;
  console.log('[SemesterHub] Tab injected successfully');
  return tab;
}

/**
 * Create the tab HTML element
 */
function createTabElement(): HTMLLIElement {
  const li = document.createElement('li');
  li.setAttribute('data-key', TAB_KEY);
  li.className = 'nav-item';
  li.setAttribute('role', 'none');
  li.setAttribute('data-forceintomoremenu', 'false');

  const a = document.createElement('a');
  a.setAttribute('role', 'menuitem');
  a.className = 'nav-link semesterhub-tab';
  a.href = '#';
  a.setAttribute('tabindex', '-1');
  a.innerHTML = '📊 SemesterHub';

  // Apply brand styling
  a.style.cssText = `
    background: ${BRAND_TEAL} !important;
    color: white !important;
    border-radius: 6px;
    margin: 2px 4px;
    padding: 6px 12px !important;
    font-weight: 600;
    transition: all 0.2s ease;
  `;

  // Hover effect
  a.addEventListener('mouseenter', () => {
    a.style.background = `${BRAND_ORANGE} !important`;
    a.style.transform = 'scale(1.02)';
  });
  a.addEventListener('mouseleave', () => {
    a.style.background = `${BRAND_TEAL} !important`;
    a.style.transform = 'scale(1)';
  });

  // Prevent default navigation and dispatch custom event
  a.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Dispatch custom event for the UI to handle
    const event = new CustomEvent(TAB_EVENT, {
      bubbles: true,
      detail: { timestamp: Date.now() }
    });
    document.dispatchEvent(event);

    console.log('[SemesterHub] Tab clicked, event dispatched');
  });

  li.appendChild(a);
  return li;
}

// ========================================
// Prevent Moodle "More Menu" Movement
// ========================================

/**
 * Prevent Moodle from moving our tab to the "more options" dropdown
 * Moodle's responsive JS checks item width and moves items to dropdown
 */
function preventMoreMenuMove(tab: HTMLLIElement, navBar: HTMLUListElement): void {
  // Set attribute that tells Moodle to never move this item
  tab.setAttribute('data-forceintomoremenu', 'false');

  // Watch for Moodle moving our tab and move it back
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      // Check if our tab was removed from the main nav
      if (mutation.type === 'childList' && mutation.removedNodes.length > 0) {
        for (const node of mutation.removedNodes) {
          if (node === tab) {
            // Moodle moved it - put it back as first item
            console.log('[SemesterHub] Tab was moved, restoring position');
            navBar.prepend(tab);
            return;
          }
        }
      }
    }
  });

  observer.observe(navBar, { childList: true });

  // Also observe the "more" dropdown in case it gets moved there
  const moreDropdown = navBar.querySelector('[data-region="moredropdown"]');
  if (moreDropdown) {
    const dropdownObserver = new MutationObserver(() => {
      // Check if our tab is in the dropdown
      const tabInDropdown = moreDropdown.querySelector(`[data-key="${TAB_KEY}"]`);
      if (tabInDropdown) {
        console.log('[SemesterHub] Tab found in dropdown, moving back');
        navBar.prepend(tab);
      }
    });
    dropdownObserver.observe(moreDropdown, { childList: true, subtree: true });
  }
}

// ========================================
// Tab Removal
// ========================================

/**
 * Remove the injected tab from navigation
 */
export function removeTab(): void {
  if (injectedTab && document.contains(injectedTab)) {
    injectedTab.remove();
    console.log('[SemesterHub] Tab removed');
  }
  injectedTab = null;
}

// ========================================
// Tab State Management
// ========================================

/**
 * Set the active state of the SemesterHub tab
 * @param active - Whether the tab should appear active
 */
export function setTabActive(active: boolean): void {
  if (!injectedTab) {
    console.warn('[SemesterHub] Cannot set active state: tab not injected');
    return;
  }

  const link = injectedTab.querySelector<HTMLAnchorElement>('a.nav-link');
  if (!link) return;

  if (active) {
    link.classList.add('active');
    link.setAttribute('aria-current', 'true');
    link.setAttribute('tabindex', '0');

    // Remove active from other tabs
    const navBar = injectedTab.closest(NAV_SELECTOR);
    if (navBar) {
      navBar.querySelectorAll<HTMLAnchorElement>('a.nav-link').forEach((otherLink) => {
        if (otherLink !== link) {
          otherLink.classList.remove('active');
          otherLink.removeAttribute('aria-current');
          otherLink.setAttribute('tabindex', '-1');
        }
      });
    }
  } else {
    link.classList.remove('active');
    link.removeAttribute('aria-current');
    link.setAttribute('tabindex', '-1');
  }
}

/**
 * Check if the SemesterHub tab is currently active
 */
export function isTabActive(): boolean {
  if (!injectedTab) return false;
  const link = injectedTab.querySelector<HTMLAnchorElement>('a.nav-link');
  return link?.classList.contains('active') ?? false;
}

/**
 * Get the injected tab element (for testing/debugging)
 */
export function getInjectedTab(): HTMLLIElement | null {
  return injectedTab;
}
