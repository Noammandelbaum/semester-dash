/**
 * SemesterHub Chrome Extension - Background Service Worker Entry Point
 *
 * This is the main entry point for the extension's background service worker.
 * It uses a modular architecture with separate handlers and services.
 */

import { lifecycleService } from './services/lifecycle.service';
import { statusService } from './services/status.service';
import { authHandler } from './handlers/auth.handler';
import { messageRouter } from './message-router';
import type { ExtensionMessage } from '../shared/types';

/**
 * Initialize extension on install
 */
chrome.runtime.onInstalled.addListener(async () => {
  console.log('[SemesterHub] Extension installed');
  await statusService.init();
  await authHandler.validateAndRefreshIfNeeded();
});

/**
 * Initialize extension on browser startup
 */
chrome.runtime.onStartup.addListener(async () => {
  console.log('[SemesterHub] Browser started');
  await statusService.init();
  await authHandler.validateAndRefreshIfNeeded();
});

/**
 * Handle messages from content scripts, popup, and webapp
 */
chrome.runtime.onMessage.addListener((message: ExtensionMessage, sender, sendResponse) => {
  messageRouter.route(message, sender)
    .then(response => sendResponse(response))
    .catch(error => {
      const errorMsg = error instanceof Error ? error.message : String(error);

      // Only log unexpected errors (not user-facing errors)
      if (!errorMsg.includes('Moodle') && !errorMsg.includes('Receiving end')) {
        console.error('[SemesterHub] Error:', error);
      }

      sendResponse({ error: errorMsg });
    });

  return true; // Keep channel open for async response
});

// Initialize lifecycle service for keep-alive management
lifecycleService.init();

console.log('[SemesterHub] Service worker started');
