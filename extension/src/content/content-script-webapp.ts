/**
 * Content script for SemesterHub webapp
 * Enables communication between webapp and extension
 *
 * CSP-Safe Detection: Instead of injecting inline scripts (blocked by CSP),
 * we use a hidden DOM element that the webapp can detect.
 */

const EXTENSION_VERSION = '1.0.5';

// Create a hidden marker element in the DOM (CSP-safe)
const marker = document.createElement('div');
marker.id = 'semesterhub-extension-marker';
marker.setAttribute('data-version', EXTENSION_VERSION);
marker.setAttribute('data-ready', 'true');
marker.style.display = 'none';
document.documentElement.appendChild(marker);

// Dispatch custom event on document (CSP-safe - no inline script needed)
document.dispatchEvent(
  new CustomEvent('semesterhub-extension-ready', {
    detail: { version: EXTENSION_VERSION },
  })
);

console.log(`[SemesterHub] Content script loaded - version ${EXTENSION_VERSION}`);

// Listen for sync requests from webapp (via custom events)
window.addEventListener('semesterhub-webapp-command', (event: Event) => {
  const customEvent = event as CustomEvent<{ action: string }>;
  console.log('[SemesterHub] Received command from webapp:', customEvent.detail);

  if (customEvent.detail.action === 'openMoodleAndSync') {
    // Send message to background script to open Moodle
    chrome.runtime.sendMessage({
      type: 'WEBAPP_SYNC_REQUEST',
      payload: customEvent.detail,
    });
  }
});

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'SYNC_COMPLETE') {
    // Dispatch event on document (CSP-safe)
    document.dispatchEvent(
      new CustomEvent('semesterhub-sync-complete', {
        detail: message.payload,
      })
    );
  }
});
