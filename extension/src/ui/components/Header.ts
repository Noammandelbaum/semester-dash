/**
 * Header Component
 *
 * App header with logo, semester name, and actions
 */

import { createButton, createIconButton } from './Button';

export interface HeaderOptions {
  semesterName?: string;
  lastSyncTime?: string;
  onSync?: () => void;
  onSettings?: () => void;
  onBack?: () => void;
  showBackButton?: boolean;
  title?: string;
}

/**
 * Create the main app header
 */
export function createHeader(options: HeaderOptions = {}): HTMLElement {
  const {
    semesterName = '',
    lastSyncTime,
    onSync,
    onSettings,
    onBack,
    showBackButton = false,
    title = 'SemesterHub',
  } = options;

  const header = document.createElement('header');
  header.className = 'sh-header';

  // Left side: Logo/Title or Back button
  const leftSection = document.createElement('div');
  leftSection.className = 'sh-header-left';

  if (showBackButton && onBack) {
    const backBtn = createButton('← חזרה', onBack, { variant: 'ghost', size: 'sm' });
    leftSection.appendChild(backBtn);
  }

  const titleEl = document.createElement('h1');
  titleEl.className = 'sh-header-title';
  titleEl.textContent = title;
  leftSection.appendChild(titleEl);

  if (semesterName) {
    const subtitleEl = document.createElement('span');
    subtitleEl.className = 'sh-header-subtitle';
    subtitleEl.textContent = semesterName;
    leftSection.appendChild(subtitleEl);
  }

  header.appendChild(leftSection);

  // Right side: Actions
  const rightSection = document.createElement('div');
  rightSection.className = 'sh-header-actions';

  if (lastSyncTime) {
    const syncTime = document.createElement('span');
    syncTime.className = 'sh-header-sync-time';
    syncTime.textContent = `עדכון אחרון: ${lastSyncTime}`;
    rightSection.appendChild(syncTime);
  }

  if (onSync) {
    const syncBtn = createButton('סנכרון', onSync, {
      variant: 'secondary',
      size: 'sm',
      icon: '🔄',
    });
    syncBtn.classList.add('sh-header-sync-btn');
    rightSection.appendChild(syncBtn);
  }

  if (onSettings) {
    const settingsBtn = createIconButton('⚙️', onSettings, 'הגדרות');
    rightSection.appendChild(settingsBtn);
  }

  header.appendChild(rightSection);

  return header;
}

/**
 * Create a simple page header (for settings, etc.)
 */
export function createPageHeader(
  title: string,
  onBack?: () => void
): HTMLElement {
  const header = document.createElement('div');
  header.className = 'sh-page-header';

  if (onBack) {
    const backBtn = createButton('← חזרה', onBack, { variant: 'ghost', size: 'sm' });
    header.appendChild(backBtn);
  }

  const titleEl = document.createElement('h2');
  titleEl.className = 'sh-page-title';
  titleEl.textContent = title;
  header.appendChild(titleEl);

  return header;
}
