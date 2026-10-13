# TU Squad Up — frontend

React + Vite. Two screens from the "TU Squad Up v2" design so far:

| Screen | Route | File |
|---|---|---|
| C1 · New activity (details, rules, capacity, cost) | `/host/new`, `/host/:id/edit` | `src/pages/NewActivity.jsx` |
| D1 · Manage my activities | `/mine` | `src/pages/MyActivities.jsx` |

## Run

```bash
npm install
npm run dev
```

Open http://localhost:5173.

## Where things live

- `src/data/mockData.js` — demo activities. Field names match the planned MySQL tables (Activity, CostItem, ActivityRule, Participation).
- `src/store/ActivityContext.jsx` — in-browser store saved to localStorage. Replace its functions with API calls when the backend exists.
- `src/lib/validate.js` — the C3 "Valid activity?" rules. Keep them in sync with the database CHECK constraints and the `create_activity` procedure.
- `src/lib/activityStatus.js` — decides each D1 row's label, badge, and tab (DECIDE, PAY, OPEN, DRAFT, ...).
- `src/styles.css` — design tokens copied from the design file.

Buttons for screens that don't exist yet (C2 location, D2 decision, D3 requests, E1 payment, map/browse/alerts/me tabs) show a "not built yet" toast.
