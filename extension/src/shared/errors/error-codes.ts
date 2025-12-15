export const ErrorCodes = {
  // Network errors (1xxx)
  NETWORK_OFFLINE: 'E1001',
  NETWORK_TIMEOUT: 'E1002',
  NETWORK_UNKNOWN: 'E1003',

  // Auth errors (2xxx)
  AUTH_TOKEN_EXPIRED: 'E2001',
  AUTH_TOKEN_INVALID: 'E2002',
  AUTH_NOT_LOGGED_IN: 'E2003',
  AUTH_SESSION_EXPIRED: 'E2004',

  // Sync errors (3xxx)
  SYNC_ALREADY_IN_PROGRESS: 'E3001',
  SYNC_NO_COURSES: 'E3002',
  SYNC_TAB_FAILED: 'E3003',
  SYNC_SCRAPE_FAILED: 'E3004',
  SYNC_API_FAILED: 'E3005',

  // Content script errors (4xxx)
  CONTENT_NOT_MOODLE: 'E4001',
  CONTENT_NOT_LOADED: 'E4002',
  CONTENT_TIMEOUT: 'E4003',

  // Moodle errors (5xxx)
  MOODLE_NOT_LOGGED_IN: 'E5001',
  MOODLE_LOGIN_TIMEOUT: 'E5002',
  MOODLE_WINDOW_CLOSED: 'E5003',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];
