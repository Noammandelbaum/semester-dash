/**
 * Keyboard Shortcuts Handler
 *
 * Provides global keyboard navigation and shortcuts for the dashboard.
 * Respects user's prefers-reduced-motion preference.
 *
 * Shortcuts:
 * - Space: Toggle assignment completion when focused on assignment item
 * - n: Open new assignment dialog (when not in input)
 * - ?: Show keyboard shortcuts help
 * - Esc: Close dialogs/modals
 *
 * Tab navigation is handled by the browser and focus styles.
 */

export type ShortcutAction =
  | 'toggleAssignment'
  | 'newAssignment'
  | 'showHelp'
  | 'closeDialog';

export interface KeyboardShortcut {
  key: string;
  action: ShortcutAction;
  description: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
}

/**
 * Available keyboard shortcuts
 */
export const SHORTCUTS: KeyboardShortcut[] = [
  {
    key: ' ',
    action: 'toggleAssignment',
    description: 'סמן/בטל סימון מטלה בפוקוס',
  },
  {
    key: 'n',
    action: 'newAssignment',
    description: 'צור מטלה חדשה',
  },
  {
    key: '?',
    action: 'showHelp',
    description: 'הצג קיצורי מקלדת',
    shiftKey: true,
  },
  {
    key: 'Escape',
    action: 'closeDialog',
    description: 'סגור חלון',
  },
];

/**
 * Check if an element is an input field
 */
function isInputElement(element: Element | null): boolean {
  if (!element) return false;
  const tagName = element.tagName.toLowerCase();
  return (
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select' ||
    element.getAttribute('contenteditable') === 'true'
  );
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Handle keyboard shortcut
 */
export function handleKeyboardShortcut(
  event: KeyboardEvent,
  callbacks: Partial<Record<ShortcutAction, () => void>>
): boolean {
  // Don't trigger shortcuts when typing in input fields
  if (isInputElement(event.target as Element)) {
    return false;
  }

  // Find matching shortcut
  for (const shortcut of SHORTCUTS) {
    const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
    const ctrlMatches = !!shortcut.ctrlKey === event.ctrlKey;
    const shiftMatches = !!shortcut.shiftKey === event.shiftKey;
    const altMatches = !!shortcut.altKey === event.altKey;

    if (keyMatches && ctrlMatches && shiftMatches && altMatches) {
      const callback = callbacks[shortcut.action];
      if (callback) {
        event.preventDefault();
        callback();
        return true;
      }
    }
  }

  return false;
}

/**
 * Hook for using keyboard shortcuts
 * @example
 * useKeyboardShortcuts({
 *   newAssignment: () => setDialogOpen(true),
 *   toggleAssignment: () => handleToggle(),
 * });
 */
export function useKeyboardShortcuts(
  callbacks: Partial<Record<ShortcutAction, () => void>>
) {
  if (typeof window === 'undefined') return;

  const handleKeyDown = (event: KeyboardEvent) => {
    handleKeyboardShortcut(event, callbacks);
  };

  // Add event listener
  window.addEventListener('keydown', handleKeyDown);

  // Cleanup
  return () => {
    window.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * Get formatted shortcut display string
 */
export function getShortcutDisplay(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];

  if (shortcut.ctrlKey) parts.push('Ctrl');
  if (shortcut.shiftKey) parts.push('Shift');
  if (shortcut.altKey) parts.push('Alt');

  // Format key for display
  let key = shortcut.key;
  if (key === ' ') key = 'Space';
  else if (key === 'Escape') key = 'Esc';
  else key = key.toUpperCase();

  parts.push(key);

  return parts.join(' + ');
}
