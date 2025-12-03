/**
 * API client for communicating with SemesterHub backend
 * Handles authentication, error handling, and network issues
 */

import { API_BASE_URL } from "./config";
import type {
  SyncPayload,
  SyncResponse,
  AuthStatus,
  TokenResponse,
  VerifyResponse,
  Result,
  AsyncResult,
} from "./types";

// ========================================
// Error Classes
// ========================================

/**
 * Custom API error class with status code and categorization
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public category: ApiErrorCategory = "unknown"
  ) {
    super(message);
    this.name = "ApiError";
  }

  /**
   * Check if error is due to authentication issues
   */
  isAuthError(): boolean {
    return this.category === "auth" || this.statusCode === 401;
  }

  /**
   * Check if error is due to network issues (retryable)
   */
  isNetworkError(): boolean {
    return this.category === "network";
  }

  /**
   * Check if error is due to rate limiting (retryable after delay)
   */
  isRateLimitError(): boolean {
    return this.category === "rate_limit" || this.statusCode === 429;
  }

  /**
   * Check if error is retryable
   */
  isRetryable(): boolean {
    return (
      this.isNetworkError() ||
      this.isRateLimitError() ||
      (this.statusCode >= 500 && this.statusCode < 600)
    );
  }
}

/**
 * API error categories for better error handling
 */
export type ApiErrorCategory =
  | "auth" // Authentication/authorization errors
  | "validation" // Request validation errors
  | "network" // Network/connection errors
  | "rate_limit" // Rate limiting errors
  | "server" // Server-side errors
  | "unknown"; // Unknown errors

// ========================================
// Token Management
// ========================================

/**
 * Get stored auth token from extension storage
 * Returns null if token is missing or expired
 */
async function getStoredToken(): Promise<string | null> {
  try {
    const result = await chrome.storage.local.get([
      "authToken",
      "tokenExpiresAt",
    ]);

    if (!result.authToken) {
      return null;
    }

    // Check if token is expired (with 5 minute buffer)
    if (result.tokenExpiresAt) {
      const expiresAt = new Date(result.tokenExpiresAt);
      const bufferMs = 5 * 60 * 1000; // 5 minutes
      if (expiresAt.getTime() - bufferMs < Date.now()) {
        // Token expired or about to expire, clear it
        await chrome.storage.local.remove(["authToken", "tokenExpiresAt"]);
        return null;
      }
    }

    return result.authToken;
  } catch (error) {
    console.error("[API] Failed to get stored token:", error);
    return null;
  }
}

/**
 * Store auth token in extension storage
 */
export async function storeToken(
  token: string,
  expiresAt: string
): Promise<void> {
  await chrome.storage.local.set({
    authToken: token,
    tokenExpiresAt: expiresAt,
  });
}

/**
 * Clear stored auth token
 */
export async function clearToken(): Promise<void> {
  await chrome.storage.local.remove(["authToken", "tokenExpiresAt"]);
}

/**
 * Check if token exists and is valid (not expired)
 */
export async function hasValidToken(): Promise<boolean> {
  const token = await getStoredToken();
  return token !== null;
}

// ========================================
// API Request Helpers
// ========================================

/**
 * Categorize HTTP status code into error category
 */
function categorizeStatusCode(status: number): ApiErrorCategory {
  if (status === 401 || status === 403) return "auth";
  if (status === 400 || status === 422) return "validation";
  if (status === 429) return "rate_limit";
  if (status >= 500) return "server";
  return "unknown";
}

/**
 * Make authenticated API request with error handling
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getStoredToken();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: `HTTP ${response.status}`,
      }));

      const category = categorizeStatusCode(response.status);
      throw new ApiError(
        errorData.error || errorData.message || `HTTP ${response.status}`,
        response.status,
        category
      );
    }

    return response.json();
  } catch (error) {
    // Handle network errors
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new ApiError(
        "Network error: Unable to connect to server",
        0,
        "network"
      );
    }

    // Re-throw ApiError as-is
    if (error instanceof ApiError) {
      throw error;
    }

    // Wrap other errors
    throw new ApiError(
      error instanceof Error ? error.message : "Unknown error occurred",
      0,
      "unknown"
    );
  }
}

/**
 * Make API request with automatic retry for transient failures
 */
async function apiRequestWithRetry<T>(
  endpoint: string,
  options: RequestInit = {},
  maxRetries: number = 3
): Promise<T> {
  let lastError: ApiError | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiRequest<T>(endpoint, options);
    } catch (error) {
      if (!(error instanceof ApiError)) {
        throw error;
      }

      lastError = error;

      // Don't retry non-retryable errors
      if (!error.isRetryable()) {
        throw error;
      }

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);

      // For rate limiting, use longer delay
      const actualDelay = error.isRateLimitError() ? delay * 2 : delay;

      console.log(
        `[API] Retry ${attempt}/${maxRetries} after ${actualDelay}ms for ${endpoint}`
      );
      await new Promise((resolve) => setTimeout(resolve, actualDelay));
    }
  }

  throw lastError!;
}

// ========================================
// Public API Functions
// ========================================

/**
 * Sync Moodle data to SemesterHub backend
 * @param payload - Scraped courses and assignments data
 * @returns SyncResponse with counts of created/updated items
 * @throws ApiError on failure
 */
export async function syncMoodleData(payload: SyncPayload): Promise<SyncResponse> {
  return apiRequestWithRetry<SyncResponse>("/api/sync/moodle", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Sync Moodle data with Result wrapper (no exceptions)
 * @param payload - Scraped courses and assignments data
 * @returns Result object with either data or error
 */
export async function syncMoodleDataSafe(
  payload: SyncPayload
): AsyncResult<SyncResponse, ApiError> {
  try {
    const response = await syncMoodleData(payload);
    return { success: true, data: response };
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, error };
    }
    return {
      success: false,
      error: new ApiError(
        error instanceof Error ? error.message : "Unknown error",
        0,
        "unknown"
      ),
    };
  }
}

/**
 * Get current authentication status
 * @returns AuthStatus with authentication state and user info
 */
export async function getAuthStatus(): Promise<AuthStatus> {
  // First check if we have a token at all
  const hasToken = await hasValidToken();
  if (!hasToken) {
    return { isAuthenticated: false };
  }

  try {
    const result = await apiRequest<VerifyResponse>("/api/extension/verify");

    return {
      isAuthenticated: result.valid,
      user: result.user,
    };
  } catch (error) {
    if (error instanceof ApiError && error.isAuthError()) {
      // Clear invalid token
      await clearToken();
      return { isAuthenticated: false };
    }

    // For network errors, assume still authenticated if we have a token
    if (error instanceof ApiError && error.isNetworkError()) {
      return {
        isAuthenticated: true, // Optimistic - we have a token
        user: undefined,
      };
    }

    throw error;
  }
}

/**
 * Get authentication status with Result wrapper (no exceptions)
 */
export async function getAuthStatusSafe(): AsyncResult<AuthStatus, ApiError> {
  try {
    const status = await getAuthStatus();
    return { success: true, data: status };
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, error };
    }
    return {
      success: false,
      error: new ApiError(
        error instanceof Error ? error.message : "Unknown error",
        0,
        "unknown"
      ),
    };
  }
}

/**
 * Request a new extension token
 * Requires being logged into SemesterHub web app (uses session cookies)
 * @returns TokenResponse with token and expiration
 * @throws ApiError on failure
 */
export async function requestToken(): Promise<TokenResponse> {
  return apiRequest<TokenResponse>("/api/extension/token", {
    credentials: "include", // Include session cookies
  });
}

/**
 * Request token and store it automatically
 * @returns Result with AuthStatus on success
 */
export async function requestAndStoreToken(): AsyncResult<AuthStatus, ApiError> {
  try {
    const tokenResponse = await requestToken();
    await storeToken(tokenResponse.token, tokenResponse.expiresAt);

    // Verify the new token
    const authStatus = await getAuthStatus();
    return { success: true, data: authStatus };
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, error };
    }
    return {
      success: false,
      error: new ApiError(
        error instanceof Error ? error.message : "Unknown error",
        0,
        "unknown"
      ),
    };
  }
}

/**
 * Log out by clearing stored token
 */
export async function logout(): Promise<void> {
  await clearToken();
}

// ========================================
// Health Check
// ========================================

/**
 * Check if the API is reachable
 * @returns true if API is responding, false otherwise
 */
export async function checkApiHealth(): Promise<boolean> {
  try {
    // Use a simple endpoint or just check if we can reach the server
    const response = await fetch(`${API_BASE_URL}/api/extension/verify`, {
      method: "HEAD",
    });
    return response.status !== 0;
  } catch {
    return false;
  }
}
