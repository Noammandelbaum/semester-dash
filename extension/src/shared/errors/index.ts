import { ErrorCodes, type ErrorCode } from './error-codes';
import { getUserMessage } from './user-messages';

export { ErrorCodes, type ErrorCode } from './error-codes';
export { UserMessages, getUserMessage } from './user-messages';

export class ExtensionError extends Error {
  constructor(
    public readonly code: ErrorCode | string,
    public readonly userMessage: string,
    public readonly originalError?: Error,
    public readonly context?: Record<string, unknown>
  ) {
    super(userMessage);
    this.name = 'ExtensionError';
  }

  toJSON() {
    return {
      code: this.code,
      message: this.userMessage,
      context: this.context,
    };
  }

  static fromJSON(json: { code: string; message: string; context?: Record<string, unknown> }): ExtensionError {
    return new ExtensionError(json.code, json.message, undefined, json.context);
  }
}

export function createError(
  code: ErrorCode | string,
  context?: Record<string, unknown>,
  originalError?: Error
): ExtensionError {
  const userMessage = getUserMessage(code);
  return new ExtensionError(code, userMessage, originalError, context);
}

export function isExtensionError(error: unknown): error is ExtensionError {
  return error instanceof ExtensionError;
}
