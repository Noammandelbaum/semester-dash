/**
 * Status Service for SemesterHub extension
 * Manages sync status and broadcasts updates to popup and content scripts
 */

import type {
  SyncStatus,
  SyncStatusType,
  ScrapeProgress,
  AuthStatus,
  ExtensionMessage,
  SyncResponse,
} from '../../shared/types';

/**
 * Status update options
 */
export interface StatusUpdateOptions {
  error?: string | null;
  progress?: ScrapeProgress;
}

/**
 * Status Service
 * Centralizes sync status management and broadcasting
 */
export class StatusService {
  private static instance: StatusService | null = null;

  // Current sync status
  private syncStatus: SyncStatus = {
    status: 'idle',
    isSyncing: false,
    lastSyncTime: null,
    lastSyncResult: null,
    error: null,
  };

  // Cached auth status
  private cachedAuthStatus: AuthStatus = { isAuthenticated: false };

  /**
   * Get singleton instance
   */
  static getInstance(): StatusService {
    if (!StatusService.instance) {
      StatusService.instance = new StatusService();
    }
    return StatusService.instance;
  }

  /**
   * Initialize status from storage
   */
  async init(): Promise<void> {
    const result = await chrome.storage.local.get(['lastSyncTime']);
    if (result.lastSyncTime) {
      this.syncStatus.lastSyncTime = result.lastSyncTime;
    }
    console.log('[StatusService] Initialized');
  }

  /**
   * Get current sync status with auth status
   */
  getStatus(): SyncStatus & { authStatus: AuthStatus } {
    return {
      ...this.syncStatus,
      authStatus: this.cachedAuthStatus,
    };
  }

  /**
   * Get raw sync status without auth
   */
  getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  /**
   * Check if currently syncing
   */
  isSyncing(): boolean {
    return this.syncStatus.isSyncing;
  }

  /**
   * Check if currently in error state
   */
  hasError(): boolean {
    return this.syncStatus.status === 'error';
  }

  /**
   * Get last sync result
   */
  getLastSyncResult(): SyncResponse | null {
    return this.syncStatus.lastSyncResult;
  }

  /**
   * Update cached auth status
   */
  setAuthStatus(status: AuthStatus): void {
    this.cachedAuthStatus = status;
    this.broadcast();
  }

  /**
   * Get cached auth status
   */
  getAuthStatus(): AuthStatus {
    return this.cachedAuthStatus;
  }

  /**
   * Update sync status
   *
   * @param status - New status type
   * @param options - Optional error and progress
   */
  updateStatus(status: SyncStatusType, options: StatusUpdateOptions = {}): void {
    this.syncStatus.status = status;
    this.syncStatus.isSyncing =
      status === 'syncing' ||
      status === 'scraping' ||
      status === 'checking';

    // Update error
    if (options.error !== undefined) {
      this.syncStatus.error = options.error;
    } else if (status === 'success' || status === 'idle') {
      // Clear error on success/idle
      this.syncStatus.error = null;
    }

    // Update progress
    if (options.progress !== undefined) {
      this.syncStatus.progress = options.progress;
    }

    // Broadcast update
    this.broadcast();
  }

  /**
   * Update progress during operation
   */
  updateProgress(progress: ScrapeProgress): void {
    this.syncStatus.progress = progress;
    this.broadcast();
  }

  /**
   * Set sync complete with result
   */
  setSyncComplete(result: SyncResponse): void {
    this.syncStatus.lastSyncResult = result;
    this.syncStatus.lastSyncTime = Date.now();

    // Persist last sync time
    chrome.storage.local.set({ lastSyncTime: this.syncStatus.lastSyncTime });

    const message =
      `סונכרנו ${result.courses.created + result.courses.updated} קורסים ` +
      `ו-${result.assignments.created + result.assignments.updated} משימות`;

    this.updateStatus('success', {
      progress: {
        stage: 'complete',
        message,
      },
    });

    // Reset to idle after delay
    setTimeout(() => {
      this.updateStatus('idle');
    }, 3000);
  }

  /**
   * Set error status
   */
  setError(error: string): void {
    this.updateStatus('error', { error });
  }

  /**
   * Reset to idle
   */
  resetToIdle(): void {
    this.updateStatus('idle');
  }

  /**
   * Broadcast status update to all listeners
   * Sends to popup and content scripts
   */
  private broadcast(): void {
    const message: ExtensionMessage<SyncStatus & { authStatus: AuthStatus }> = {
      type: 'STATUS_UPDATE',
      payload: this.getStatus(),
    };

    // Send to popup (may not be open)
    chrome.runtime.sendMessage(message).catch(() => {
      // Popup not open, ignore
    });

    // Send to Moodle content scripts
    chrome.tabs.query({ url: ['*://*.moodle.*/*', '*://moodle.*/*'] })
      .then((tabs) => {
        for (const tab of tabs) {
          if (tab.id) {
            chrome.tabs.sendMessage(tab.id, message).catch(() => {
              // Content script not loaded, ignore
            });
          }
        }
      })
      .catch(() => {
        // Tab query failed, ignore
      });
  }
}

// Export singleton instance
export const statusService = StatusService.getInstance();
