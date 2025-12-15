/**
 * Content script for SemesterHub webapp
 * Enables communication between webapp and extension
 *
 * CSP-Safe Detection: Instead of injecting inline scripts (blocked by CSP),
 * we use a hidden DOM element that the webapp can detect.
 */

const EXTENSION_VERSION = '1.0.7';

console.log('[SemesterHub] Content script starting...');
console.log('[SemesterHub] Current URL:', window.location.href);

// Create a hidden marker element in the DOM (CSP-safe)
const marker = document.createElement('div');
marker.id = 'semesterhub-extension-marker';
marker.setAttribute('data-version', EXTENSION_VERSION);
marker.setAttribute('data-ready', 'true');
marker.style.display = 'none';

// Try to append to documentElement or body
const target = document.documentElement || document.body;
if (target) {
  target.appendChild(marker);
  console.log('[SemesterHub] Marker element created and appended to:', target.tagName);
  console.log('[SemesterHub] Marker element:', document.getElementById('semesterhub-extension-marker'));
} else {
  console.error('[SemesterHub] ERROR: No target element to append marker!');
}

// Dispatch custom event on document (CSP-safe - no inline script needed)
document.dispatchEvent(
  new CustomEvent('semesterhub-extension-ready', {
    detail: { version: EXTENSION_VERSION },
  })
);
console.log('[SemesterHub] Dispatched semesterhub-extension-ready event');

console.log(`[SemesterHub] Content script loaded - version ${EXTENSION_VERSION}`);

// Tell service worker about this webapp tab on init
chrome.runtime
  .sendMessage({
    type: 'SET_WEBAPP_TAB',
    payload: {},
  })
  .catch(() => {
    // Ignore if service worker not ready
    console.log('[SemesterHub] Service worker not ready yet');
  });

// Listen for sync requests from webapp (via custom events on document - shared with page)
document.addEventListener('semesterhub-webapp-command', async (event: Event) => {
  const customEvent = event as CustomEvent<{
    action: string;
    moodleUrl?: string;
    courses?: any[];
  }>;
  console.log('[SemesterHub] Received command from webapp:', customEvent.detail);

  try {
    switch (customEvent.detail.action) {
      case 'openMoodleAndGetCourses':
        await chrome.runtime.sendMessage({
          type: 'WEBAPP_OPEN_MOODLE_AND_GET_COURSES',
          payload: { moodleUrl: customEvent.detail.moodleUrl },
        });
        break;

      case 'getSectionsForCourses':
        await chrome.runtime.sendMessage({
          type: 'WEBAPP_GET_SECTIONS_FOR_COURSES',
          payload: {
            courses: customEvent.detail.courses,
            moodleUrl: customEvent.detail.moodleUrl,
          },
        });
        break;

      case 'syncSelectedCourses':
        await chrome.runtime.sendMessage({
          type: 'WEBAPP_SYNC_SELECTED_COURSES',
          payload: {
            courses: customEvent.detail.courses,
            moodleUrl: customEvent.detail.moodleUrl,
          },
        });
        break;

      case 'detectMoodleUrl':
        await chrome.runtime.sendMessage({
          type: 'WEBAPP_DETECT_MOODLE_URL',
        });
        break;

      case 'openMoodleAndSync':
        // Keep existing behavior for backward compatibility
        console.log('[SemesterHub] Sending WEBAPP_SYNC_REQUEST to background script...');

        const response = await chrome.runtime.sendMessage({
          type: 'WEBAPP_SYNC_REQUEST',
          payload: customEvent.detail,
        });

        console.log('[SemesterHub] Background script response:', response);

        // If the response indicates an error, notify the webapp
        if (response && !response.success) {
          document.dispatchEvent(
            new CustomEvent('semesterhub-sync-complete', {
              detail: {
                success: false,
                error: response.message || 'Sync failed',
              },
            })
          );
        }
        // If success, the background will send SYNC_COMPLETE message separately
        break;

      default:
        console.warn('[SemesterHub] Unknown webapp command:', customEvent.detail.action);
    }
  } catch (error) {
    console.error('[SemesterHub] Error sending command to service worker:', error);
    document.dispatchEvent(
      new CustomEvent('semesterhub-sync-complete', {
        detail: {
          success: false,
          error: 'Extension communication error',
        },
      })
    );
  }
});

// Listen for messages from service worker to forward to webapp
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'NOTIFY_WEBAPP') {
    const { eventName, data } = message.payload;
    console.log('[SemesterHub] Forwarding event to webapp:', eventName, data);

    // Dispatch event to webapp
    document.dispatchEvent(new CustomEvent(eventName, { detail: data }));

    sendResponse({ success: true });
    return true; // Keep channel open for async response
  }

  // Keep backward compatibility with SYNC_COMPLETE
  if (message.type === 'SYNC_COMPLETE') {
    // Dispatch event on document (CSP-safe)
    document.dispatchEvent(
      new CustomEvent('semesterhub-sync-complete', {
        detail: message.payload,
      })
    );
  }

  return true;
});
