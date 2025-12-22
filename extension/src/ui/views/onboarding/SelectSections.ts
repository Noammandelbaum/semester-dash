/**
 * Select Sections Step
 *
 * Third step - select which teaching sections to track per course
 */

import type { ScrapedCourse } from '../../../shared/types';
import { createButton } from '../../components/Button';
import { createCheckbox, getCheckboxValue } from '../../components/Input';

export interface CourseWithSections {
  course: ScrapedCourse;
  sections: string[];
}

export interface SelectedCourseWithSections {
  course: ScrapedCourse;
  selectedSections: string[];
}

export interface SelectSectionsOptions {
  courses: CourseWithSections[];
  onNext: (selected: SelectedCourseWithSections[]) => void;
  onBack: () => void;
}

/**
 * Create the section selection step view
 */
export function createSelectSections(options: SelectSectionsOptions): HTMLElement {
  const { courses, onNext, onBack } = options;

  const container = document.createElement('div');
  container.className = 'sh-onboarding-step sh-select-sections';

  // Header
  const headerEl = document.createElement('div');
  headerEl.className = 'sh-step-header';

  const titleEl = document.createElement('h2');
  titleEl.className = 'sh-step-title';
  titleEl.textContent = 'בחירת יחידות הוראה';
  headerEl.appendChild(titleEl);

  const subtitleEl = document.createElement('p');
  subtitleEl.className = 'sh-step-subtitle';
  subtitleEl.textContent = 'בחרו אילו יחידות הוראה (sections) לעקוב אחריהן בכל קורס';
  headerEl.appendChild(subtitleEl);

  container.appendChild(headerEl);

  // Courses accordion
  const accordionEl = document.createElement('div');
  accordionEl.className = 'sh-sections-accordion';

  // Store checkboxes for each course
  const courseSectionCheckboxes: Map<string, Map<string, HTMLElement>> = new Map();

  courses.forEach((courseData, index) => {
    const { course, sections } = courseData;

    const coursePanel = document.createElement('div');
    coursePanel.className = 'sh-accordion-panel';

    // Panel header (clickable)
    const panelHeader = document.createElement('div');
    panelHeader.className = 'sh-accordion-header';
    panelHeader.setAttribute('role', 'button');
    panelHeader.setAttribute('tabindex', '0');

    const courseName = document.createElement('span');
    courseName.className = 'sh-accordion-title';
    courseName.textContent = course.name;
    panelHeader.appendChild(courseName);

    const sectionCount = document.createElement('span');
    sectionCount.className = 'sh-accordion-count';
    sectionCount.textContent = `${sections.length} יחידות`;
    panelHeader.appendChild(sectionCount);

    const expandIcon = document.createElement('span');
    expandIcon.className = 'sh-accordion-icon';
    expandIcon.textContent = '▼';
    panelHeader.appendChild(expandIcon);

    coursePanel.appendChild(panelHeader);

    // Panel content (sections)
    const panelContent = document.createElement('div');
    panelContent.className = 'sh-accordion-content';
    panelContent.style.display = index === 0 ? 'block' : 'none'; // First open

    // Select all for this course
    const selectAllWrapper = document.createElement('div');
    selectAllWrapper.className = 'sh-section-select-all';

    const selectAllCheckbox = createCheckbox('בחר הכל', `sections-all-${course.moodleId}`, {
      checked: true,
    });
    selectAllWrapper.appendChild(selectAllCheckbox);
    panelContent.appendChild(selectAllWrapper);

    // Section checkboxes
    const sectionCheckboxes: Map<string, HTMLElement> = new Map();

    sections.forEach((section) => {
      const sectionWrapper = document.createElement('div');
      sectionWrapper.className = 'sh-section-item';

      const checkbox = createCheckbox(
        section,
        `section-${course.moodleId}-${section.replace(/\s+/g, '-')}`,
        { checked: true }
      );
      sectionWrapper.appendChild(checkbox);
      panelContent.appendChild(sectionWrapper);
      sectionCheckboxes.set(section, checkbox);
    });

    courseSectionCheckboxes.set(course.moodleId, sectionCheckboxes);

    // Handle select all
    const selectAllInput = selectAllCheckbox.querySelector('input');
    if (selectAllInput) {
      selectAllInput.addEventListener('change', () => {
        const checked = selectAllInput.checked;
        sectionCheckboxes.forEach((checkbox) => {
          const input = checkbox.querySelector('input');
          if (input) input.checked = checked;
        });
      });
    }

    // Update select all when individual checkboxes change
    sectionCheckboxes.forEach((checkbox) => {
      const input = checkbox.querySelector('input');
      if (input) {
        input.addEventListener('change', () => {
          const allChecked = Array.from(sectionCheckboxes.values()).every(
            (cb) => (cb.querySelector('input') as HTMLInputElement)?.checked
          );
          if (selectAllInput) selectAllInput.checked = allChecked;
        });
      }
    });

    coursePanel.appendChild(panelContent);

    // Toggle accordion
    panelHeader.addEventListener('click', () => {
      const isOpen = panelContent.style.display !== 'none';
      panelContent.style.display = isOpen ? 'none' : 'block';
      expandIcon.textContent = isOpen ? '▼' : '▲';
      panelHeader.classList.toggle('sh-accordion-open', !isOpen);
    });

    panelHeader.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        panelHeader.click();
      }
    });

    // Set initial state for first panel
    if (index === 0) {
      panelHeader.classList.add('sh-accordion-open');
      expandIcon.textContent = '▲';
    }

    accordionEl.appendChild(coursePanel);
  });

  container.appendChild(accordionEl);

  // Actions
  const actionsEl = document.createElement('div');
  actionsEl.className = 'sh-step-actions';

  const backBtn = createButton('← חזרה', onBack, { variant: 'ghost' });
  actionsEl.appendChild(backBtn);

  const nextBtn = createButton('המשך →', () => {
    // Get selected sections for each course
    const selected: SelectedCourseWithSections[] = courses.map(({ course }) => {
      const sectionCheckboxes = courseSectionCheckboxes.get(course.moodleId);
      const selectedSections: string[] = [];

      if (sectionCheckboxes) {
        sectionCheckboxes.forEach((checkbox, sectionName) => {
          if (getCheckboxValue(checkbox)) {
            selectedSections.push(sectionName);
          }
        });
      }

      return { course, selectedSections };
    });

    // Validate at least one section per course
    const invalidCourses = selected.filter((s) => s.selectedSections.length === 0);
    if (invalidCourses.length > 0) {
      alert(`נא לבחור לפחות יחידת הוראה אחת לכל קורס`);
      return;
    }

    onNext(selected);
  }, { variant: 'primary' });
  actionsEl.appendChild(nextBtn);

  container.appendChild(actionsEl);

  return container;
}
