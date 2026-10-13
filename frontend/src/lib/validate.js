import { MAX_CAPACITY } from '../data/constants.js';
import { costTotal, fromDateAndTime, fromDateTimeInput } from './format.js';

// The C3 "Valid activity?" checks. Keep these in sync with the CHECK constraints
// and the create_activity procedure once the database is built.
export function validateActivity(form, existing, now = new Date()) {
  const errors = {};

  const title = form.title.trim();
  if (!title) errors.title = 'Give the activity a title.';
  else if (title.length > 200) errors.title = 'Keep the title under 200 characters.';

  if (!form.description.trim()) errors.description = 'Describe the activity.';

  const start = fromDateAndTime(form.date, form.startTime);
  const end = fromDateAndTime(form.date, form.endTime);
  if (!start || !end) errors.time = 'Pick a date, a start time and an end time.';
  else if (end <= start) errors.time = 'The end time must be after the start time.';
  else if (start <= now) errors.time = 'The activity must start in the future.';

  const deadline = fromDateTimeInput(form.deadline);
  if (!deadline) errors.deadline = 'Set a registration deadline.';
  else if (deadline <= now) errors.deadline = 'Registration must close in the future.';
  else if (start && deadline >= start) errors.deadline = 'Registration must close before the activity starts.';

  const confirmed = existing?.confirmedCount ?? 1;
  if (!(form.min >= 1)) errors.capacity = 'The minimum must be at least 1.';
  else if (form.max < form.min) errors.capacity = 'The minimum must be less than or equal to the maximum.';
  else if (form.max > MAX_CAPACITY) errors.capacity = `The maximum is ${MAX_CAPACITY} people.`;
  else if (form.max < confirmed) errors.capacity = `${confirmed} people are already confirmed, so the maximum cannot go below that.`;

  if (costTotal(form.costItems) > 0) {
    errors.costItems = 'Paid activity saving will be connected in the costs task. Remove cost items to save this draft.';
  }

  if (form.rules.length > 0) errors.rules = 'Rule saving will be connected in the rules task. Remove rules to save this draft.';

  return errors;
}

export const hasErrors = (errors) => Object.keys(errors).length > 0;
