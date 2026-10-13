const JOIN_MODES = new Set(['INSTANT', 'APPROVAL', 'INVITATION']);
const MAX_CAPACITY = 200;

function parseDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function validateCreateActivity(body = {}, now = new Date()) {
  const fields = {};
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  const category = typeof body.category === 'string' ? body.category.trim() : '';
  const joinMode = typeof body.joinMode === 'string' ? body.joinMode.toUpperCase() : '';
  const startAt = parseDate(body.startAt);
  const endAt = parseDate(body.endAt);
  const deadline = parseDate(body.registrationDeadline);
  const minimum = Number(body.minParticipants);
  const maximum = Number(body.maxParticipants);

  if (!title || title.length > 200) fields.title = 'Title is required and must not exceed 200 characters.';
  if (!description) fields.description = 'Description is required.';
  if (!category) fields.category = 'Category is required.';
  if (!JOIN_MODES.has(joinMode)) fields.joinMode = 'Choose instant, approval, or invitation.';
  if (!startAt || !endAt || endAt <= startAt || startAt <= now) {
    fields.schedule = 'Start must be in the future and end must be after start.';
  }
  if (!deadline || (startAt && (deadline <= now || deadline >= startAt))) {
    fields.registrationDeadline = 'Registration deadline must be in the future and before the start.';
  }
  if (!Number.isInteger(minimum) || minimum < 1 || !Number.isInteger(maximum)
      || maximum < minimum || maximum > MAX_CAPACITY) {
    fields.capacity = `Capacity must be whole numbers with 1 ≤ minimum ≤ maximum ≤ ${MAX_CAPACITY}.`;
  }
  if (body.isPaid || (Array.isArray(body.costItems) && body.costItems.length > 0)) {
    fields.costItems = 'Paid activities will be implemented in a separate task.';
  }
  if (Array.isArray(body.rules) && body.rules.length > 0) {
    fields.rules = 'Activity rules will be implemented in a separate task.';
  }

  return {
    fields,
    value: { title, description, category, joinMode, startAt, endAt, deadline, minimum, maximum },
  };
}

function toActivity(insertId, hostMemberId, value) {
  return {
    id: String(insertId),
    hostId: String(hostMemberId),
    role: 'host',
    status: 'draft',
    title: value.title,
    description: value.description,
    category: value.category,
    startAt: value.startAt.toISOString(),
    endAt: value.endAt.toISOString(),
    registrationDeadline: value.deadline.toISOString(),
    costLockAt: null,
    minParticipants: value.minimum,
    maxParticipants: value.maximum,
    joinMode: value.joinMode.toLowerCase(),
    splitMode: 'equal',
    costItems: [],
    rules: [],
    locationName: null,
    confirmedCount: 0,
    pendingRequests: 0,
    guestCount: 0,
    myStatus: null,
    myBalance: 0,
  };
}

export async function createActivity(req, res, next) {
  try {
    const { fields, value } = validateCreateActivity(req.body);
    if (Object.keys(fields).length > 0) {
      return res.status(400).json({
        error: { code: 'VALIDATION_FAILED', message: 'Check the activity details.', fields },
      });
    }

    const db = req.app.locals.db;
    const [categories] = await db.execute(
      'SELECT category_id FROM activity_categories WHERE category_name = ? AND is_active = TRUE LIMIT 1',
      [value.category],
    );
    if (!categories[0]) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Check the activity details.',
          fields: { category: 'Choose an active activity category.' },
        },
      });
    }

    const sql = `
      INSERT INTO activities (
        host_member_id, category_id, payment_account_id, title, description,
        minimum_participants, maximum_participants, join_mode,
        registration_deadline, cost_lock_at, start_at, end_at, status, is_paid
      ) VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, NULL, ?, ?, 'DRAFT', FALSE)
    `;
    const params = [
      req.session.memberId,
      categories[0].category_id,
      value.title,
      value.description,
      value.minimum,
      value.maximum,
      value.joinMode,
      value.deadline,
      value.startAt,
      value.endAt,
    ];
    const [result] = await db.execute(sql, params);

    return res.status(201).json({
      activity: toActivity(result.insertId, req.session.memberId, value),
    });
  } catch (error) {
    return next(error);
  }
}

export { validateCreateActivity };
