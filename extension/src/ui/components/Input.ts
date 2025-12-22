/**
 * Input Components
 *
 * Form input elements: text input, select, checkbox
 */

export interface InputOptions {
  type?: 'text' | 'number' | 'email' | 'password';
  placeholder?: string;
  value?: string | number;
  required?: boolean;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

/**
 * Create a labeled input field
 */
export function createInput(
  label: string,
  id: string,
  options: InputOptions = {}
): HTMLElement {
  const {
    type = 'text',
    placeholder = '',
    value = '',
    required = false,
    disabled = false,
    min,
    max,
    step,
    className = '',
  } = options;

  const wrapper = document.createElement('div');
  wrapper.className = `sh-input-wrapper ${className}`.trim();

  const labelEl = document.createElement('label');
  labelEl.htmlFor = id;
  labelEl.className = 'sh-input-label';
  labelEl.textContent = label;
  if (required) {
    labelEl.innerHTML += '<span class="sh-required">*</span>';
  }
  wrapper.appendChild(labelEl);

  const input = document.createElement('input');
  input.type = type;
  input.id = id;
  input.name = id;
  input.className = 'sh-input';
  input.placeholder = placeholder;
  input.value = String(value);
  input.required = required;
  input.disabled = disabled;

  if (type === 'number') {
    if (min !== undefined) input.min = String(min);
    if (max !== undefined) input.max = String(max);
    if (step !== undefined) input.step = String(step);
  }

  wrapper.appendChild(input);

  return wrapper;
}

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectOptions {
  value?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

/**
 * Create a labeled select dropdown
 */
export function createSelect(
  label: string,
  id: string,
  options: SelectOption[],
  selectOptions: SelectOptions = {}
): HTMLElement {
  const {
    value = '',
    required = false,
    disabled = false,
    placeholder,
    className = '',
  } = selectOptions;

  const wrapper = document.createElement('div');
  wrapper.className = `sh-input-wrapper ${className}`.trim();

  const labelEl = document.createElement('label');
  labelEl.htmlFor = id;
  labelEl.className = 'sh-input-label';
  labelEl.textContent = label;
  if (required) {
    labelEl.innerHTML += '<span class="sh-required">*</span>';
  }
  wrapper.appendChild(labelEl);

  const select = document.createElement('select');
  select.id = id;
  select.name = id;
  select.className = 'sh-select';
  select.required = required;
  select.disabled = disabled;

  // Placeholder option
  if (placeholder) {
    const placeholderOpt = document.createElement('option');
    placeholderOpt.value = '';
    placeholderOpt.textContent = placeholder;
    placeholderOpt.disabled = true;
    if (!value) placeholderOpt.selected = true;
    select.appendChild(placeholderOpt);
  }

  // Options
  options.forEach((opt) => {
    const optionEl = document.createElement('option');
    optionEl.value = opt.value;
    optionEl.textContent = opt.label;
    optionEl.disabled = opt.disabled ?? false;
    if (opt.value === value) optionEl.selected = true;
    select.appendChild(optionEl);
  });

  wrapper.appendChild(select);

  return wrapper;
}

export interface CheckboxOptions {
  checked?: boolean;
  disabled?: boolean;
  className?: string;
}

/**
 * Create a checkbox with label
 */
export function createCheckbox(
  label: string,
  id: string,
  options: CheckboxOptions = {}
): HTMLElement {
  const { checked = false, disabled = false, className = '' } = options;

  const wrapper = document.createElement('label');
  wrapper.className = `sh-checkbox ${className}`.trim();
  wrapper.htmlFor = id;

  const input = document.createElement('input');
  input.type = 'checkbox';
  input.id = id;
  input.name = id;
  input.checked = checked;
  input.disabled = disabled;

  const labelText = document.createElement('span');
  labelText.className = 'sh-checkbox-label';
  labelText.textContent = label;

  wrapper.appendChild(input);
  wrapper.appendChild(labelText);

  return wrapper;
}

/**
 * Get value from input/select element within wrapper
 */
export function getInputValue(wrapper: HTMLElement): string {
  const input = wrapper.querySelector<HTMLInputElement | HTMLSelectElement>('input, select');
  return input?.value ?? '';
}

/**
 * Get checkbox state
 */
export function getCheckboxValue(wrapper: HTMLElement): boolean {
  const input = wrapper.querySelector<HTMLInputElement>('input[type="checkbox"]');
  return input?.checked ?? false;
}

/**
 * Set input value
 */
export function setInputValue(wrapper: HTMLElement, value: string | number): void {
  const input = wrapper.querySelector<HTMLInputElement | HTMLSelectElement>('input, select');
  if (input) {
    input.value = String(value);
  }
}
