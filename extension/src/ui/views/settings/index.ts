/**
 * Settings View
 *
 * User settings and preferences
 */

import type { UserSettings } from '../../../shared/types';
import { DEFAULT_USER_SETTINGS } from '../../../shared/types';
import { createPageHeader } from '../../components/Header';
import { createButton } from '../../components/Button';
import { createCheckbox, createSelect, getCheckboxValue } from '../../components/Input';
import { showConfirmModal } from '../../components/Modal';

// ========================================
// Types
// ========================================

export interface SettingsData {
  settings: UserSettings;
  onSave: (settings: UserSettings) => void;
  onClearData: () => void;
  onBack: () => void;
  extensionVersion?: string;
}

// ========================================
// State
// ========================================

let containerRef: HTMLElement | null = null;
let dataRef: SettingsData | null = null;
let currentSettings: UserSettings = { ...DEFAULT_USER_SETTINGS };

// ========================================
// Rendering
// ========================================

/**
 * Render the settings view
 */
function render(): void {
  if (!containerRef || !dataRef) return;

  containerRef.innerHTML = '';
  containerRef.className = 'sh-settings';

  // Header
  const header = createPageHeader('הגדרות', dataRef.onBack);
  containerRef.appendChild(header);

  // Main content
  const main = document.createElement('main');
  main.className = 'sh-settings-main';

  // Display section
  const displaySection = createSection('תצוגה', [
    createDisplaySettings(),
  ]);
  main.appendChild(displaySection);

  // Theme section
  const themeSection = createSection('ערכת נושא', [
    createThemeSettings(),
  ]);
  main.appendChild(themeSection);

  // Data section
  const dataSection = createSection('נתונים', [
    createDataSettings(),
  ]);
  main.appendChild(dataSection);

  // About section
  const aboutSection = createSection('אודות', [
    createAboutSection(),
  ]);
  main.appendChild(aboutSection);

  containerRef.appendChild(main);

  // Save button (floating)
  const saveBar = document.createElement('div');
  saveBar.className = 'sh-settings-save-bar';

  const saveBtn = createButton('שמירת שינויים', handleSave, {
    variant: 'primary',
    size: 'lg',
  });
  saveBar.appendChild(saveBtn);

  containerRef.appendChild(saveBar);
}

/**
 * Create a section wrapper
 */
function createSection(title: string, content: HTMLElement[]): HTMLElement {
  const section = document.createElement('section');
  section.className = 'sh-settings-section';

  const titleEl = document.createElement('h3');
  titleEl.className = 'sh-section-title';
  titleEl.textContent = title;
  section.appendChild(titleEl);

  const card = document.createElement('div');
  card.className = 'sh-card';
  content.forEach((el) => card.appendChild(el));
  section.appendChild(card);

  return section;
}

/**
 * Create display settings
 */
function createDisplaySettings(): HTMLElement {
  const container = document.createElement('div');
  container.className = 'sh-settings-group';

  // Show completed checkbox
  const showCompletedCheckbox = createCheckbox(
    'הצג הגשות שהושלמו',
    'show-completed',
    { checked: currentSettings.showCompleted }
  );

  const showCompletedInput = showCompletedCheckbox.querySelector('input');
  if (showCompletedInput) {
    showCompletedInput.addEventListener('change', () => {
      currentSettings.showCompleted = showCompletedInput.checked;
    });
  }

  container.appendChild(showCompletedCheckbox);

  // Description
  const desc = document.createElement('p');
  desc.className = 'sh-settings-desc';
  desc.textContent = 'כשמסומן, יוצגו גם הגשות שכבר הושלמו בצורה מלאה';
  container.appendChild(desc);

  return container;
}

/**
 * Create theme settings
 */
function createThemeSettings(): HTMLElement {
  const container = document.createElement('div');
  container.className = 'sh-settings-group';

  const themeSelect = createSelect(
    'ערכת נושא',
    'theme',
    [
      { value: 'auto', label: 'אוטומטי (לפי המערכת)' },
      { value: 'light', label: 'בהיר' },
      { value: 'dark', label: 'כהה' },
    ],
    { value: currentSettings.theme }
  );

  const selectEl = themeSelect.querySelector('select');
  if (selectEl) {
    selectEl.addEventListener('change', () => {
      currentSettings.theme = selectEl.value as 'light' | 'dark' | 'auto';
    });
  }

  container.appendChild(themeSelect);

  return container;
}

/**
 * Create data settings
 */
function createDataSettings(): HTMLElement {
  const container = document.createElement('div');
  container.className = 'sh-settings-group';

  // Clear data button
  const clearBtn = createButton('מחיקת כל הנתונים', handleClearData, {
    variant: 'secondary',
  });
  clearBtn.classList.add('sh-btn-danger');
  container.appendChild(clearBtn);

  // Warning text
  const warning = document.createElement('p');
  warning.className = 'sh-settings-warning';
  warning.textContent = 'פעולה זו תמחק את כל הנתונים המקומיים ותתחיל מחדש';
  container.appendChild(warning);

  return container;
}

/**
 * Create about section
 */
function createAboutSection(): HTMLElement {
  const container = document.createElement('div');
  container.className = 'sh-settings-about';

  // Version
  const versionEl = document.createElement('div');
  versionEl.className = 'sh-about-row';

  const versionLabel = document.createElement('span');
  versionLabel.textContent = 'גרסה:';
  versionEl.appendChild(versionLabel);

  const versionValue = document.createElement('span');
  versionValue.textContent = dataRef?.extensionVersion ?? '1.0.0';
  versionEl.appendChild(versionValue);

  container.appendChild(versionEl);

  // Links
  const linksEl = document.createElement('div');
  linksEl.className = 'sh-about-links';

  const links = [
    { text: 'דווח על בעיה', url: 'https://github.com/semesterhub/extension/issues' },
    { text: 'תנאי שימוש', url: 'https://semesterhub.club/terms' },
    { text: 'מדיניות פרטיות', url: 'https://semesterhub.club/privacy' },
  ];

  links.forEach((link) => {
    const a = document.createElement('a');
    a.href = link.url;
    a.textContent = link.text;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    linksEl.appendChild(a);
  });

  container.appendChild(linksEl);

  // Credits
  const credits = document.createElement('p');
  credits.className = 'sh-about-credits';
  credits.textContent = 'נבנה עם ❤️ לסטודנטים ישראליים';
  container.appendChild(credits);

  return container;
}

// ========================================
// Event Handlers
// ========================================

function handleSave(): void {
  if (!dataRef) return;
  dataRef.onSave(currentSettings);
}

function handleClearData(): void {
  if (!dataRef) return;

  showConfirmModal(
    'מחיקת נתונים',
    'האם אתה בטוח שברצונך למחוק את כל הנתונים? פעולה זו לא ניתנת לביטול.',
    () => {
      dataRef?.onClearData();
    }
  );
}

// ========================================
// Main Export
// ========================================

/**
 * Render the settings view
 */
export function renderSettings(container: HTMLElement, data: SettingsData): void {
  containerRef = container;
  dataRef = data;
  currentSettings = { ...data.settings };

  render();
}

/**
 * Reset settings state
 */
export function resetSettings(): void {
  containerRef = null;
  dataRef = null;
  currentSettings = { ...DEFAULT_USER_SETTINGS };
}
