/**
 * Timeout utilities for SemesterHub extension
 * Provides timeout wrappers to prevent hanging requests
 */

import { createError, type ExtensionError } from '../errors';
import { TIMEOUTS } from '../constants';

export { TIMEOUTS };

/**
 * Wraps a promise with a timeout
 * If the promise doesn't resolve within the timeout, rejects with an ExtensionError
 *
 * @param promise - The promise to wrap
 * @param timeoutMs - Timeout in milliseconds
 * @param errorCode - Error code to use if timeout occurs (default: E1002 - NETWORK_TIMEOUT)
 * @param context - Additional context for the error
 * @returns Promise that resolves with the original value or rejects on timeout
 *
 * @example
 * ```typescript
 * const result = await withTimeout(
 *   fetch('/api/data'),
 *   5000,
 *   'E1002',
 *   { url: '/api/data' }
 * );
 * ```
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorCode: string = 'E1002',
  context?: Record<string, unknown>
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(createError(errorCode, { ...context, timeoutMs }));
    }, timeoutMs);

    promise
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

/**
 * Sleep for a specified duration
 * Useful for delays between retries or waiting for content script initialization
 *
 * @param ms - Milliseconds to sleep
 * @returns Promise that resolves after the delay
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create a timeout promise that rejects after specified time
 * Useful with Promise.race for more control
 *
 * @param ms - Timeout in milliseconds
 * @param errorCode - Error code for the timeout error
 * @returns Promise that rejects after timeout
 */
export function timeout(ms: number, errorCode: string = 'E1002'): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(createError(errorCode, { timeoutMs: ms }));
    }, ms);
  });
}

/**
 * Race a promise against a timeout
 *
 * @param promise - The promise to race
 * @param timeoutMs - Timeout in milliseconds
 * @param errorCode - Error code if timeout wins
 * @returns Result of the promise if it wins, otherwise rejects
 */
export function raceWithTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorCode: string = 'E1002'
): Promise<T> {
  return Promise.race([promise, timeout(timeoutMs, errorCode)]);
}

/**
 * Create a deferred promise with timeout
 * Allows external resolution/rejection while still having a timeout
 *
 * @param timeoutMs - Timeout in milliseconds
 * @param errorCode - Error code if timeout occurs
 * @returns Object with promise and resolve/reject functions
 */
export function createDeferredWithTimeout<T>(
  timeoutMs: number,
  errorCode: string = 'E1002'
): {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
  cancel: () => void;
} {
  let resolve: (value: T) => void;
  let reject: (error: Error) => void;
  let timer: ReturnType<typeof setTimeout>;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
    timer = setTimeout(() => {
      rej(createError(errorCode, { timeoutMs }));
    }, timeoutMs);
  });

  return {
    promise,
    resolve: (value: T) => {
      clearTimeout(timer);
      resolve(value);
    },
    reject: (error: Error) => {
      clearTimeout(timer);
      reject(error);
    },
    cancel: () => {
      clearTimeout(timer);
    },
  };
}
