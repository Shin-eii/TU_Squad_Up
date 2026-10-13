# TU Squad Up — System Design Brain Dump

**Version:** 1.0  
**Date:** 13 October 2026  
**Purpose:** Shared source of truth for product behavior, user flow, frontend, backend, and database implementation.

---

## 1. The Product in One Sentence

TU Squad Up is a campus activity platform where verified Thammasat members create activities, discover nearby activities, request to join, share costs, submit payment evidence, and build an attendance history.

The product's main success condition is simple:

> Help an activity reach enough confirmed participants to happen.

---

## 2. MVP Scope

### Required in the first working version

- Mock login through an authentication adapter; TU SSO can replace the mock provider later.
- Member profile and optional PromptPay information.
- Create, edit, publish, browse, filter, view, and cancel activities.
- Marker, circle, or rectangle activity location on a campus map.
- Activity rules and participant acceptance.
- Instant join, approval-based join, and invitation-based participation.
- Organizer-added guests sponsored by a member.
- Minimum and maximum participant capacity.
- Free and paid activities.
- Equal-split and individual cost items.
- Cost locking and late-join handling.
- PromptPay QR display and receipt submission.
- Manual payment confirmation by the host.
- Attendance recording and activity completion.
- Reliability calculation from participation history.
- Volunteer badge awarding.
- Basic in-app notifications.

### Explicitly outside the MVP

- Processing money inside the application.
- Connecting directly to a bank.
- Automatically approving PromptPay slips with machine learning.
- Chat or social-media feeds.
- Alumni accounts.
- Complex recommendation algorithms.
- Production-scale messaging queues and microservices.

---

## 3. Users and Permissions

There is one account type called a **member**. A member has contextual roles based on what they are doing.

| Role | Meaning | Important permissions |
|---|---|---|
| Member | Verified student, professor, staff member, or employee | Browse activities, manage profile, view notifications |
| Host | Member who created an activity | Edit activity, review requests, manage costs, review payments, record attendance, cancel or complete activity |
| Participant | Member or sponsored guest attached to an activity | Accept rules, request to join, withdraw, view amount due, submit receipt |
| Administrator | Member with platform-level permission | Review reports, suspend accounts, manage platform data |

Host and participant are not permanent account roles. The same member can host one activity and participate in another.

### Authorization rule

Every sensitive action is checked by the backend. Hiding a button in the frontend is useful for usability, but it is not security.

---

## 4. High-Level Architecture

```text
┌─────────────────────────────────────────────────────┐
│                 React Web Application               │
│                                                     │
│ Login │ Discovery │ Activity │ Host │ Costs │ Profile│
└──────────────────────────┬──────────────────────────┘
                           │ HTTPS / JSON REST API
┌──────────────────────────▼──────────────────────────┐
│              Express + TypeScript Backend           │
│                                                     │
│ Auth │ Members │ Activities │ Participation │ Costs │
│ Map  │ Payments │ Attendance │ Notifications │ Admin│
└──────────────────────────┬──────────────────────────┘
                           │ SQL transactions
┌──────────────────────────▼──────────────────────────┐
│                     MySQL 8                         │
│   Members │ Activities │ Participation │ Financial │
│           History │ Badges │ Notifications          │
└─────────────────────────────────────────────────────┘

External boundaries:
- TU SSO or mock authentication provider
- Browser map library and map tiles
- Receipt-image storage or local development uploads
- PromptPay QR display; payment occurs outside the application
```

### Why a modular monolith

The project should be one frontend, one backend, and one database. Four people and twenty days do not justify microservices. Backend modules remain separated in code, but deploy together.

Benefits:

- Simple local setup and deployment.
- Database transactions can cover multiple related operations.
- Easier debugging and integration.
- Modules can be separated later if the application grows.

---

## 5. Core Domain Model

The easiest mental model is:

```text
Member ──creates──> Activity ──has──> Location
   │                    │
   │                    ├──has──> Rules
   │                    ├──has──> Cost Items
   │                    └──has──> Status History
   │
   └──joins Activity through──> Participation
                                  │
                                  ├──accepts Rules
                                  ├──receives Cost Allocations
                                  ├──submits Payment Evidence
                                  └──records Attendance
```

`activities` is the center of the application. `participations` is the bridge between members and activities.

---

## 6. Database Design

### 6.1 Identity group

#### `members`

Stores the application profile attached to a TU SSO identity.

Important fields:

- `member_id`: internal primary key.
- `sso_subject`: stable external identity from TU SSO.
- `university_email`: unique university email.
- `member_type`: student, professor, staff, or employee.
- `account_status`: active, suspended, or deactivated.
- `is_administrator`: platform permission.

No password is stored because authentication belongs to TU SSO.

#### `payment_accounts`

Stores a member's PromptPay receiving information. An activity points to the account that should receive its payments.

### 6.2 Activity group

#### `activity_categories`

Reusable categories such as Sports, Study, Food, Volunteer, Event, and Help Request.

#### `activities`

Stores the main activity definition and lifecycle.

Important concepts:

- One member is the host.
- One category classifies the activity.
- `minimum_participants` decides whether the activity has enough people.
- `maximum_participants` prevents overbooking.
- `join_mode` controls instant, approval, or invitation joining.
- `registration_deadline` closes normal joining.
- `cost_lock_at` freezes paid participation and cost allocation.
- `start_at` and `end_at` define the schedule.
- `status` records the current lifecycle state.
- `minimum_reached_at` records when the minimum was first achieved; it is not a status.

#### `activity_locations`

Stores exactly one map location per activity.

- Marker: center point only.
- Circle: center point plus radius.
- Rectangle: center point plus polygon boundary.

The database uses SRID 4326 spatial values. Browser map libraries normally use `[latitude, longitude]`, while MySQL `POINT` creation should be standardized as longitude first and latitude second. One shared conversion function must handle this to prevent reversed coordinates.

#### `activity_status_history`

Audit log for every lifecycle change. It answers who changed the status, when, and why.

### 6.3 Participation group

#### `participations`

Resolves the many-to-many relationship between members and activities.

It stores:

- Member participation or sponsored guest participation.
- Join-request status.
- Attendance status.
- Join and withdrawal timestamps.
- Whether withdrawal happened after cost locking.

A guest has no `member_id`; instead, the row contains `guest_name` and `sponsored_by_member_id`. The sponsor is responsible for the guest's cost.

#### `activity_rules`

Contains platform, category, or host-created rules shown for one activity.

#### `rule_acceptances`

Records the rules accepted by each participation.

For the MVP, rules become immutable once the activity is open. Otherwise old acceptances would refer to changed rule text without version history.

### 6.4 Cost and payment group

#### `cost_items`

Represents a real expense, such as court rental, equipment, pizza, or an individual's meal.

- `EQUAL_SPLIT`: split across selected confirmed participations.
- `INDIVIDUAL`: assign specific amounts to specific participations.

#### `cost_allocations`

Stores the exact amount owed by each participation for each cost item. This is the financial ledger of the application.

An allocation may be waived by the host, but waiver identity and time must be recorded.

#### `payment_submissions`

Stores a participant's claim that payment happened outside the system.

Flow:

```text
SUBMITTED → CONFIRMED
          → REJECTED
```

The application may check that the claimed amount matches the amount due, but only host confirmation changes it to confirmed.

### 6.5 Trust and support group

#### `badges` and `member_badges`

Store badge definitions and evidence that a member earned a badge through a specific attended participation.

#### `notifications`

Stores simple in-app notifications. For the MVP, the backend writes these synchronously during the triggering action; a queue is unnecessary.

#### `reports`

Allows a member to report either another member or an activity. Exactly one report target is required.

---

## 7. Critical Database Relationships

| Relationship | Cardinality | Meaning |
|---|---|---|
| Member → Activities | 1:M | A member can host many activities; each activity has one host |
| Category → Activities | 1:M | A category classifies many activities |
| Activity → Location | 1:1 | Each activity has one saved map definition |
| Members ↔ Activities | M:N through `participations` | Members can join many activities and activities can contain many members |
| Activity → Rules | 1:M | An activity can require multiple rules |
| Participation ↔ Rules | M:N through `rule_acceptances` | A participant accepts multiple rules |
| Activity → Cost Items | 1:M | An activity can contain multiple expenses |
| Cost Items ↔ Participations | M:N through `cost_allocations` | Expenses can be distributed across participants |
| Participation → Payment Submissions | 1:M | A participant may resubmit after rejection |
| Member ↔ Badges | M:N through `member_badges` | Members can earn several badges |

---

## 8. Rules the Application Must Enforce

Some rules cross multiple tables and cannot be guaranteed by the current foreign keys alone. They belong in backend services and automated tests.

1. A participation used by a cost allocation must belong to the same activity as the cost item.
2. A participation accepting a rule must belong to the same activity as the rule.
3. A payment submission's participation must belong to its stated activity.
4. A badge's participation evidence must belong to the member receiving the badge.
5. Only confirmed participations count toward minimum and maximum capacity.
6. The same member cannot participate twice in one activity.
7. A guest must have a sponsoring member; a normal member participation must not have guest data.
8. Only the host can approve requests, lock costs, review payments, mark attendance, cancel, or complete the activity.
9. The host cannot accept more participants than `maximum_participants`.
10. All join approval and capacity updates must happen inside one transaction to prevent two simultaneous approvals from overfilling the activity.
11. Paid activities require a PromptPay account and cost-lock time.
12. After cost lock, existing allocations do not automatically change.
13. A participant withdrawing after cost lock still owes the locked amount unless the host waives it.
14. A sponsored member is responsible for the guest's allocations and payments.
15. Confirmed payments must not exceed the outstanding amount unless overpayment is intentionally supported later.
16. Activity status changes must follow the allowed state machine and create a history row.

---

## 9. Activity Lifecycle

```text
DRAFT
  │ publish
  ▼
OPEN ─────maximum reached────> FULL
  │ registration closes         │
  ▼                             │ slot becomes available
CLOSED <────────────────────────┘
  │
  ├─ minimum not reached → WAITING_HOST_DECISION
  │                         ├─ host continues → CLOSED
  │                         └─ host cancels   → CANCELLED
  │
  └─ start activity → ONGOING → COMPLETED

DRAFT / OPEN / FULL / CLOSED / WAITING_HOST_DECISION
  └─ host cancellation → CANCELLED

Unresolved activity after its valid period → EXPIRED
```

### Status meanings

| Status | Meaning |
|---|---|
| `DRAFT` | Visible only to the host; editable |
| `OPEN` | Published and accepting normal joins |
| `FULL` | Maximum confirmed participants reached |
| `CLOSED` | Joining closed; activity is waiting to start |
| `WAITING_HOST_DECISION` | Deadline passed without reaching the minimum |
| `ONGOING` | Activity has started |
| `COMPLETED` | Activity ended and attendance was finalized |
| `CANCELLED` | Host or administrator cancelled the activity |
| `EXPIRED` | Activity became invalid without being properly completed or cancelled |

`minimum_reached_at` is a condition marker. Reaching the minimum does not automatically close joining because the activity may continue accepting people until the maximum or deadline.

---

## 10. Participation Lifecycle

```text
Approval mode: REQUESTED → CONFIRMED
                         → REJECTED

Invitation mode: INVITED → CONFIRMED
                         → REJECTED

Instant mode: user accepts rules → CONFIRMED

CONFIRMED → WITHDRAWN by participant
CONFIRMED → REMOVED by host or administrator
```

Attendance starts as `PENDING` and becomes `ATTENDED`, `NO_SHOW`, or `EXCUSED` after the activity.

### Does the host count as a participant?

Recommended rule: the create-activity form contains **“I am participating”**, enabled by default. When enabled, publishing creates a confirmed participation for the host. This makes capacity, attendance, and cost sharing explicit instead of assuming every host participates.

---

## 11. Cost Lifecycle

### Before cost lock

- Confirmed participants may join or withdraw.
- Equal allocations may be recalculated whenever confirmed participation changes.
- The UI labels the amount as estimated.

### At cost lock

The backend performs one transaction:

1. Lock the activity row.
2. Read confirmed participations.
3. Validate cost items.
4. Calculate and persist final allocations.
5. Prevent ordinary join and allocation changes.
6. Create `COST_LOCKED` notifications.

Default recommendation: lock two hours before activity start, while allowing the host to choose another valid time.

### After cost lock

- Withdrawal does not erase the participant's debt.
- Host may explicitly waive an allocation.
- Late joins require host approval.
- A late join receives new explicit allocations; existing locked participant allocations are not automatically recalculated.
- Guests' amounts appear under the sponsoring participant's payment summary.

### Equal-split rounding

Use decimal arithmetic, never floating-point arithmetic. For a total with a rounding remainder, distribute the remaining satang deterministically to the earliest allocations so the allocation sum equals the cost-item total exactly.

Example:

```text
100.00 ÷ 3
= 33.34 + 33.33 + 33.33
= 100.00 exactly
```

---

## 12. Reliability and Badges

Reliability is derived instead of stored as a separate value.

```text
reliability percentage
= attended confirmed commitments
  ÷ completed confirmed commitments counted for reliability
  × 100
```

Rules:

- `ATTENDED` counts positively.
- `NO_SHOW` counts negatively.
- Approved late cancellation can count negatively if the team keeps that policy.
- `EXCUSED`, early withdrawal, and host cancellation are excluded.
- Display the score only after at least three counted commitments.

A volunteer badge is awarded only when a volunteer activity is completed and the member's attendance is `ATTENDED`.

---

## 13. Primary User Flows and Database Effects

### 13.1 Login

```text
Open app
→ Redirect to TU SSO or select a mock account
→ Backend validates external identity
→ Find member by sso_subject
→ Insert member on first login or load existing member
→ Return session/token and profile
→ Open discovery page
```

Database: select or insert `members`.

### 13.2 Create and publish an activity

```text
Host opens Create Activity
→ enters details, capacity, times, join mode, and rules
→ chooses free or paid
→ paid: selects PromptPay account and cost-lock time
→ draws location
→ saves draft
→ backend validates complete configuration
→ host publishes
```

Database transaction:

- Insert/update `activities`.
- Insert/update `activity_locations`.
- Insert `activity_rules`.
- Optionally insert confirmed host `participation`.
- Insert `activity_status_history` from `DRAFT` to `OPEN`.

### 13.3 Discover an activity

```text
Member opens home/map
→ filters category, time, open slots, or distance
→ backend returns eligible OPEN/FULL activities
→ member selects an activity
→ frontend loads details, location, rules, capacity, and estimated cost
```

Database: query `activities`, category, location, and confirmed-participation count. Distance can use `ST_Distance_Sphere` against the location center.

### 13.4 Request to join

```text
Member views activity
→ accepts every required rule
→ submits join request
→ backend validates deadline, status, duplicate membership, and capacity
→ approval mode: REQUESTED
→ instant mode: CONFIRMED
→ host/member receives notification
```

Database transaction:

- Insert `participations`.
- Insert `rule_acceptances`.
- Insert `notifications`.
- If instant confirmation reaches capacity, update activity to `FULL` and add status history.

### 13.5 Host reviews requests

```text
Host opens requests
→ selects Approve or Reject
→ backend locks activity row
→ recounts confirmed participations
→ validates capacity
→ updates participation
→ updates activity status if necessary
→ notifies requester
```

Database: update `participations`; possibly update `activities`; insert `activity_status_history` and `notifications`.

### 13.6 Add a guest

```text
Member or host enters guest name
→ backend creates participation with no member_id
→ sponsored_by_member_id identifies responsibility
→ guest counts toward capacity
→ guest costs appear in sponsor's summary
```

Database: insert guest `participations`, rule acceptance if required, and later cost allocations.

### 13.7 Lock cost

```text
Host reviews confirmed participants and cost items
→ selects Lock Cost or automatic lock time is reached
→ backend calculates allocations transactionally
→ allocations become final
→ participants receive amount-due notifications
```

Database: insert/update `cost_items`, replace draft `cost_allocations` with final amounts, update activity as required, and insert notifications.

### 13.8 Submit and review payment

```text
Participant views PromptPay QR and total due
→ pays outside TU Squad Up
→ uploads receipt and enters amount
→ host reviews submission
→ confirms or rejects it
```

Database: insert `payment_submissions`; later update review status, reviewer, time, and rejection reason; insert notification.

### 13.9 Complete activity

```text
Host starts activity
→ status becomes ONGOING
→ after activity, host records attendance
→ host completes activity
→ reliability becomes derivable
→ eligible volunteer badges are awarded
```

Database: update `activities` and `participations`; insert status history and `member_badges`.

---

## 14. Frontend Design

### Recommended technology

- React with TypeScript.
- Vite for development and build.
- React Router for routes.
- TanStack Query or equivalent for server state.
- React Hook Form plus schema validation for forms.
- Leaflet with OpenStreetMap tiles, or Longdo Map if the team confirms its API and licensing fit.
- A small shared component library rather than custom styling on every page.

### Route map

| Route | Screen | Main data |
|---|---|---|
| `/login` | Login/mock-account selection | Authentication provider |
| `/` | Activity discovery list and map | Activities, categories, locations, capacity |
| `/activities/:id` | Activity details | Activity, host, rules, location, participants, costs |
| `/activities/new` | Create activity wizard | Categories, payment account, map editor |
| `/activities/:id/edit` | Edit draft or allowed fields | Existing activity configuration |
| `/my-activities` | Hosted and joined activities | Activities and participations |
| `/host/activities/:id` | Host dashboard | Requests, guests, participant count, lifecycle actions |
| `/host/activities/:id/costs` | Cost management | Cost items, allocations, payment summaries |
| `/host/activities/:id/attendance` | Attendance | Confirmed participants and attendance states |
| `/payments` | Member payment responsibilities | Allocations and submissions |
| `/notifications` | Notifications | Unread/read notification records |
| `/profile` | Member profile and PromptPay | Member and payment accounts |
| `/admin/reports` | Report review | Reports and target summaries |

### Feature folder structure

```text
app/client/src/
├── app/                 # router, providers, global layout
├── components/          # reusable UI components
├── features/
│   ├── auth/
│   ├── members/
│   ├── activities/
│   ├── map/
│   ├── participations/
│   ├── rules/
│   ├── costs/
│   ├── payments/
│   ├── attendance/
│   ├── notifications/
│   └── admin/
├── lib/                 # API client, date, money, map conversion
└── types/               # shared frontend domain types
```

### Frontend state rules

- Server data belongs in the query library cache, not duplicated in global state.
- Authentication identity is global application state.
- Draft form state remains local to the screen until submitted.
- After a successful mutation, invalidate or update the affected activity queries.
- The server remains authoritative for capacity, permissions, costs, and status.

### Required UI states

Every data screen must define:

- Loading.
- Empty.
- Successful data.
- Validation error.
- Authorization denied.
- Network/server error.
- Action in progress to prevent duplicate submissions.

---

## 15. Backend Design

### Folder structure

```text
app/server/src/
├── app.ts
├── server.ts
├── config/
├── database/
│   ├── pool.ts
│   └── transaction.ts
├── middleware/
│   ├── authenticate.ts
│   ├── authorize.ts
│   ├── validate.ts
│   └── error-handler.ts
├── modules/
│   ├── auth/
│   ├── members/
│   ├── activities/
│   ├── locations/
│   ├── participations/
│   ├── rules/
│   ├── costs/
│   ├── payments/
│   ├── attendance/
│   ├── badges/
│   ├── notifications/
│   └── reports/
└── shared/
    ├── errors/
    ├── money/
    ├── time/
    └── types/
```

Each module uses:

```text
route → controller → service → repository → MySQL
```

- Route: endpoint and middleware registration.
- Controller: HTTP translation only.
- Service: business rules and transactions.
- Repository: SQL only.

### Essential REST API

#### Authentication and members

```text
POST   /api/auth/mock-login
GET    /api/me
PATCH  /api/me
GET    /api/me/payment-accounts
POST   /api/me/payment-accounts
PATCH  /api/me/payment-accounts/:accountId
```

#### Activities

```text
GET    /api/activities
POST   /api/activities
GET    /api/activities/:activityId
PATCH  /api/activities/:activityId
POST   /api/activities/:activityId/publish
POST   /api/activities/:activityId/cancel
POST   /api/activities/:activityId/start
POST   /api/activities/:activityId/complete
PUT    /api/activities/:activityId/location
```

#### Participation and rules

```text
GET    /api/activities/:activityId/participations
POST   /api/activities/:activityId/join
POST   /api/activities/:activityId/guests
POST   /api/participations/:participationId/approve
POST   /api/participations/:participationId/reject
POST   /api/participations/:participationId/withdraw
POST   /api/participations/:participationId/remove
PUT    /api/activities/:activityId/rules
```

#### Costs and payments

```text
GET    /api/activities/:activityId/costs
POST   /api/activities/:activityId/cost-items
PATCH  /api/cost-items/:costItemId
DELETE /api/cost-items/:costItemId
POST   /api/activities/:activityId/lock-costs
GET    /api/activities/:activityId/payment-summary
POST   /api/activities/:activityId/payment-submissions
POST   /api/payment-submissions/:submissionId/confirm
POST   /api/payment-submissions/:submissionId/reject
```

#### Attendance and support

```text
PUT    /api/activities/:activityId/attendance
GET    /api/notifications
POST   /api/notifications/:notificationId/read
POST   /api/reports
GET    /api/admin/reports
PATCH  /api/admin/reports/:reportId
```

### API response convention

Success:

```json
{
  "data": {},
  "meta": {}
}
```

Error:

```json
{
  "error": {
    "code": "ACTIVITY_FULL",
    "message": "This activity has reached its maximum capacity.",
    "details": {}
  }
}
```

Use stable error codes so the frontend can show the correct message without parsing English text.

---

## 16. Transaction Boundaries

Transactions are necessary when multiple writes must either all succeed or all fail.

Use a transaction for:

- Publishing an activity with location, rules, host participation, and status history.
- Instant joining with rule acceptance, capacity validation, possible status change, and notification.
- Approving a join request with capacity validation and notification.
- Locking cost items and allocations.
- Confirming a payment when totals must be checked.
- Completing an activity with attendance validation, status history, and badge awards.

For join approval and instant joining, select the activity row using `FOR UPDATE` before counting confirmed participations. This serializes competing approvals and prevents overbooking.

---

## 17. Authentication and Security

### Authentication adapter

```text
AuthProvider
├── MockAuthProvider       # development and presentation
└── ThammasatSsoProvider   # real deployment
```

The rest of the application consumes the same normalized identity:

```text
external subject
university email
display name
member type
```

### Minimum security controls

- Validate every request body and path parameter.
- Parameterize every SQL query.
- Never trust `member_id`, host identity, cost totals, or statuses supplied by the browser.
- Derive the current member from the authenticated session/token.
- Check host/admin permissions in services.
- Limit receipt file size and accepted file types.
- Generate stored filenames instead of trusting uploaded names.
- Do not expose full PromptPay identifiers where unnecessary.
- Record security-relevant state changes in status or review history.
- Keep secrets in environment variables and commit only `.env.example`.

---

## 18. Time and Scheduling

Store application timestamps in UTC and convert to `Asia/Bangkok` for display. The frontend sends ISO 8601 timestamps. The backend owns decisions about deadlines, cost locking, and activity start/end.

For the MVP, automatic time-based transitions can run:

- During relevant API requests using a status-refresh service.
- Through a simple periodic scheduled job if deployment supports it.

Do not depend exclusively on a user's browser being open.

---

## 19. Testing Strategy

### Unit tests

- Equal-split rounding.
- Reliability calculation.
- Activity transition validation.
- Cost-lock rules.
- Authorization predicates.

### Database and service integration tests

- Duplicate joining is rejected.
- Concurrent approvals do not exceed capacity.
- Cross-activity rule acceptance and cost allocation are rejected.
- Withdrawing after cost lock preserves debt.
- Waiving an allocation records the host and time.
- Payment confirmation does not exceed outstanding debt.
- Completing an activity creates status history and eligible badges.

### End-to-end acceptance flow

```text
Host logs in
→ creates mapped paid football activity
→ publishes it
→ participant logs in
→ accepts rules and requests to join
→ host approves request and adds a guest
→ host creates court cost and locks it
→ participant sees own and guest amount
→ participant submits receipt
→ host confirms payment
→ host records attendance
→ host completes activity
→ history, reliability, and badge results are visible
```

This is the most important test and presentation story.

---

## 20. Deployment and Development Environments

### Local development

```text
React dev server → Express dev server → local MySQL
```

Required configuration:

```text
DATABASE_URL
AUTH_MODE=mock|tu-sso
SESSION_SECRET or JWT_SECRET
UPLOAD_DIRECTORY or object-storage configuration
MAP_PROVIDER configuration if required
APP_TIMEZONE=Asia/Bangkok
```

### Demonstration environment

- Use deterministic seed data.
- Prepare at least one host and two participant accounts.
- Seed categories and badges.
- Start with no existing participation in the demonstrated activity.
- Test the exact demonstration on a clean machine before submission.

---

## 21. Four-Person Ownership

| Person | Module ownership | Integration responsibility |
|---|---|---|
| Person 1 | Project foundation, auth, members, PromptPay accounts, notifications | Shared configuration, authentication context, build and setup |
| Person 2 | Activities, categories, discovery, activity details, map | Activity API contract and main navigation flow |
| Person 3 | Participations, rules, requests, guests, withdrawals | Capacity and join-state correctness |
| Person 4 | Cost items, allocations, receipts, attendance, badges, reports | Transaction correctness and database test support |

Every owner builds the frontend, backend, database queries, validation, and tests for their module.

---

## 22. Error Scenarios the UI Must Explain

- Activity is full.
- Registration deadline passed.
- Cost is already locked.
- Member already joined or already has a pending request.
- Required rules were not accepted.
- Host attempted to approve beyond capacity.
- Activity was cancelled while the page was open.
- Receipt amount does not match the outstanding amount.
- Participant is not authorized to see host controls.
- Map location is incomplete for the selected shape.
- Network request failed.

Errors should tell the user what happened and what they can do next.

---

## 23. Design Trade-offs

| Decision | Benefit | Cost / limitation |
|---|---|---|
| Modular monolith | Fast development and simple transactions | Modules are deployed together |
| Manual receipt confirmation | Realistic within project scope | Host performs verification |
| Derived reliability | No duplicated score becoming stale | Query/calculation is slightly more complex |
| One location per activity | Simple UI and schema | Cannot represent multi-location events |
| Synchronous database notifications | Easy to implement | Not suitable for very high traffic |
| Rules immutable after publishing | Acceptance evidence stays meaningful | Host must cancel/recreate to make major rule changes |
| Store allocations explicitly | Auditable financial history | Must carefully maintain consistency |

---

## 24. Decisions to Revisit After the MVP

- Real TU SSO protocol and approval process.
- Cloud receipt-image storage and retention policy.
- Push/email notifications.
- Automated PromptPay slip verification through a trusted service.
- Waitlists when activities are full.
- Chat and host announcements.
- Recurring activities.
- Multiple locations or routes.
- PostgreSQL/PostGIS or dedicated geospatial search if map scale grows.
- Background job queue for scheduled transitions and notifications.
- Payment-refund and cancellation policy.
- Rule versioning if hosts must edit published rules.

---

## 25. Unresolved Product Decisions

The team should settle these before implementing the affected screen:

1. Does the host participate by default? Recommended: yes, with a visible checkbox.
2. Does a late cancellation count negatively in reliability? Recommended: yes after a configurable cutoff; excused cancellation does not.
3. Can the host start an activity before its scheduled time? Recommended: allow within a small window, such as 30 minutes.
4. Can a host complete an activity while attendance remains `PENDING`? Recommended: no; every confirmed participation must be resolved.
5. Can one participant submit several receipts? Recommended: yes after rejection or for partial payment, but confirmed totals cannot exceed the amount due.
6. Can the host change the location after participants join? Recommended: allow before cost lock and notify confirmed participants.
7. Who may add guests? Recommended MVP rule: the host adds guests or approves participant-submitted guests.

---

## 26. Final Mental Model

When implementing or debugging any feature, follow one chain:

```text
User action
→ frontend validates and calls API
→ backend authenticates and authorizes
→ service checks business rules
→ transaction reads/writes related tables
→ backend returns one stable response
→ frontend refreshes affected data
→ notification/history preserves important changes
```

If the team can demonstrate that chain for creating, joining, paying, attending, and completing an activity, the system is functionally complete for the assignment.

