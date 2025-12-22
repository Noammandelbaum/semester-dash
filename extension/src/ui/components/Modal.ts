/**
 * Modal Component
 *
 * Overlay modal dialog
 */

import { createButton, createIconButton } from './Button';

export interface ModalOptions {
  showClose?: boolean;
  closeOnBackdrop?: boolean;
  onClose?: () => void;
}

/**
 * Create a modal dialog
 */
export function createModal(
  title: string,
  content: HTMLElement | string,
  options: ModalOptions = {}
): HTMLElement {
  const { showClose = true, closeOnBackdrop = true, onClose } = options;

  // Backdrop
  const backdrop = document.createElement('div');
  backdrop.className = 'sh-modal-backdrop';
  backdrop.style.display = 'none';

  // Modal container
  const modal = document.createElement('div');
  modal.className = 'sh-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-labelledby', 'sh-modal-title');

  // Header
  const header = document.createElement('div');
  header.className = 'sh-modal-header';

  const titleEl = document.createElement('h2');
  titleEl.id = 'sh-modal-title';
  titleEl.className = 'sh-modal-title';
  titleEl.textContent = title;
  header.appendChild(titleEl);

  if (showClose) {
    const closeBtn = createIconButton('✕', () => hideModal(backdrop), 'סגירה');
    closeBtn.classList.add('sh-modal-close');
    header.appendChild(closeBtn);
  }

  modal.appendChild(header);

  // Body
  const body = document.createElement('div');
  body.className = 'sh-modal-body';
  if (typeof content === 'string') {
    body.innerHTML = content;
  } else {
    body.appendChild(content);
  }
  modal.appendChild(body);

  // Append modal to backdrop
  backdrop.appendChild(modal);

  // Close on backdrop click
  if (closeOnBackdrop) {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        hideModal(backdrop);
      }
    });
  }

  // Store onClose callback
  if (onClose) {
    (backdrop as unknown as { _onClose: () => void })._onClose = onClose;
  }

  // Close on Escape key
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      hideModal(backdrop);
    }
  };
  backdrop.addEventListener('keydown', handleEscape);

  return backdrop;
}

/**
 * Show a modal
 */
export function showModal(modal: HTMLElement): void {
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';

  // Focus first focusable element
  const firstFocusable = modal.querySelector<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  firstFocusable?.focus();
}

/**
 * Hide a modal
 */
export function hideModal(modal: HTMLElement): void {
  modal.style.display = 'none';
  document.body.style.overflow = '';

  // Call onClose callback if exists
  const onClose = (modal as unknown as { _onClose?: () => void })._onClose;
  if (onClose) {
    onClose();
  }
}

/**
 * Create and show a confirmation modal
 */
export function showConfirmModal(
  title: string,
  message: string,
  onConfirm: () => void,
  onCancel?: () => void
): void {
  const content = document.createElement('div');

  const messageEl = document.createElement('p');
  messageEl.textContent = message;
  messageEl.className = 'sh-modal-message';
  content.appendChild(messageEl);

  const actions = document.createElement('div');
  actions.className = 'sh-modal-actions';

  let modalEl: HTMLElement;

  const confirmBtn = createButton('אישור', () => {
    hideModal(modalEl);
    onConfirm();
  }, { variant: 'primary' });

  const cancelBtn = createButton('ביטול', () => {
    hideModal(modalEl);
    onCancel?.();
  }, { variant: 'secondary' });

  actions.appendChild(confirmBtn);
  actions.appendChild(cancelBtn);
  content.appendChild(actions);

  modalEl = createModal(title, content, { showClose: false });
  document.body.appendChild(modalEl);
  showModal(modalEl);
}
