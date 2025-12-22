/**
 * Select Courses Step
 *
 * Second step - select which courses to track
 */

import type { ScrapedCourse } from '../../../shared/types';
import { createButton } from '../../components/Button';
import { createCheckbox, getCheckboxValue } from '../../components/Input';

export interface SelectCoursesOptions {
  courses: ScrapedCourse[];
  onNext: (selectedCourses: ScrapedCourse[]) => void;
  onBack: () => void;
}

/**
 * Create the course selection step view
 */
export function createSelectCourses(options: SelectCoursesOptions): HTMLElement {
  const { courses, onNext, onBack } = options;

  const container = document.createElement('div');
  container.className = 'sh-onboarding-step sh-select-courses';

  // Header
  const headerEl = document.createElement('div');
  headerEl.className = 'sh-step-header';

  const titleEl = document.createElement('h2');
  titleEl.className = 'sh-step-title';
  titleEl.textContent = 'בחירת קורסים';
  headerEl.appendChild(titleEl);

  const subtitleEl = document.createElement('p');
  subtitleEl.className = 'sh-step-subtitle';
  subtitleEl.textContent = 'בחרו את הקורסים שתרצו לעקוב אחריהם הסמסטר';
  headerEl.appendChild(subtitleEl);

  container.appendChild(headerEl);

  // Course list
  const listEl = document.createElement('div');
  listEl.className = 'sh-courses-list';

  // Select all checkbox
  const selectAllWrapper = document.createElement('div');
  selectAllWrapper.className = 'sh-select-all';

  const selectAllCheckbox = createCheckbox('בחר הכל', 'select-all', { checked: true });
  selectAllWrapper.appendChild(selectAllCheckbox);
  listEl.appendChild(selectAllWrapper);

  // Divider
  const divider = document.createElement('hr');
  divider.className = 'sh-divider';
  listEl.appendChild(divider);

  // Course checkboxes
  const courseCheckboxes: Map<string, HTMLElement> = new Map();

  courses.forEach((course) => {
    const courseWrapper = document.createElement('div');
    courseWrapper.className = 'sh-course-item';

    const checkbox = createCheckbox(course.name, `course-${course.moodleId}`, { checked: true });
    courseWrapper.appendChild(checkbox);

    // Optional: show course code if available
    if (course.courseCode) {
      const codeEl = document.createElement('span');
      codeEl.className = 'sh-course-code';
      codeEl.textContent = course.courseCode;
      courseWrapper.appendChild(codeEl);
    }

    listEl.appendChild(courseWrapper);
    courseCheckboxes.set(course.moodleId, checkbox);
  });

  container.appendChild(listEl);

  // Handle select all
  const selectAllInput = selectAllCheckbox.querySelector('input');
  if (selectAllInput) {
    selectAllInput.addEventListener('change', () => {
      const checked = selectAllInput.checked;
      courseCheckboxes.forEach((checkbox) => {
        const input = checkbox.querySelector('input');
        if (input) input.checked = checked;
      });
    });
  }

  // Update select all when individual checkboxes change
  courseCheckboxes.forEach((checkbox) => {
    const input = checkbox.querySelector('input');
    if (input) {
      input.addEventListener('change', () => {
        const allChecked = Array.from(courseCheckboxes.values()).every(
          (cb) => (cb.querySelector('input') as HTMLInputElement)?.checked
        );
        if (selectAllInput) selectAllInput.checked = allChecked;
      });
    }
  });

  // Actions
  const actionsEl = document.createElement('div');
  actionsEl.className = 'sh-step-actions';

  const backBtn = createButton('← חזרה', onBack, { variant: 'ghost' });
  actionsEl.appendChild(backBtn);

  const nextBtn = createButton('המשך →', () => {
    // Get selected courses
    const selectedCourses = courses.filter((course) => {
      const checkbox = courseCheckboxes.get(course.moodleId);
      return checkbox ? getCheckboxValue(checkbox) : false;
    });

    if (selectedCourses.length === 0) {
      alert('נא לבחור לפחות קורס אחד');
      return;
    }

    onNext(selectedCourses);
  }, { variant: 'primary' });
  actionsEl.appendChild(nextBtn);

  container.appendChild(actionsEl);

  // Selected count
  const countEl = document.createElement('p');
  countEl.className = 'sh-selected-count';

  const updateCount = () => {
    const count = Array.from(courseCheckboxes.values()).filter(
      (cb) => (cb.querySelector('input') as HTMLInputElement)?.checked
    ).length;
    countEl.textContent = `נבחרו ${count} מתוך ${courses.length} קורסים`;
  };

  updateCount();

  courseCheckboxes.forEach((checkbox) => {
    checkbox.querySelector('input')?.addEventListener('change', updateCount);
  });

  container.appendChild(countEl);

  return container;
}
