/**
 * Tab Manager Service for SemesterHub extension
 * Handles tab creation, navigation, and message sending with retry and timeout
 */

import { createError, type ExtensionError } from '../../shared/errors';
import { withTimeout, sleep, TIMEOUTS } from '../../shared/utils/timeout';
import { withRetry, RETRY } from '../../shared/utils/retry';
import { SYNC } from '../../shared/constants';
import type { ExtensionMessage } from '../../shared/types';

/**
 * Tab Manager Service
 * Manages background tab operations for scraping with reliability improvements
 */
export class TabManagerService {
  private static instance: TabManagerService | null = null;

  /**
   * Get singleton instance
   */
  static getInstance(): TabManagerService {
    if (!TabManagerService.instance) {
      TabManagerService.instance = new TabManagerService();
    }
    return TabManagerService.instance;
  }

  /**
   * Create a background tab and wait for it to load
   *
   * @param url - URL to open
   * @returns The created tab
   * @throws ExtensionError if tab creation or loading fails
   */
  async createBackgroundTab(url: string): Promise<chrome.tabs.Tab> {
    const tab = await chrome.tabs.create({ url, active: false });

    if (!tab.id) {
      throw createError('E3003', { url, reason: 'Tab created without ID' });
    }

    await this.waitForTabLoad(tab.id, url);

    // Wait for content script to initialize
    await sleep(SYNC.TAB_INIT_DELAY_MS);

    return tab;
  }

  /**
   * Wait for a tab to finish loading
   *
   * @param tabId - Tab ID to wait for
   * @param url - URL for error context
   * @throws ExtensionError on timeout
   */
  async waitForTabLoad(tabId: number, url?: string): Promise<void> {
    const loadPromise = new Promise<void>((resolve, reject) => {
      // IMPORTANT: First check if tab is already loaded (race condition fix)
      // If we only add a listener, we'd miss the event if tab already loaded
      chrome.tabs.get(tabId, (tab) => {
        if (chrome.runtime.lastError) {
          reject(createError('E3003', { tabId, url, reason: chrome.runtime.lastError.message }));
          return;
        }

        // Tab is already loaded - resolve immediately
        if (tab.status === 'complete') {
          console.log('[TabManager] Tab already loaded:', tabId);
          resolve();
          return;
        }

        // Tab still loading - set up listener for future updates
        const listener = (
          updatedTabId: number,
          changeInfo: chrome.tabs.TabChangeInfo
        ) => {
          if (updatedTabId === tabId && changeInfo.status === 'complete') {
            chrome.tabs.onUpdated.removeListener(listener);
            chrome.tabs.onRemoved.removeListener(onRemoved);
            resolve();
          }
        };

        const onRemoved = (removedTabId: number) => {
          if (removedTabId === tabId) {
            chrome.tabs.onRemoved.removeListener(onRemoved);
            chrome.tabs.onUpdated.removeListener(listener);
            reject(createError('E3003', { tabId, url, reason: 'Tab was closed' }));
          }
        };

        chrome.tabs.onUpdated.addListener(listener);
        chrome.tabs.onRemoved.addListener(onRemoved);
      });
    });

    return withTimeout(loadPromise, TIMEOUTS.TAB_LOAD, 'E4003', { tabId, url });
  }

  /**
   * Send a message to a tab's content script with retry logic
   *
   * @param tabId - Tab ID to send message to
   * @param message - Message to send
   * @returns Response from the content script
   * @throws ExtensionError if all retries fail
   */
  async sendMessageToTab<T>(
    tabId: number,
    message: ExtensionMessage
  ): Promise<T> {
    return withRetry(
      async () => {
        const sendPromise = new Promise<T>((resolve, reject) => {
          chrome.tabs.sendMessage(tabId, message, (response) => {
            if (chrome.runtime.lastError) {
              // Common error: content script not ready or tab closed
              reject(createError('E4002', {
                tabId,
                messageType: message.type,
                chromeError: chrome.runtime.lastError.message,
              }));
              return;
            }

            if (response?.error) {
              reject(createError('E3004', {
                tabId,
                messageType: message.type,
                error: response.error,
              }));
              return;
            }

            resolve(response as T);
          });
        });

        return withTimeout(sendPromise, TIMEOUTS.MESSAGE_SCRAPE, 'E4003', {
          tabId,
          messageType: message.type,
        });
      },
      {
        maxAttempts: RETRY.TAB_MESSAGE_RETRIES + 1, // +1 because first attempt isn't a "retry"
        baseDelayMs: 500, // Short delay between retries for tab messages
        maxDelayMs: 2000,
        shouldRetry: (error) => {
          // Retry on content script not loaded or timeout
          if (error instanceof Error) {
            const code = (error as any).code;
            return code === 'E4002' || code === 'E4003';
          }
          return false;
        },
        onRetry: (error, attempt, delay) => {
          console.log(
            `[TabManager] Retry ${attempt} for tab ${tabId}, ` +
            `message ${message.type}, waiting ${delay}ms`
          );
        },
      }
    );
  }

  /**
   * Safely close a tab, ignoring errors if tab doesn't exist
   *
   * @param tabId - Tab ID to close
   */
  async closeTab(tabId: number): Promise<void> {
    try {
      await chrome.tabs.remove(tabId);
    } catch {
      // Tab might already be closed, ignore
    }
  }

  /**
   * Create a popup window (for Moodle login)
   *
   * @param url - URL to open
   * @param options - Window options
   * @returns The created window and first tab
   */
  async createPopupWindow(
    url: string,
    options: { width?: number; height?: number; focused?: boolean } = {}
  ): Promise<{ windowId: number; tabId: number }> {
    const window = await chrome.windows.create({
      type: 'popup',
      url,
      width: options.width ?? 1000,
      height: options.height ?? 700,
      focused: options.focused ?? true,
    });

    if (!window.id) {
      throw createError('E3003', { url, reason: 'Window created without ID' });
    }

    const tabs = await chrome.tabs.query({ windowId: window.id });
    if (!tabs[0]?.id) {
      throw createError('E3003', { url, reason: 'Window has no tabs' });
    }

    return { windowId: window.id, tabId: tabs[0].id };
  }

  /**
   * Close a window, ignoring errors if window doesn't exist
   *
   * @param windowId - Window ID to close
   */
  async closeWindow(windowId: number): Promise<void> {
    try {
      await chrome.windows.remove(windowId);
    } catch {
      // Window might already be closed, ignore
    }
  }

  /**
   * Check if a window still exists
   *
   * @param windowId - Window ID to check
   * @returns true if window exists, false otherwise
   */
  async windowExists(windowId: number): Promise<boolean> {
    try {
      await chrome.windows.get(windowId);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Run a function with a tab, ensuring cleanup
   * Creates tab, runs function, closes tab even on error
   *
   * @param url - URL to open
   * @param fn - Function to run with the tab
   * @returns Result of the function
   */
  async withTab<T>(
    url: string,
    fn: (tabId: number) => Promise<T>
  ): Promise<T> {
    const tab = await this.createBackgroundTab(url);

    try {
      return await fn(tab.id!);
    } finally {
      await this.closeTab(tab.id!);
    }
  }
}

// Export singleton instance
export const tabManager = TabManagerService.getInstance();
