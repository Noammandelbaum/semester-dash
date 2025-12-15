/**
 * Retry utilities for SemesterHub extension
 * Provides retry logic with exponential backoff for transient failures
 */

import { createError, ExtensionError, isExtensionError } from '../errors';
import { RETRY } from '../constants';
import { sleep } from './timeout';

export { RETRY };

/**
 * Options for retry behavior
 */
export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxAttempts: number;

  /** Base delay in milliseconds for exponential backoff (default: 1000) */
  baseDelayMs: number;

  /** Maximum delay cap in milliseconds (default: 10000) */
  maxDelayMs: number;

  /** Function to determine if an error is retryable */
  shouldRetry?: (error: Error, attempt: number) => boolean;

  /** Callback called before each retry */
  onRetry?: (error: Error, attempt: number, delay: number) => void;
}

/**
 * Default retry options
 */
const DEFAULT_OPTIONS: RetryOptions = {
  maxAttempts: RETRY.MAX_ATTEMPTS,
  baseDelayMs: RETRY.BASE_DELAY_MS,
  maxDelayMs: RETRY.MAX_DELAY_MS,
  shouldRetry: defaultShouldRetry,
};

/**
 * Default function to determine if an error is retryable
 * Only retries network errors (E1xxx codes)
 */
function defaultShouldRetry(error: Error): boolean {
  if (isExtensionError(error)) {
    // Only retry network errors (E1xxx) and some sync errors
    const code = error.code;
    return (
      code.startsWith('E1') || // Network errors
      code === 'E4003' // Content timeout
    );
  }

  // For non-ExtensionError, retry on network-related messages
  const message = error.message.toLowerCase();
  return (
    message.includes('network') ||
    message.includes('timeout') ||
    message.includes('fetch') ||
    message.includes('connection')
  );
}

/**
 * Calculate delay for exponential backoff
 *
 * @param attempt - Current attempt number (1-based)
 * @param baseDelayMs - Base delay in milliseconds
 * @param maxDelayMs - Maximum delay cap
 * @returns Delay in milliseconds with some jitter
 */
function calculateDelay(attempt: number, baseDelayMs: number, maxDelayMs: number): number {
  // Exponential backoff: base * 2^(attempt-1)
  const exponentialDelay = baseDelayMs * Math.pow(2, attempt - 1);

  // Add jitter (±10%) to prevent thundering herd
  const jitter = exponentialDelay * 0.1 * (Math.random() * 2 - 1);

  // Cap at maxDelayMs
  return Math.min(exponentialDelay + jitter, maxDelayMs);
}

/**
 * Execute a function with automatic retry on failure
 * Uses exponential backoff between retries
 *
 * @param fn - Async function to execute
 * @param options - Retry options
 * @returns Promise with the function result
 * @throws Last error if all retries fail
 *
 * @example
 * ```typescript
 * const result = await withRetry(
 *   () => fetchData(),
 *   { maxAttempts: 3 }
 * );
 * ```
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const opts: RetryOptions = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Check if this is the last attempt
      if (attempt === opts.maxAttempts) {
        break;
      }

      // Check if we should retry
      if (opts.shouldRetry && !opts.shouldRetry(lastError, attempt)) {
        break;
      }

      // Calculate delay
      const delay = calculateDelay(attempt, opts.baseDelayMs, opts.maxDelayMs);

      // Call onRetry callback if provided
      if (opts.onRetry) {
        opts.onRetry(lastError, attempt, delay);
      }

      // Wait before next attempt
      await sleep(delay);
    }
  }

  // All retries exhausted
  throw lastError!;
}

/**
 * Execute a function with retry, returning a Result type instead of throwing
 *
 * @param fn - Async function to execute
 * @param options - Retry options
 * @returns Result object with success/failure
 */
export async function withRetrySafe<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<{ success: true; data: T } | { success: false; error: Error }> {
  try {
    const data = await withRetry(fn, options);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}

/**
 * Create a retry wrapper for a function
 * Useful for creating pre-configured retry functions
 *
 * @param fn - Function to wrap
 * @param options - Retry options
 * @returns Wrapped function with retry logic
 */
export function createRetryWrapper<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  options: Partial<RetryOptions> = {}
): (...args: TArgs) => Promise<TResult> {
  return (...args: TArgs) => withRetry(() => fn(...args), options);
}
