// Demo members for the mock login. Field names match the planned `members` table
// and the GET /api/me response. M0001 is the host who owns the demo activities in
// src/data/mockData.js. All emails are fake.

export const DEMO_ACCOUNTS = [
  {
    member_id: 'M0001',
    display_name: 'Nont P.',
    university_email: 'nont.p@dome.tu.ac.th',
    member_type: 'STUDENT',
    account_status: 'ACTIVE',
    is_administrator: false,
    demo_role: 'Host · runs football, volleyball, open house',
  },
  {
    member_id: 'M0042',
    display_name: 'Ploy S.',
    university_email: 'ploy.s@dome.tu.ac.th',
    member_type: 'STUDENT',
    account_status: 'ACTIVE',
    is_administrator: false,
    demo_role: 'Participant',
  },
  {
    member_id: 'M0107',
    display_name: 'Dr. Krit W.',
    university_email: 'krit.w@tu.ac.th',
    member_type: 'PROFESSOR',
    account_status: 'ACTIVE',
    is_administrator: false,
    demo_role: 'Participant',
  },
  {
    member_id: 'M0900',
    display_name: 'Admin Fah T.',
    university_email: 'fah.t@tu.ac.th',
    member_type: 'STAFF',
    account_status: 'ACTIVE',
    is_administrator: true,
    demo_role: 'Administrator',
  },
  {
    member_id: 'M0666',
    display_name: 'Suspended Demo',
    university_email: 'suspended.demo@dome.tu.ac.th',
    member_type: 'STUDENT',
    account_status: 'SUSPENDED',
    is_administrator: false,
    demo_role: 'Suspended · shows the login error',
  },
];
