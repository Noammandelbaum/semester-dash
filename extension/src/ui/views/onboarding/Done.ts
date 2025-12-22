/**
 * Done Step
 *
 * Final step - success message and redirect to dashboard
 */

import { createButton } from '../../components/Button';
import { createSpinner } from '../../components/Spinner';

export interface DoneOptions {
  coursesCount: number;
  onFinish: () => void;
  isSaving?: boolean;
  error?: string;
}

/**
 * Create the completion step view
 */
export function createDone(options: DoneOptions): HTMLElement {
  const { coursesCount, onFinish, isSaving = false, error } = options;

  const container = document.createElement('div');
  container.className = 'sh-onboarding-done';

  if (isSaving) {
    // Loading state
    const spinner = createSpinner({ message: 'שומר נתונים...' });
    container.appendChild(spinner);
    return container;
  }

  if (error) {
    // Error state
    const iconEl = document.createElement('div');
    iconEl.className = 'sh-done-icon sh-done-error';
    iconEl.textContent = '❌';
    container.appendChild(iconEl);

    const titleEl = document.createElement('h2');
    titleEl.className = 'sh-done-title';
    titleEl.textContent = 'אופס, משהו השתבש';
    container.appendChild(titleEl);

    const errorEl = document.createElement('p');
    errorEl.className = 'sh-done-error-message';
    errorEl.textContent = error;
    container.appendChild(errorEl);

    const retryBtn = createButton('נסה שוב', onFinish, { variant: 'primary' });
    container.appendChild(retryBtn);

    return container;
  }

  // Success state
  const iconEl = document.createElement('div');
  iconEl.className = 'sh-done-icon';
  iconEl.textContent = '🎉';
  container.appendChild(iconEl);

  const titleEl = document.createElement('h2');
  titleEl.className = 'sh-done-title';
  titleEl.textContent = 'מעולה! הכל מוכן';
  container.appendChild(titleEl);

  const descEl = document.createElement('p');
  descEl.className = 'sh-done-desc';
  descEl.textContent = `נוספו ${coursesCount} קורסים לדשבורד שלך. עכשיו תוכל לראות את כל התרגילים במבט אחד!`;
  container.appendChild(descEl);

  // Tips
  const tipsList = document.createElement('ul');
  tipsList.className = 'sh-done-tips';

  const tips = [
    'לחץ על כותרת קורס כדי לערוך את הפרטים',
    'הסינכרון מתבצע אוטומטית כשאתה נכנס ל-Moodle',
    'ניתן לעדכן הגדרות בכל עת מתפריט ההגדרות',
  ];

  tips.forEach((tip) => {
    const li = document.createElement('li');
    li.textContent = tip;
    tipsList.appendChild(li);
  });

  container.appendChild(tipsList);

  // Finish button
  const finishBtn = createButton('לדשבורד', onFinish, {
    variant: 'primary',
    size: 'lg',
  });
  finishBtn.classList.add('sh-done-finish-btn');
  container.appendChild(finishBtn);

  return container;
}
