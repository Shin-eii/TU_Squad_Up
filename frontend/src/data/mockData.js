// Demo data until the MySQL backend exists. Field names mirror the planned tables:
//   Activity      -> id, hostId, title, category, locationName, startAt, endAt,
//                    registrationDeadline, costLockAt, minParticipants, maxParticipants,
//                    joinMode, splitMode, status
//   CostItem      -> costItems[]   (activity_id FK)
//   ActivityRule  -> rules[]       (activity_id FK)
//   Participation -> role, myStatus, myBalance are the current member's row;
//                    confirmedCount / pendingRequests / guestCount are trigger-maintained counters.
// Dates are generated relative to "now" so the demo always has upcoming items.

export const CURRENT_MEMBER = { memberId: 'M0001', name: 'Nont P.', memberType: 'student' };

function at(dayOffset, hour, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function hoursFromNow(hours) {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + hours);
  return d;
}

const plus = (date, hours) => new Date(date.getTime() + hours * 60 * 60 * 1000);
const iso = (date) => (date ? date.toISOString() : null);

function activity({ start, durationHours = 2, deadlineBefore = 1, lockBefore = 2, ...fields }) {
  const paid = (fields.costItems ?? []).length > 0;
  return {
    hostId: CURRENT_MEMBER.memberId,
    role: 'host',
    status: 'open',
    joinMode: 'approval',
    splitMode: 'equal',
    costItems: [],
    rules: [],
    confirmedCount: 1,
    pendingRequests: 0,
    guestCount: 0,
    myStatus: 'approved',
    myBalance: 0,
    ...fields,
    startAt: iso(start),
    endAt: iso(plus(start, durationHours)),
    registrationDeadline: iso(plus(start, -deadlineBefore)),
    costLockAt: paid ? iso(plus(start, -lockBefore)) : null,
  };
}

export function createMockActivities() {
  return [
    activity({
      id: 'act-football',
      title: 'Football pickup match',
      category: 'Sports',
      locationName: 'Flick TU',
      start: hoursFromNow(4),
      minParticipants: 20,
      maxParticipants: 25,
      confirmedCount: 17,
      pendingRequests: 4,
      guestCount: 2,
      costItems: [
        { id: 'ci-1', label: 'Field booking, 2 h', amount: 1800 },
        { id: 'ci-2', label: 'Bibs rental', amount: 200 },
        { id: 'ci-3', label: 'Water and ice', amount: 200 },
      ],
      rules: [
        { id: 'r-1', text: 'Arrive 10 minutes early' },
        { id: 'r-2', text: 'Pay within 24 h of the activity' },
        { id: 'r-3', text: 'No-show without notice = strike' },
      ],
    }),
    activity({
      id: 'act-volleyball',
      title: 'Volleyball, Gym 2',
      category: 'Sports',
      locationName: 'Gym 2',
      start: hoursFromNow(20),
      deadlineBefore: 21, // registration closed an hour ago
      minParticipants: 10,
      maxParticipants: 14,
      confirmedCount: 7,
    }),
    activity({
      id: 'act-openhouse',
      title: 'Faculty open house setup',
      category: 'Volunteer',
      locationName: 'Yim Building lobby',
      start: at(4, 10),
      durationHours: 4,
      deadlineBefore: 24,
      joinMode: 'instant',
      minParticipants: 6,
      maxParticipants: 12,
      confirmedCount: 8,
    }),
    activity({
      id: 'act-badminton',
      role: 'participant',
      hostId: 'M0042',
      title: 'Badminton, Gym 7',
      category: 'Sports',
      locationName: 'Gym 7',
      start: at(-1, 18),
      minParticipants: 4,
      maxParticipants: 8,
      confirmedCount: 8,
      myStatus: 'attended',
      myBalance: 85,
      costItems: [{ id: 'ci-4', label: 'Court booking', amount: 480 }, { id: 'ci-5', label: 'Shuttlecocks', amount: 200 }],
    }),
    activity({
      id: 'act-css326',
      role: 'participant',
      hostId: 'M0107',
      title: 'CSS326 midterm study group',
      category: 'Study',
      locationName: 'SIIT library, room 3',
      start: at(2, 18),
      durationHours: 3,
      joinMode: 'instant',
      minParticipants: 3,
      maxParticipants: 8,
      confirmedCount: 6,
    }),
    activity({
      id: 'act-boardgame',
      role: 'participant',
      hostId: 'M0213',
      title: 'Board game night',
      category: 'Event',
      locationName: 'Student union, 2nd floor',
      start: at(3, 19),
      minParticipants: 4,
      maxParticipants: 10,
      confirmedCount: 5,
      myStatus: 'pending',
    }),
    activity({
      id: 'act-run',
      role: 'participant',
      hostId: 'M0099',
      title: 'Morning run around the lake',
      category: 'Sports',
      locationName: 'Rangsit lake',
      start: at(-5, 6),
      status: 'completed',
      minParticipants: 2,
      maxParticipants: 15,
      confirmedCount: 9,
      myStatus: 'attended',
    }),
    activity({
      id: 'act-basketball',
      title: 'Basketball 3-on-3',
      category: 'Sports',
      locationName: 'Outdoor court B',
      start: at(-3, 17),
      status: 'cancelled',
      minParticipants: 6,
      maxParticipants: 6,
      confirmedCount: 3,
    }),
  ];
}
