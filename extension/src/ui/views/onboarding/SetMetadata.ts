/**
 * Set Metadata Step
 *
 * Fourth step - set credits and assignment counts per course (optional)
 */

import type { ScrapedCourse } from '../../../shared/types';
import { COURSE_COLORS } from '../../../shared/types';
import { createButton } from '../../components/Button';
import { createInput, getInputValue } from '../../components/Input';

export interface CourseMetadata {
  moodleId: string;
  credits: number | undefined;
  totalAssignments: number | undefined;
  requiredAssignments: number | undefined;
  assignmentWeight: number | undefined;
  color: string;
}

export interface SetMetadataOptions {
  courses: ScrapedCourse[];
  onNext: (metadata: CourseMetadata[]) => void;
  onBack: () => void;
  onSkip: () => void;
}

/**
 * Create the metadata input step view
 */
export function createSetMetadata(options: SetMetadataOptions): HTMLElement {
  const { courses, onNext, onBack, onSkip } = options;

  const container = document.createElement('div');
  container.className = 'sh-onboarding-step sh-set-metadata';

  // Header
  const headerEl = document.createElement('div');
  headerEl.className = 'sh-step-header';

  const titleEl = document.createElement('h2');
  titleEl.className = 'sh-step-title';
  titleEl.textContent = 'הגדרות קורסים';
  headerEl.appendChild(titleEl);

  const subtitleEl = document.createElement('p');
  subtitleEl.className = 'sh-step-subtitle';
  subtitleEl.textContent =
    'הזינו פרטים נוספים על כל קורס (אופציונלי - ניתן לערוך גם אחר כך)';
  headerEl.appendChild(subtitleEl);

  container.appendChild(headerEl);

  // Course cards
  const cardsEl = document.createElement('div');
  cardsEl.className = 'sh-metadata-cards';

  // Store input references
  const inputsMap: Map<
    string,
    {
      credits: HTMLElement;
      total: HTMLElement;
      required: HTMLElement;
      weight: HTMLElement;
    }
  > = new Map();

  courses.forEach((course, index) => {
    const card = document.createElement('div');
    card.className = 'sh-metadata-card';

    // Card header with color
    const cardHeader = document.createElement('div');
    cardHeader.className = 'sh-metadata-card-header';
    cardHeader.style.backgroundColor = COURSE_COLORS[index % COURSE_COLORS.length];

    const courseName = document.createElement('span');
    courseName.className = 'sh-metadata-card-name';
    courseName.textContent = course.name;
    cardHeader.appendChild(courseName);

    card.appendChild(cardHeader);

    // Card body with inputs
    const cardBody = document.createElement('div');
    cardBody.className = 'sh-metadata-card-body';

    // Row 1: Credits + Weight
    const row1 = document.createElement('div');
    row1.className = 'sh-metadata-row';

    const creditsInput = createInput('נקודות זכות', `credits-${course.moodleId}`, {
      type: 'number',
      placeholder: '3',
      min: 0,
      max: 10,
      step: 0.5,
    });
    row1.appendChild(creditsInput);

    const weightInput = createInput('אחוז מהציון', `weight-${course.moodleId}`, {
      type: 'number',
      placeholder: '30',
      min: 0,
      max: 100,
    });
    row1.appendChild(weightInput);

    cardBody.appendChild(row1);

    // Row 2: Total + Required
    const row2 = document.createElement('div');
    row2.className = 'sh-metadata-row';

    const totalInput = createInput('סה"כ הגשות', `total-${course.moodleId}`, {
      type: 'number',
      placeholder: '13',
      min: 1,
      max: 30,
    });
    row2.appendChild(totalInput);

    const requiredInput = createInput('הגשות חובה', `required-${course.moodleId}`, {
      type: 'number',
      placeholder: '10',
      min: 0,
      max: 30,
    });
    row2.appendChild(requiredInput);

    cardBody.appendChild(row2);

    card.appendChild(cardBody);
    cardsEl.appendChild(card);

    // Store references
    inputsMap.set(course.moodleId, {
      credits: creditsInput,
      total: totalInput,
      required: requiredInput,
      weight: weightInput,
    });
  });

  container.appendChild(cardsEl);

  // Actions
  const actionsEl = document.createElement('div');
  actionsEl.className = 'sh-step-actions';

  const backBtn = createButton('← חזרה', onBack, { variant: 'ghost' });
  actionsEl.appendChild(backBtn);

  const skipBtn = createButton('דלג', () => {
    // Skip with default values
    const defaultMetadata: CourseMetadata[] = courses.map((course, index) => ({
      moodleId: course.moodleId,
      credits: undefined,
      totalAssignments: 13,
      requiredAssignments: 10,
      assignmentWeight: undefined,
      color: COURSE_COLORS[index % COURSE_COLORS.length],
    }));
    onSkip();
    onNext(defaultMetadata);
  }, { variant: 'secondary' });
  actionsEl.appendChild(skipBtn);

  const nextBtn = createButton('סיום →', () => {
    // Collect metadata
    const metadata: CourseMetadata[] = courses.map((course, index) => {
      const inputs = inputsMap.get(course.moodleId)!;

      const creditsVal = getInputValue(inputs.credits);
      const totalVal = getInputValue(inputs.total);
      const requiredVal = getInputValue(inputs.required);
      const weightVal = getInputValue(inputs.weight);

      return {
        moodleId: course.moodleId,
        credits: creditsVal ? parseFloat(creditsVal) : undefined,
        totalAssignments: totalVal ? parseInt(totalVal, 10) : 13,
        requiredAssignments: requiredVal ? parseInt(requiredVal, 10) : undefined,
        assignmentWeight: weightVal ? parseInt(weightVal, 10) : undefined,
        color: COURSE_COLORS[index % COURSE_COLORS.length],
      };
    });

    // Validate required <= total
    for (const m of metadata) {
      if (
        m.requiredAssignments !== undefined &&
        m.totalAssignments !== undefined &&
        m.requiredAssignments > m.totalAssignments
      ) {
        alert('מספר הגשות החובה לא יכול להיות גדול ממספר ההגשות הכולל');
        return;
      }
    }

    onNext(metadata);
  }, { variant: 'primary' });
  actionsEl.appendChild(nextBtn);

  container.appendChild(actionsEl);

  // Help text
  const helpEl = document.createElement('p');
  helpEl.className = 'sh-step-help';
  helpEl.textContent =
    'טיפ: ניתן להשאיר שדות ריקים ולערוך אותם אחר כך מתוך הדשבורד';
  container.appendChild(helpEl);

  return container;
}
