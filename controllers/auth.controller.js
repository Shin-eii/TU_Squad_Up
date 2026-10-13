const MEMBER_SELECT = `
  SELECT member_id, university_email, display_name, member_type, is_administrator
  FROM members
  WHERE member_id = ? AND account_status = 'ACTIVE'
  LIMIT 1
`;

function toMember(row) {
  return {
    memberId: String(row.member_id),
    universityEmail: row.university_email,
    displayName: row.display_name,
    memberType: row.member_type,
    isAdministrator: Boolean(row.is_administrator),
  };
}

async function findActiveMember(db, memberId) {
  const [rows] = await db.execute(MEMBER_SELECT, [memberId]);
  return rows[0] ? toMember(rows[0]) : null;
}

export async function mockLogin(req, res, next) {
  try {
    const memberId = Number(req.body?.memberId);
    if (!Number.isSafeInteger(memberId) || memberId < 1) {
      return res.status(400).json({
        error: { code: 'INVALID_MEMBER', message: 'Choose a valid mock TU member.' },
      });
    }

    const member = await findActiveMember(req.app.locals.db, memberId);
    if (!member) {
      return res.status(404).json({
        error: { code: 'MEMBER_NOT_FOUND', message: 'That mock TU member is not available.' },
      });
    }

    req.session.memberId = member.memberId;
    return req.session.save((error) => {
      if (error) return next(error);
      return res.status(200).json({ member });
    });
  } catch (error) {
    return next(error);
  }
}

export async function getCurrentMember(req, res, next) {
  try {
    const member = await findActiveMember(req.app.locals.db, req.session.memberId);
    if (!member) {
      req.session.destroy(() => {});
      return res.status(401).json({
        error: { code: 'AUTH_REQUIRED', message: 'Your login is no longer valid.' },
      });
    }

    return res.status(200).json({ member });
  } catch (error) {
    return next(error);
  }
}

export function logout(req, res, next) {
  req.session.destroy((error) => {
    if (error) return next(error);
    res.clearCookie('tu.sid');
    return res.status(204).end();
  });
}
