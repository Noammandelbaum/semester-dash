/**
 * Content script for SemesterHub webapp
 * Enables communication between webapp and extension
 *
 * Note: Content scripts run in an isolated world, so we inject a script
 * into the page to set window.__SEMESTERHUB_EXTENSION__
 */

// Inject script into page context to set global variable
const script = document.createElement('script');
script.textContent = `
  window.__SEMESTERHUB_EXTENSION__ = {
    version: '1.0.4',
    ready: true
  };
  window.dispatchEvent(new CustomEvent('semesterhub-extension-ready', {
    detail: { version: '1.0.4' }
  }));
  console.log('[SemesterHub] Extension detected - version 1.0.4');
`;
(document.head || document.documentElement).appendChild(script);
script.remove();

console.log('[SemesterHub] Content script loaded on webapp');

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
    // Inject event into page context
    const resultScript = document.createElement('script');
    resultScript.textContent = `
      window.dispatchEvent(new CustomEvent('semesterhub-sync-complete', {
        detail: ${JSON.stringify(message.payload)}
      }));
    `;
    (document.head || document.documentElement).appendChild(resultScript);
    resultScript.remove();
  }
});
