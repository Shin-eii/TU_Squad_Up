import { baht, formatWhen } from './format.js';

/**
 * Describes how one activity appears in D1 from the current member's point of view.
 * `past` decides the PAST tab; `priority` 0 = needs action, sorted first.
 */
export function describeActivity(a, now = new Date()) {
  const hosting = a.role === 'host';
  const roleWord = hosting ? 'hosting' : 'joined';
  const when = formatWhen(a.startAt ? new Date(a.startAt) : null, now);
  const place = a.locationName ?? 'Location not set';
  const ended = a.endAt ? new Date(a.endAt) < now : false;
  const deadlinePassed = a.registrationDeadline ? new Date(a.registrationDeadline) < now : false;
  const owes = !hosting && a.myBalance > 0;

  if (a.status === 'cancelled') {
    return { past: true, tone: 'muted', eyebrow: `${when} · ${roleWord}`, subtitle: 'Cancelled', badge: { label: 'CANCELLED', tone: 'muted' } };
  }
  if (!hosting && (a.myStatus === 'left' || a.myStatus === 'withdrawn')) {
    const left = a.myStatus === 'left';
    return {
      past: true,
      tone: 'muted',
      eyebrow: `${when} · joined`,
      subtitle: left ? 'You left this activity' : 'Request withdrawn',
      badge: { label: left ? 'LEFT' : 'WITHDRAWN', tone: 'muted' },
    };
  }
  if (owes) {
    return {
      past: false,
      priority: 0,
      tone: 'muted',
      eyebrow: `${when} · joined`,
      subtitle: `Attended · you owe ${baht(a.myBalance)}`,
      badge: { label: 'PAY', tone: 'accent' },
      action: 'pay',
    };
  }
  if (a.status === 'completed' || ended) {
    let subtitle = 'Ended';
    if (hosting) subtitle = `${a.confirmedCount} took part`;
    else if (a.myStatus === 'attended') subtitle = 'Attended · settled';
    return { past: true, tone: 'muted', eyebrow: `${when} · ${roleWord}`, subtitle, badge: { label: 'DONE', tone: 'muted' } };
  }
  if (hosting && a.status === 'draft') {
    return {
      past: false,
      priority: 1,
      tone: 'muted',
      eyebrow: a.startAt ? `Draft · ${when}` : 'Draft · hosting',
      subtitle: a.locationName ? 'Ready to publish' : 'Location not set yet',
      badge: { label: 'DRAFT', tone: 'outline' },
      action: 'draft',
    };
  }
  if (hosting && deadlinePassed && a.confirmedCount < a.minParticipants) {
    return {
      past: false,
      priority: 0,
      tone: 'accent',
      eyebrow: 'Deadline passed · hosting',
      subtitle: `${a.confirmedCount} of ${a.minParticipants} minimum · your decision needed`,
      badge: { label: 'DECIDE', tone: 'accent' },
      action: 'decide',
    };
  }
  if (hosting) {
    return {
      past: false,
      priority: a.pendingRequests > 0 ? 0 : 1,
      featured: a.pendingRequests > 0,
      tone: 'dark',
      eyebrow: `${when} · hosting`,
      subtitle: `${place} · ${a.confirmedCount}/${a.maxParticipants} · ${a.category.toLowerCase()}`,
      badge: { label: a.confirmedCount >= a.maxParticipants ? 'FULL' : 'OPEN', tone: 'outline' },
      action: 'host',
    };
  }
  if (a.myStatus === 'pending') {
    return {
      past: false,
      priority: 1,
      tone: 'muted',
      eyebrow: `${when} · requested`,
      subtitle: 'Waiting for the host to approve',
      badge: { label: 'PENDING', tone: 'outline' },
      action: 'pending',
    };
  }
  return {
    past: false,
    priority: 1,
    tone: 'dark',
    eyebrow: `${when} · joined`,
    subtitle: `${place} · ${a.confirmedCount}/${a.maxParticipants}`,
    badge: { label: 'GOING', tone: 'outline' },
    action: 'going',
  };
}

const startTime = (a) => (a.startAt ? new Date(a.startAt).getTime() : Infinity);

/** Splits activities into the D1 filters, already sorted. */
export function groupActivities(activities, now = new Date()) {
  const items = activities.map((activity) => ({ activity, view: describeActivity(activity, now) }));
  const upcoming = items
    .filter((i) => !i.view.past)
    .sort((x, y) => x.view.priority - y.view.priority || startTime(x.activity) - startTime(y.activity));
  const past = items
    .filter((i) => i.view.past)
    .sort((x, y) => startTime(y.activity) - startTime(x.activity));
  return {
    all: upcoming,
    hosting: upcoming.filter((i) => i.activity.role === 'host'),
    joined: upcoming.filter((i) => i.activity.role !== 'host'),
    past,
  };
}
