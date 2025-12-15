/**
 * Storage Service for SemesterHub extension
 * Handles Chrome storage operations for sync history, courses config, etc.
 */

import { STORAGE_KEYS, SYNC } from '../../shared/constants';
import type { SyncHistoryEntry, UniversityId } from '../../shared/types';

/**
 * Course configuration stored after sync setup
 */
export interface StoredCourseConfig {
  moodleId: string;
  name: string;
  url: string;
  selectedSections: string[];
}

/**
 * Storage Service
 * Centralizes all Chrome storage operations
 */
export class StorageService {
  private static instance: StorageService | null = null;

  /**
   * Get singleton instance
   */
  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  // ========================================
  // Auth Token Storage
  // ========================================

  /**
   * Get stored auth token
   */
  async getAuthToken(): Promise<{ token: string | null; expiresAt: string | null }> {
    const result = await chrome.storage.local.get([
      STORAGE_KEYS.AUTH_TOKEN,
      STORAGE_KEYS.TOKEN_EXPIRES_AT,
    ]);
    return {
      token: result[STORAGE_KEYS.AUTH_TOKEN] || null,
      expiresAt: result[STORAGE_KEYS.TOKEN_EXPIRES_AT] || null,
    };
  }

  /**
   * Store auth token
   */
  async setAuthToken(token: string, expiresAt: string): Promise<void> {
    await chrome.storage.local.set({
      [STORAGE_KEYS.AUTH_TOKEN]: token,
      [STORAGE_KEYS.TOKEN_EXPIRES_AT]: expiresAt,
    });
  }

  /**
   * Clear auth token
   */
  async clearAuthToken(): Promise<void> {
    await chrome.storage.local.remove([
      STORAGE_KEYS.AUTH_TOKEN,
      STORAGE_KEYS.TOKEN_EXPIRES_AT,
    ]);
  }

  // ========================================
  // Course Configuration Storage
  // ========================================

  /**
   * Get synced courses configuration
   */
  async getSyncedCourses(): Promise<StoredCourseConfig[]> {
    const result = await chrome.storage.local.get(STORAGE_KEYS.SYNCED_COURSES);
    return result[STORAGE_KEYS.SYNCED_COURSES] || [];
  }

  /**
   * Store synced courses configuration
   */
  async setSyncedCourses(courses: StoredCourseConfig[]): Promise<void> {
    await chrome.storage.local.set({
      [STORAGE_KEYS.SYNCED_COURSES]: courses,
    });
  }

  /**
   * Get full sync configuration
   */
  async getSyncConfig(): Promise<{
    courses: StoredCourseConfig[];
    universityId: string | null;
    moodleUrl: string | null;
  }> {
    const result = await chrome.storage.local.get([
      STORAGE_KEYS.SYNCED_COURSES,
      STORAGE_KEYS.SYNCED_UNIVERSITY_ID,
      STORAGE_KEYS.SYNCED_MOODLE_URL,
    ]);

    return {
      courses: result[STORAGE_KEYS.SYNCED_COURSES] || [],
      universityId: result[STORAGE_KEYS.SYNCED_UNIVERSITY_ID] || null,
      moodleUrl: result[STORAGE_KEYS.SYNCED_MOODLE_URL] || null,
    };
  }

  /**
   * Store full sync configuration
   */
  async setSyncConfig(config: {
    courses: StoredCourseConfig[];
    universityId: string;
    moodleUrl: string;
  }): Promise<void> {
    await chrome.storage.local.set({
      [STORAGE_KEYS.SYNCED_COURSES]: config.courses,
      [STORAGE_KEYS.SYNCED_UNIVERSITY_ID]: config.universityId,
      [STORAGE_KEYS.SYNCED_MOODLE_URL]: config.moodleUrl,
    });
  }

  /**
   * Clear sync configuration
   */
  async clearSyncConfig(): Promise<void> {
    await chrome.storage.local.remove([
      STORAGE_KEYS.SYNCED_COURSES,
      STORAGE_KEYS.SYNCED_UNIVERSITY_ID,
      STORAGE_KEYS.SYNCED_MOODLE_URL,
    ]);
  }

  // ========================================
  // Sync History Storage
  // ========================================

  /**
   * Get sync history
   */
  async getSyncHistory(): Promise<SyncHistoryEntry[]> {
    const result = await chrome.storage.local.get(STORAGE_KEYS.SYNC_HISTORY);
    return result[STORAGE_KEYS.SYNC_HISTORY] || [];
  }

  /**
   * Add entry to sync history
   * Keeps last N entries (configured in SYNC.MAX_HISTORY_ENTRIES)
   */
  async addToSyncHistory(entry: SyncHistoryEntry): Promise<void> {
    const history = await this.getSyncHistory();

    // Add new entry at the beginning
    history.unshift(entry);

    // Keep only the last N entries
    if (history.length > SYNC.MAX_HISTORY_ENTRIES) {
      history.pop();
    }

    await chrome.storage.local.set({
      [STORAGE_KEYS.SYNC_HISTORY]: history,
    });
  }

  /**
   * Clear sync history
   */
  async clearSyncHistory(): Promise<void> {
    await chrome.storage.local.set({
      [STORAGE_KEYS.SYNC_HISTORY]: [],
    });
  }

  // ========================================
  // Last Sync Time
  // ========================================

  /**
   * Get last sync time
   */
  async getLastSyncTime(): Promise<number | null> {
    const result = await chrome.storage.local.get(STORAGE_KEYS.LAST_SYNC_TIME);
    return result[STORAGE_KEYS.LAST_SYNC_TIME] || null;
  }

  /**
   * Set last sync time
   */
  async setLastSyncTime(timestamp: number): Promise<void> {
    await chrome.storage.local.set({
      [STORAGE_KEYS.LAST_SYNC_TIME]: timestamp,
    });
  }

  // ========================================
  // Pending Login State
  // ========================================

  /**
   * Get pending login flag
   */
  async getPendingLogin(): Promise<boolean> {
    const result = await chrome.storage.local.get(STORAGE_KEYS.PENDING_LOGIN);
    return result[STORAGE_KEYS.PENDING_LOGIN] || false;
  }

  /**
   * Set pending login flag
   */
  async setPendingLogin(pending: boolean): Promise<void> {
    if (pending) {
      await chrome.storage.local.set({
        [STORAGE_KEYS.PENDING_LOGIN]: true,
      });
    } else {
      await chrome.storage.local.remove(STORAGE_KEYS.PENDING_LOGIN);
    }
  }

  // ========================================
  // Initialization
  // ========================================

  /**
   * Initialize storage with defaults
   * Called on extension install
   */
  async initDefaults(): Promise<void> {
    const result = await chrome.storage.local.get([STORAGE_KEYS.SYNC_HISTORY]);

    if (!result[STORAGE_KEYS.SYNC_HISTORY]) {
      await chrome.storage.local.set({
        [STORAGE_KEYS.SYNC_HISTORY]: [],
      });
    }
  }

  // ========================================
  // Debug/Utility
  // ========================================

  /**
   * Get all storage data (for debugging)
   */
  async getAll(): Promise<Record<string, unknown>> {
    return await chrome.storage.local.get();
  }

  /**
   * Clear all extension storage (careful!)
   */
  async clearAll(): Promise<void> {
    await chrome.storage.local.clear();
  }
}

// Export singleton instance
export const storageService = StorageService.getInstance();
