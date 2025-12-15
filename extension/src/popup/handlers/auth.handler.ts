/**
 * Auth Handler for SemesterHub popup
 * Handles login, logout, and token polling with race condition fix
 */

import { requestAndStoreToken } from '../../shared/api';
import { TIMEOUTS } from '../../shared/constants';
import type { AuthStatus } from '../../shared/types';
import { sendMessage } from '../services/message.service';

// Re-export API_BASE_URL for login URL construction
export { API_BASE_URL } from '../../shared/config';

/**
 * Callback types for UI updates
 */
export interface AuthUICallbacks {
  onAuthStatusChanged: (status: AuthStatus) => void;
  onPollingStarted: () => void;
  onPollingStopped: () => void;
  onPollingError: (message: string) => void;
}

/**
 * Auth Handler
 * Manages authentication flow with race condition protection
 */
export class AuthHandler {
  private pollingController: AbortController | null = null;
  private callbacks: AuthUICallbacks;

  constructor(callbacks: AuthUICallbacks) {
    this.callbacks = callbacks;
  }

  /**
   * Handle login button click
   * Opens login page and starts polling for token
   */
  async handleLogin(): Promise<void> {
    // Import API_BASE_URL dynamically to avoid circular imports if needed
    const { API_BASE_URL } = await import('../../shared/config');

    // Open login page with extension flag
    chrome.tabs.create({ url: `${API_BASE_URL}/login?from=extension` });

    // Update UI to show polling state
    this.callbacks.onPollingStarted();

    // Start polling for token
    await this.startTokenPolling();
  }

  /**
   * Poll for authentication token after login
   * Uses AbortController to prevent race conditions from multiple polling sessions
   */
  private async startTokenPolling(): Promise<void> {
    // Cancel any existing polling - THIS IS THE KEY FIX
    this.cancelPolling();

    this.pollingController = new AbortController();
    const { signal } = this.pollingController;

    const startTime = Date.now();
    const pollInterval = TIMEOUTS.TOKEN_POLL_INTERVAL;
    const maxDuration = TIMEOUTS.TOKEN_POLL_TOTAL;

    while (!signal.aborted && Date.now() - startTime < maxDuration) {
      try {
        const result = await requestAndStoreToken();

        if (result.success) {
          // Success! Update UI and stop polling
          this.callbacks.onAuthStatusChanged(result.data);
          this.cancelPolling();
          return;
        }
      } catch (error) {
        // Token not ready yet, continue polling
        console.log('[AuthHandler] Polling for token...');
      }

      // Wait before next attempt
      await this.sleep(pollInterval, signal);
    }

    // If we get here without success, show error
    if (!signal.aborted) {
      this.callbacks.onPollingError('הזמן הקצוב להתחברות עבר. נסה שוב.');
      this.callbacks.onPollingStopped();
    }
  }

  /**
   * Sleep that respects abort signal
   */
  private sleep(ms: number, signal: AbortSignal): Promise<void> {
    return new Promise((resolve) => {
      const timer = setTimeout(resolve, ms);
      signal.addEventListener('abort', () => {
        clearTimeout(timer);
        resolve();
      });
    });
  }

  /**
   * Cancel any active polling
   */
  cancelPolling(): void {
    if (this.pollingController) {
      this.pollingController.abort();
      this.pollingController = null;
    }
  }

  /**
   * Handle logout button click
   */
  async handleLogout(): Promise<void> {
    // Cancel any polling in progress
    this.cancelPolling();

    try {
      // Clear token via background script
      await sendMessage({ type: 'CLEAR_AUTH_TOKEN' });

      // Clear pending login flag
      await chrome.storage.local.remove('pendingLogin');

      // Update UI
      this.callbacks.onAuthStatusChanged({ isAuthenticated: false });
    } catch (error) {
      console.error('[AuthHandler] Logout failed:', error);
      // Still update UI even if there's an error
      this.callbacks.onAuthStatusChanged({ isAuthenticated: false });
    }
  }

  /**
   * Check current authentication status
   */
  async checkStatus(): Promise<AuthStatus> {
    try {
      const response = await sendMessage<{ authStatus: AuthStatus }>({
        type: 'GET_STATUS',
      });
      return response.authStatus || { isAuthenticated: false };
    } catch (error) {
      console.error('[AuthHandler] Failed to get auth status:', error);
      return { isAuthenticated: false };
    }
  }

  /**
   * Cleanup - call when popup closes
   */
  destroy(): void {
    this.cancelPolling();
  }
}

/**
 * Factory function to create auth handler with callbacks
 */
export function createAuthHandler(callbacks: AuthUICallbacks): AuthHandler {
  return new AuthHandler(callbacks);
}
