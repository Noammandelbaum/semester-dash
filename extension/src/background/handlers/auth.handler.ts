/**
 * Authentication Handler for SemesterHub extension
 * Manages authentication token storage and validation in the background service worker
 */

import { storageService } from '../services/storage.service';
import { statusService } from '../services/status.service';
import { ApiError } from '../../shared/api';
import type { AuthStatus, TokenResponse, VerifyResponse } from '../../shared/types';
import { API_BASE_URL } from '../../shared/config';

/**
 * Token expiry buffer (5 minutes)
 * Tokens are considered expired if they expire within this window
 */
const TOKEN_EXPIRY_BUFFER_MS = 5 * 60 * 1000;

/**
 * AuthHandler class
 * Handles all authentication-related operations
 */
export class AuthHandler {
  /**
   * Store authentication token from webapp
   * @param token - JWT token from backend
   * @param expiresAt - ISO datetime string when token expires
   * @returns Success response
   */
  async handleSetAuthToken(token: string, expiresAt: string): Promise<{ success: boolean }> {
    try {
      await storageService.setAuthToken(token, expiresAt);

      // Validate the token immediately and update auth status
      const authStatus = await this.validateAndRefreshIfNeeded();
      statusService.setAuthStatus(authStatus);

      console.log('[AuthHandler] Token stored and validated');
      return { success: true };
    } catch (error) {
      console.error('[AuthHandler] Failed to store token:', error);

      // Clear invalid token
      await storageService.clearAuthToken();
      statusService.setAuthStatus({ isAuthenticated: false });

      throw error;
    }
  }

  /**
   * Get stored authentication token
   * @returns Token and expiration date or null if not found
   */
  async handleGetAuthToken(): Promise<{ token: string | null; expiresAt: string | null }> {
    return await storageService.getAuthToken();
  }

  /**
   * Clear authentication token (logout)
   * @returns Success response
   */
  async handleClearAuthToken(): Promise<{ success: boolean }> {
    await storageService.clearAuthToken();
    statusService.setAuthStatus({ isAuthenticated: false });

    console.log('[AuthHandler] Token cleared');
    return { success: true };
  }

  /**
   * Get full authentication status
   * Checks if token exists, is valid, and not expired
   * @returns AuthStatus with authentication state and user info
   */
  async handleGetAuthStatus(): Promise<AuthStatus> {
    const authStatus = await this.validateAndRefreshIfNeeded();

    // Update cached status in statusService
    statusService.setAuthStatus(authStatus);

    return authStatus;
  }

  /**
   * Validate token and check expiry
   * If token is expired or invalid, clears it and returns unauthenticated status
   * @returns AuthStatus with current authentication state
   */
  async validateAndRefreshIfNeeded(): Promise<AuthStatus> {
    // First check if token exists
    const { token, expiresAt } = await storageService.getAuthToken();

    if (!token) {
      return { isAuthenticated: false };
    }

    // Check if token is expired
    const isExpired = await this.isTokenExpired();
    if (isExpired) {
      console.log('[AuthHandler] Token expired, clearing');
      await storageService.clearAuthToken();
      return { isAuthenticated: false };
    }

    // Validate token with backend
    try {
      const verifyResult = await this.verifyTokenWithBackend(token);

      if (!verifyResult.valid) {
        console.log('[AuthHandler] Token invalid, clearing');
        await storageService.clearAuthToken();
        return { isAuthenticated: false };
      }

      // Token is valid
      return {
        isAuthenticated: true,
        user: verifyResult.user,
        tokenExpiresAt: expiresAt || undefined,
      };
    } catch (error) {
      console.error('[AuthHandler] Token validation failed:', error);

      // On any error, clear token and return unauthenticated
      // This is safer than assuming we're still authenticated
      await storageService.clearAuthToken();
      return { isAuthenticated: false };
    }
  }

  /**
   * Check if stored token is expired
   * Considers token expired if it expires within TOKEN_EXPIRY_BUFFER_MS
   * @returns true if token is expired or missing
   */
  async isTokenExpired(): Promise<boolean> {
    const { token, expiresAt } = await storageService.getAuthToken();

    if (!token || !expiresAt) {
      return true;
    }

    const expiryDate = new Date(expiresAt);
    const now = Date.now();

    // Token is expired if it expires within the buffer window
    return expiryDate.getTime() - TOKEN_EXPIRY_BUFFER_MS < now;
  }

  /**
   * Verify token with backend
   * @param token - JWT token to verify
   * @returns Verify response from backend
   * @throws ApiError if verification fails
   * @private
   */
  private async verifyTokenWithBackend(token: string): Promise<VerifyResponse> {
    const url = `${API_BASE_URL}/api/extension/verify`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: `HTTP ${response.status}`,
        }));

        throw new ApiError(
          errorData.error || errorData.message || `HTTP ${response.status}`,
          response.status,
          response.status === 401 ? 'auth' : 'unknown'
        );
      }

      return response.json();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      // Network or other errors
      throw new ApiError(
        error instanceof Error ? error.message : 'Token verification failed',
        0,
        'network'
      );
    }
  }
}

// Export singleton instance
export const authHandler = new AuthHandler();
