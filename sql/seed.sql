-- Repeatable development data for mock TU login and activity categories.

INSERT INTO members (
  member_id, sso_subject, university_email, display_name, member_type, account_status, is_administrator
) VALUES
  (1, 'mock-student-001', 'nont.p@dome.tu.ac.th', 'Nont P.', 'STUDENT', 'ACTIVE', FALSE),
  (2, 'mock-student-002', 'mali.s@dome.tu.ac.th', 'Mali S.', 'STUDENT', 'ACTIVE', FALSE),
  (3, 'mock-professor-001', 'ananda.k@tu.ac.th', 'Ananda K.', 'PROFESSOR', 'ACTIVE', FALSE),
  (4, 'mock-staff-001', 'somchai.r@tu.ac.th', 'Somchai R.', 'STAFF', 'ACTIVE', TRUE)
AS new
ON DUPLICATE KEY UPDATE
  university_email = new.university_email,
  display_name = new.display_name,
  member_type = new.member_type,
  account_status = new.account_status,
  is_administrator = new.is_administrator;

INSERT INTO activity_categories (category_id, category_name, description, is_active) VALUES
  (1, 'Sports', 'Sports and exercise activities', TRUE),
  (2, 'Study', 'Study sessions and academic collaboration', TRUE),
  (3, 'Food', 'Shared meals and food orders', TRUE),
  (4, 'Volunteer', 'Volunteer and community service', TRUE),
  (5, 'Event', 'Campus and departmental events', TRUE),
  (6, 'Help', 'Requests for practical help', TRUE)
AS new
ON DUPLICATE KEY UPDATE
  description = new.description,
  is_active = new.is_active;
