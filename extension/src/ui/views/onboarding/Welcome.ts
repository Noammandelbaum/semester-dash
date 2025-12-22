/**
 * Welcome Step
 *
 * First step of onboarding - welcome message and explanation
 */

import { createButton } from '../../components/Button';

export interface WelcomeOptions {
  onNext: () => void;
}

/**
 * Create the welcome step view
 */
export function createWelcome(options: WelcomeOptions): HTMLElement {
  const { onNext } = options;

  const container = document.createElement('div');
  container.className = 'sh-onboarding-welcome';

  // Logo/Icon
  const iconEl = document.createElement('div');
  iconEl.className = 'sh-welcome-icon';
  iconEl.textContent = '🎓';
  container.appendChild(iconEl);

  // Title
  const titleEl = document.createElement('h1');
  titleEl.className = 'sh-welcome-title';
  titleEl.textContent = 'ברוכים הבאים ל-SemesterHub!';
  container.appendChild(titleEl);

  // Description
  const descEl = document.createElement('p');
  descEl.className = 'sh-welcome-desc';
  descEl.textContent =
    'כאן תוכלו לראות את כל התרגילים שלכם במבט אחד. בעוד רגע נעבור על תהליך קצר של בחירת הקורסים.';
  container.appendChild(descEl);

  // Features list
  const featuresList = document.createElement('ul');
  featuresList.className = 'sh-welcome-features';

  const features = [
    '📊 תצוגה מצטברת של כל הקורסים',
    '✓ מעקב התקדמות אוטומטי',
    '📅 תזכורות לתאריכי הגשה',
    '🎯 ניהול בונוסים וחובות',
  ];

  features.forEach((feature) => {
    const li = document.createElement('li');
    li.textContent = feature;
    featuresList.appendChild(li);
  });

  container.appendChild(featuresList);

  // Start button
  const startBtn = createButton('בואו נתחיל', onNext, {
    variant: 'primary',
    size: 'lg',
  });
  startBtn.classList.add('sh-welcome-start-btn');
  container.appendChild(startBtn);

  return container;
}
