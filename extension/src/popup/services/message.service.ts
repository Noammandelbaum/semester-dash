/**
 * Message Service for SemesterHub popup
 * Handles communication with background service worker with timeout protection
 */

import { createError, ExtensionError, isExtensionError } from '../../shared/errors';
import { withTimeout, TIMEOUTS } from '../../shared/utils/timeout';
import type { ExtensionMessage } from '../../shared/types';

/**
 * Options for sending messages
 */
export interface SendMessageOptions {
  /** Timeout in milliseconds (default: MESSAGE_DEFAULT from constants) */
  timeout?: number;
  /** Custom error code to use on timeout */
  timeoutErrorCode?: string;
}

/**
 * Message Service for popup-to-background communication
 * Provides timeout-protected message sending
 */
export class MessageService {
  private static instance: MessageService | null = null;

  /**
   * Get singleton instance
   */
  static getInstance(): MessageService {
    if (!MessageService.instance) {
      MessageService.instance = new MessageService();
    }
    return MessageService.instance;
  }

  /**
   * Send a message to the background service worker
   * Includes timeout protection to prevent hanging requests
   *
   * @param message - The message to send
   * @param options - Optional timeout and error configuration
   * @returns Promise with the response
   * @throws ExtensionError on timeout or communication failure
   *
   * @example
   * ```typescript
   * const service = MessageService.getInstance();
   * const status = await service.send<SyncStatus>({ type: 'GET_STATUS' });
   * ```
   */
  async send<T>(
    message: ExtensionMessage,
    options: SendMessageOptions = {}
  ): Promise<T> {
    const timeoutMs = options.timeout ?? TIMEOUTS.MESSAGE_DEFAULT;
    const errorCode = options.timeoutErrorCode ?? 'E1002';

    const sendPromise = new Promise<T>((resolve, reject) => {
      try {
        chrome.runtime.sendMessage(message, (response) => {
          // Check for Chrome runtime errors
          if (chrome.runtime.lastError) {
            reject(createError('E1003', {
              chromeError: chrome.runtime.lastError.message,
              messageType: message.type
            }));
            return;
          }

          // Check for error in response
          if (response?.error) {
            // If error is already an ExtensionError JSON, reconstruct it
            if (typeof response.error === 'object' && response.error.code) {
              reject(ExtensionError.fromJSON(response.error));
            } else {
              reject(createError('E1003', {
                error: response.error,
                messageType: message.type
              }));
            }
            return;
          }

          resolve(response as T);
        });
      } catch (error) {
        reject(createError('E1003', {
          error: error instanceof Error ? error.message : String(error),
          messageType: message.type
        }));
      }
    });

    // Wrap with timeout
    return withTimeout(sendPromise, timeoutMs, errorCode, {
      messageType: message.type
    });
  }

  /**
   * Send message with longer timeout for scraping operations
   */
  async sendForScraping<T>(message: ExtensionMessage): Promise<T> {
    return this.send<T>(message, {
      timeout: TIMEOUTS.MESSAGE_SCRAPE,
      timeoutErrorCode: 'E4003' // Content timeout
    });
  }

  /**
   * Send message and return result without throwing
   *
   * @param message - The message to send
   * @param options - Optional configuration
   * @returns Result object with success/failure
   */
  async sendSafe<T>(
    message: ExtensionMessage,
    options: SendMessageOptions = {}
  ): Promise<{ success: true; data: T } | { success: false; error: ExtensionError }> {
    try {
      const data = await this.send<T>(message, options);
      return { success: true, data };
    } catch (error) {
      if (isExtensionError(error)) {
        return { success: false, error };
      }
      return {
        success: false,
        error: createError('E1003', {
          error: error instanceof Error ? error.message : String(error)
        })
      };
    }
  }
}

// Export singleton instance for convenience
export const messageService = MessageService.getInstance();

// Export a simple function for common use case
export async function sendMessage<T>(
  message: ExtensionMessage,
  options?: SendMessageOptions
): Promise<T> {
  return messageService.send<T>(message, options);
}

export async function sendMessageSafe<T>(
  message: ExtensionMessage,
  options?: SendMessageOptions
): Promise<{ success: true; data: T } | { success: false; error: ExtensionError }> {
  return messageService.sendSafe<T>(message, options);
}
