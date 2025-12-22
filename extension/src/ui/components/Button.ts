/**
 * Button Component
 *
 * Reusable button with variants: primary, secondary, ghost
 */

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Create a styled button element
 */
export function createButton(
  text: string,
  onClick: () => void,
  options: ButtonOptions = {}
): HTMLButtonElement {
  const {
    variant = 'primary',
    size = 'md',
    icon,
    disabled = false,
    className = '',
  } = options;

  const button = document.createElement('button');
  button.type = 'button';

  // Build class list
  const classes = ['sh-button', `sh-button-${variant}`, `sh-button-${size}`];
  if (className) classes.push(className);
  button.className = classes.join(' ');

  // Content
  if (icon) {
    button.innerHTML = `<span class="sh-button-icon">${icon}</span><span>${text}</span>`;
  } else {
    button.textContent = text;
  }

  // State
  button.disabled = disabled;
  if (disabled) {
    button.classList.add('sh-button-disabled');
  }

  // Event
  button.addEventListener('click', (e) => {
    e.preventDefault();
    if (!disabled) {
      onClick();
    }
  });

  return button;
}

/**
 * Create an icon-only button
 */
export function createIconButton(
  icon: string,
  onClick: () => void,
  ariaLabel: string,
  options: Omit<ButtonOptions, 'icon'> = {}
): HTMLButtonElement {
  const button = createButton('', onClick, { ...options, variant: options.variant ?? 'ghost' });
  button.innerHTML = `<span class="sh-button-icon">${icon}</span>`;
  button.setAttribute('aria-label', ariaLabel);
  button.classList.add('sh-button-icon-only');
  return button;
}
