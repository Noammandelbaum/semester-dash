/**
 * Spinner Component
 *
 * Loading indicator
 */

export type SpinnerSize = 'sm' | 'md' | 'lg';

export interface SpinnerOptions {
  size?: SpinnerSize;
  message?: string;
}

/**
 * Create a spinner element
 */
export function createSpinner(options: SpinnerOptions = {}): HTMLElement {
  const { size = 'md', message } = options;

  const container = document.createElement('div');
  container.className = 'sh-loading';

  const spinner = document.createElement('div');
  spinner.className = `sh-spinner sh-spinner-${size}`;
  container.appendChild(spinner);

  if (message) {
    const text = document.createElement('p');
    text.textContent = message;
    container.appendChild(text);
  }

  return container;
}

/**
 * Create inline spinner (for buttons, etc.)
 */
export function createInlineSpinner(size: SpinnerSize = 'sm'): HTMLElement {
  const spinner = document.createElement('span');
  spinner.className = `sh-spinner-inline sh-spinner-${size}`;
  return spinner;
}
