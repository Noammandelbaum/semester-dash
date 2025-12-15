/**
 * SemesterHub Extension Popup
 * Simple popup that links to the web app
 */

import { API_BASE_URL } from '@/shared/config';
import type { ExtensionMessage, SyncStatus } from '@/shared/types';

// DOM Elements
const openAppBtn = document.getElementById('open-app-btn') as HTMLButtonElement;
const lastSync = document.getElementById('last-sync')!;
const lastSyncTime = document.getElementById('last-sync-time')!;
const privacyLink = document.getElementById('privacy-link') as HTMLAnchorElement;
const termsLink = document.getElementById('terms-link') as HTMLAnchorElement;

/**
 * Initialize popup
 */
async function init(): Promise<void> {
  // Set up event listeners
  openAppBtn.addEventListener('click', handleOpenApp);

  // Set footer links
  privacyLink.href = `${API_BASE_URL}/privacy`;
  termsLink.href = `${API_BASE_URL}/terms`;

  // Check last sync time
  await checkLastSync();
}

/**
 * Open the web app (dashboard)
 */
function handleOpenApp(): void {
  chrome.tabs.create({ url: `${API_BASE_URL}/dashboard` });
  window.close();
}

/**
 * Check and display last sync time
 */
async function checkLastSync(): Promise<void> {
  try {
    const response = await sendMessage<SyncStatus>({ type: 'GET_STATUS' });

    if (response.lastSyncTime) {
      lastSync.classList.remove('hidden');
      lastSyncTime.textContent = formatRelativeTime(response.lastSyncTime);
    }
  } catch {
    // Ignore errors - just don't show last sync
  }
}

/**
 * Send message to background script
 */
async function sendMessage<T>(message: ExtensionMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(response as T);
    });
  });
}

/**
 * Format timestamp as relative time in Hebrew
 */
function formatRelativeTime(timestamp: string | number): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'הרגע';
  if (diffMins < 60) return `לפני ${diffMins} דקות`;
  if (diffHours < 24) return `לפני ${diffHours} שעות`;
  if (diffDays < 7) return `לפני ${diffDays} ימים`;

  return date.toLocaleDateString('he-IL');
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);
