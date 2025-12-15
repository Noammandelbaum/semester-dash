/**
 * Popup Handlers index for SemesterHub Browser Extension
 * Exports all popup handler factories and instances
 */

export { createAuthHandler, AuthHandler, type AuthUICallbacks } from './auth.handler';
export { createSyncHandler, SyncHandler, type SyncUICallbacks } from './sync.handler';
export { createSectionHandler, SectionHandler, type SectionUICallbacks } from './section.handler';
