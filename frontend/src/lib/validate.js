import { MAX_CAPACITY } from '../data/constants.js';
import { costTotal, fromDateAndTime, fromDateTimeInput } from './format.js';

// The C3 "Valid activity?" checks. Keep these in sync with the CHECK constraints
// and the create_activity procedure once the database is built.
export function validateActivity(form, existing, now = new Date()) {
  const errors = {};

  const title = form.title.trim();
  if (!title) errors.title = 'Give the activity a title.';
  else if (title.length > 80) errors.title = 'Keep the title under 80 characters.';

  const start = fromDateAndTime(form.date, form.startTime);
  const end = fromDateAndTime(form.date, form.endTime);
  if (!start || !end) errors.time = 'Pick a date, a start time and an end time.';
  else if (end <= start) errors.time = 'The end time must be after the start time.';
  else if (start <= now) errors.time = 'The activity must start in the future.';

  const deadline = fromDateTimeInput(form.deadline);
  if (!deadline) errors.deadline = 'Set a registration deadline.';
  else if (start && deadline > start) errors.deadline = 'Registration must close before the activity starts.';

  const confirmed = existing?.confirmedCount ?? 1;
  if (!(form.min >= 1)) errors.capacity = 'The minimum must be at least 1.';
  else if (form.max < form.min) errors.capacity = 'The minimum must be less than or equal to the maximum.';
  else if (form.max > MAX_CAPACITY) errors.capacity = `The maximum is ${MAX_CAPACITY} people.`;
  else if (form.max < confirmed) errors.capacity = `${confirmed} people are already confirmed, so the maximum cannot go below that.`;

  if (costTotal(form.costItems) > 0) {
    const lock = fromDateTimeInput(form.costLock);
    if (!lock) errors.costLock = 'Paid activities must set a cost lock time.';
    else if (start && lock >= start) errors.costLock = 'The cost lock must be before the activity starts.';
    else if (!existing?.costLockAt && lock <= now) errors.costLock = 'The cost lock must be in the future.';
  }

  return errors;
}

export const hasErrors = (errors) => Object.keys(errors).length > 0;
