/**
 * Lifecycle Service for SemesterHub extension
 * Manages service worker lifecycle, keep-alive, and startup tasks
 */

import { SERVICE_WORKER } from '../../shared/constants';
import { getAuthStatus, clearToken } from '../../shared/api';
import type { AuthStatus } from '../../shared/types';

/**
 * Lifecycle Service
 * Handles service worker lifecycle management
 */
export class LifecycleService {
  private static instance: LifecycleService | null = null;
  private isKeepAliveActive = false;
  private keepAliveStartTime: number | null = null;

  /**
   * Get singleton instance
   */
  static getInstance(): LifecycleService {
    if (!LifecycleService.instance) {
      LifecycleService.instance = new LifecycleService();
    }
    return LifecycleService.instance;
  }

  /**
   * Initialize the lifecycle service
   * Should be called when service worker starts
   */
  async init(): Promise<void> {
    console.log('[Lifecycle] Initializing service worker lifecycle');

    // Set up alarm listener
    chrome.alarms.onAlarm.addListener(this.handleAlarm.bind(this));

    // Validate token on startup
    await this.validateTokenOnStartup();

    console.log('[Lifecycle] Service worker lifecycle initialized');
  }

  /**
   * Start keep-alive to prevent service worker termination during long operations
   * Service workers have a 30-second idle timeout, so we ping every ~20 seconds
   */
  startKeepAlive(): void {
    if (this.isKeepAliveActive) {
      console.log('[Lifecycle] Keep-alive already active');
      return;
    }

    this.isKeepAliveActive = true;
    this.keepAliveStartTime = Date.now();

    chrome.alarms.create(SERVICE_WORKER.KEEPALIVE_ALARM_NAME, {
      periodInMinutes: SERVICE_WORKER.KEEPALIVE_INTERVAL_MINUTES,
    });

    console.log('[Lifecycle] Keep-alive started');
  }

  /**
   * Stop keep-alive when long operation is complete
   */
  stopKeepAlive(): void {
    if (!this.isKeepAliveActive) {
      return;
    }

    this.isKeepAliveActive = false;
    const duration = this.keepAliveStartTime
      ? Math.round((Date.now() - this.keepAliveStartTime) / 1000)
      : 0;
    this.keepAliveStartTime = null;

    chrome.alarms.clear(SERVICE_WORKER.KEEPALIVE_ALARM_NAME);

    console.log(`[Lifecycle] Keep-alive stopped after ${duration}s`);
  }

  /**
   * Check if keep-alive is currently active
   */
  isKeepAliveRunning(): boolean {
    return this.isKeepAliveActive;
  }

  /**
   * Get keep-alive duration in seconds (if active)
   */
  getKeepAliveDuration(): number | null {
    if (!this.keepAliveStartTime) {
      return null;
    }
    return Math.round((Date.now() - this.keepAliveStartTime) / 1000);
  }

  /**
   * Handle keep-alive alarm
   * Just being called keeps the service worker active
   */
  private handleAlarm(alarm: chrome.alarms.Alarm): void {
    if (alarm.name === SERVICE_WORKER.KEEPALIVE_ALARM_NAME) {
      const duration = this.getKeepAliveDuration();
      console.debug(`[Lifecycle] Keep-alive ping (active for ${duration}s)`);
    }
  }

  /**
   * Validate stored token on startup
   * Clears invalid tokens to ensure clean state
   */
  private async validateTokenOnStartup(): Promise<AuthStatus> {
    try {
      console.log('[Lifecycle] Validating token on startup...');

      const authStatus = await getAuthStatus();

      if (!authStatus.isAuthenticated) {
        console.log('[Lifecycle] No valid token found on startup');
      } else {
        console.log(`[Lifecycle] Token valid, user: ${authStatus.user?.name}`);
      }

      return authStatus;
    } catch (error) {
      console.error('[Lifecycle] Token validation failed:', error);

      // Clear potentially corrupt token
      await clearToken();

      return { isAuthenticated: false };
    }
  }

  /**
   * Handle installation event
   * Called when extension is first installed or updated
   */
  async onInstalled(details: chrome.runtime.InstalledDetails): Promise<void> {
    console.log('[Lifecycle] Extension installed/updated:', details.reason);

    // Initialize storage defaults
    const result = await chrome.storage.local.get(['syncHistory', 'lastSyncTime']);

    if (!result.syncHistory) {
      await chrome.storage.local.set({ syncHistory: [] });
    }

    // Validate token
    await this.validateTokenOnStartup();
  }

  /**
   * Handle browser startup event
   */
  async onStartup(): Promise<void> {
    console.log('[Lifecycle] Browser started');
    await this.validateTokenOnStartup();
  }

  /**
   * Run a function with keep-alive protection
   * Automatically starts keep-alive before and stops after
   *
   * @param fn - Async function to run
   * @returns Result of the function
   */
  async withKeepAlive<T>(fn: () => Promise<T>): Promise<T> {
    this.startKeepAlive();
    try {
      return await fn();
    } finally {
      this.stopKeepAlive();
    }
  }
}

// Export singleton instance
export const lifecycleService = LifecycleService.getInstance();

/**
 * Initialize lifecycle service and set up Chrome event listeners
 * This should be called once when the service worker loads
 */
export function initLifecycle(): void {
  // Initialize service
  lifecycleService.init();

  // Set up Chrome event listeners
  chrome.runtime.onInstalled.addListener((details) => {
    lifecycleService.onInstalled(details);
  });

  chrome.runtime.onStartup.addListener(() => {
    lifecycleService.onStartup();
  });
}
