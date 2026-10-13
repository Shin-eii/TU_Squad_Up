import {
  addHours,
  costTotal,
  fromDateAndTime,
  fromDateTimeInput,
  newId,
  toDateInput,
  toDateTimeInput,
  toTimeInput,
} from './format.js';

/** Defaults for a new activity: tomorrow 16:00–18:00, registration closes 1 h before, cost lock 2 h before. */
export function emptyForm(now = new Date()) {
  const start = new Date(now);
  start.setDate(start.getDate() + 1);
  start.setHours(16, 0, 0, 0);
  return {
    title: '',
    category: 'Sports',
    date: toDateInput(start),
    startTime: '16:00',
    endTime: '18:00',
    deadline: toDateTimeInput(addHours(start, -1)),
    costLock: toDateTimeInput(addHours(start, -2)),
    // While untouched, the deadline and cost lock follow the start time.
    deadlineTouched: false,
    costLockTouched: false,
    min: 2,
    max: 10,
    joinMode: 'approval',
    splitMode: 'equal',
    costItems: [],
    rules: [],
  };
}

export function activityToForm(a) {
  const start = a.startAt ? new Date(a.startAt) : null;
  const end = a.endAt ? new Date(a.endAt) : null;
  return {
    title: a.title,
    category: a.category,
    date: start ? toDateInput(start) : '',
    startTime: start ? toTimeInput(start) : '',
    endTime: end ? toTimeInput(end) : '',
    deadline: a.registrationDeadline ? toDateTimeInput(new Date(a.registrationDeadline)) : '',
    costLock: a.costLockAt
      ? toDateTimeInput(new Date(a.costLockAt))
      : start ? toDateTimeInput(addHours(start, -2)) : '',
    deadlineTouched: true,
    costLockTouched: Boolean(a.costLockAt),
    min: a.minParticipants,
    max: a.maxParticipants,
    joinMode: a.joinMode,
    splitMode: a.splitMode,
    costItems: a.costItems ?? [],
    rules: a.rules ?? [],
  };
}

/** Builds the activity record that would be sent to the backend (and kept in the demo store). */
export function formToActivity(form, existing, member) {
  const start = fromDateAndTime(form.date, form.startTime);
  const end = fromDateAndTime(form.date, form.endTime);
  const deadline = fromDateTimeInput(form.deadline);
  const costLock = fromDateTimeInput(form.costLock);
  const paid = costTotal(form.costItems) > 0;

  const base = existing ?? {
    id: newId('act'),
    hostId: member.memberId,
    role: 'host',
    status: 'draft', // becomes 'open' once C2 (location) and C4 (publish) exist
    locationName: null,
    confirmedCount: 1, // the host counts toward capacity
    pendingRequests: 0,
    guestCount: 0,
    myStatus: 'approved',
    myBalance: 0,
  };

  return {
    ...base,
    title: form.title.trim(),
    category: form.category,
    startAt: start ? start.toISOString() : null,
    endAt: end ? end.toISOString() : null,
    registrationDeadline: deadline ? deadline.toISOString() : null,
    costLockAt: paid && costLock ? costLock.toISOString() : null,
    minParticipants: form.min,
    maxParticipants: form.max,
    joinMode: form.joinMode,
    splitMode: form.splitMode,
    costItems: form.costItems,
    rules: form.rules,
  };
}
