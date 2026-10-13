import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import { useToast } from '../components/Toast.jsx';
import { CURRENT_MEMBER } from '../data/mockData.js';
import { groupActivities } from '../lib/activityStatus.js';
import { baht, costTotal, formatWhen } from '../lib/format.js';
import { useActivities } from '../store/ActivityContext.jsx';

const FILTERS = [
  { key: 'all', label: 'ALL' },
  { key: 'hosting', label: 'HOSTING' },
  { key: 'joined', label: 'JOINED' },
  { key: 'past', label: 'PAST' },
];

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

/** D1 · Manage my activities — hosting and joined in one list. */
export default function MyActivities() {
  const navigate = useNavigate();
  const toast = useToast();
  const { activities, updateActivity, removeActivity, resetDemo } = useActivities();
  const [filter, setFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [pending, setPending] = useState(null); // { kind, activity } awaiting confirmation

  const groups = groupActivities(activities);
  const items = groups[filter];
  const featured = filter === 'all' || filter === 'hosting' ? items.find((i) => i.view.featured) : null;
  const rows = featured ? items.filter((i) => i !== featured) : items;

  const notBuilt = (screen) => toast(`${screen} isn't built yet.`);
  const closeDialog = useCallback(() => setPending(null), []);
  const edit = (a) => navigate(`/host/${a.id}/edit`);

  function confirmPending() {
    const { kind, activity } = pending;
    if (kind === 'cancel') {
      updateActivity(activity.id, { status: 'cancelled' });
      toast(`${activity.title} was cancelled. Members will be notified.`);
    } else if (kind === 'discard') {
      removeActivity(activity.id);
      toast('Draft discarded.');
    } else if (kind === 'leave') {
      updateActivity(activity.id, { myStatus: 'left', confirmedCount: Math.max(0, activity.confirmedCount - 1) });
      toast(`You left ${activity.title}.`);
    } else if (kind === 'withdraw') {
      updateActivity(activity.id, { myStatus: 'withdrawn' });
      toast('Join request withdrawn.');
    }
    setPending(null);
    setExpandedId(null);
  }

  function actionsFor({ activity: a, view }) {
    switch (view.action) {
      case 'host':
        return [
          { label: 'Edit', onClick: () => edit(a) },
          { label: 'Message all', onClick: () => notBuilt('Messaging') },
          { label: 'Cancel', danger: true, onClick: () => setPending({ kind: 'cancel', activity: a }) },
        ];
      case 'decide':
        return [
          { label: 'Decide', solid: true, onClick: () => notBuilt('The host decision screen (D2)') },
          { label: 'Edit', onClick: () => edit(a) },
          { label: 'Cancel', danger: true, onClick: () => setPending({ kind: 'cancel', activity: a }) },
        ];
      case 'draft':
        return [
          { label: 'Continue', solid: true, onClick: () => edit(a) },
          { label: 'Discard', danger: true, onClick: () => setPending({ kind: 'discard', activity: a }) },
        ];
      case 'going':
        return [
          { label: 'View details', onClick: () => notBuilt('Activity details (B3)') },
          { label: 'Leave', danger: true, onClick: () => setPending({ kind: 'leave', activity: a }) },
        ];
      case 'pending':
        return [{ label: 'Withdraw request', danger: true, onClick: () => setPending({ kind: 'withdraw', activity: a }) }];
      case 'pay':
        return [{ label: `Pay ${baht(a.myBalance)}`, solid: true, onClick: () => notBuilt('Payment (E1)') }];
      default:
        return [];
    }
  }

  return (
    <>
      <header className="page-head">
        <div className="eyebrow">{CURRENT_MEMBER.name} &middot; host and participant</div>
        <h1>My activities</h1>
        <div className="filter-chips" role="group" aria-label="Filter activities">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              className="filter-chip"
              aria-pressed={filter === f.key}
              onClick={() => {
                setFilter(f.key);
                setExpandedId(null);
              }}
            >
              {f.label} {groups[f.key].length}
            </button>
          ))}
        </div>
      </header>

      {featured && (
        <FeaturedCard
          activity={featured.activity}
          onReview={() => notBuilt('Reviewing requests (D3)')}
          onEdit={() => edit(featured.activity)}
          onMessage={() => notBuilt('Messaging')}
          onCancel={() => setPending({ kind: 'cancel', activity: featured.activity })}
        />
      )}

      {rows.map((item) => {
        const actions = actionsFor(item);
        return (
          <ActivityRow
            key={item.activity.id}
            item={item}
            actions={actions}
            expanded={expandedId === item.activity.id}
            onToggle={() => setExpandedId((id) => (id === item.activity.id ? null : item.activity.id))}
          />
        );
      })}

      {items.length === 0 && <EmptyState filter={filter} onHost={() => navigate('/host/new')} />}

      <div className="footer-note">
        Demo data, saved in this browser. <button type="button" onClick={resetDemo}>Reset demo data</button>
      </div>

      {pending && (
        <ConfirmDialog
          {...dialogCopy(pending)}
          onConfirm={confirmPending}
          onClose={closeDialog}
        />
      )}
    </>
  );
}

function FeaturedCard({ activity: a, onReview, onEdit, onMessage, onCancel }) {
  const total = costTotal(a.costItems);
  const progress = Math.min(1, a.confirmedCount / a.minParticipants) * 100;
  return (
    <div className="featured-wrap">
      <article className="featured">
        <div className="featured-band">
          <span>{formatWhen(new Date(a.startAt))} &middot; action needed</span>
          <span>Hosting</span>
        </div>
        <div className="featured-body">
          <div className="featured-title">{a.title}</div>
          <div className="meta">
            {a.locationName ?? 'Location not set'} &middot; min {a.minParticipants} / max {a.maxParticipants}
            {total > 0 && <> &middot; {baht(total)} est.</>}
          </div>
          <div className="stats">
            <div>
              <div className="stat-num">{a.confirmedCount}<small>/{a.minParticipants}</small></div>
              <div className="stat-label">confirmed</div>
            </div>
            <div>
              <div className="stat-num accent">{a.pendingRequests}</div>
              <div className="stat-label">{a.pendingRequests === 1 ? 'request' : 'requests'}</div>
            </div>
            <div>
              <div className="stat-num">{a.guestCount}</div>
              <div className="stat-label">{a.guestCount === 1 ? 'guest' : 'guests'}</div>
            </div>
          </div>
          <div
            className="bar"
            role="progressbar"
            aria-label="Confirmed against minimum"
            aria-valuenow={a.confirmedCount}
            aria-valuemin={0}
            aria-valuemax={a.minParticipants}
          >
            <span style={{ width: `${progress}%` }} />
          </div>
          <button type="button" className="btn-primary compact" onClick={onReview}>
            <span>Review {plural(a.pendingRequests, 'request')}</span>
            <span aria-hidden="true">&rarr;</span>
          </button>
          <div className="btn-row">
            <button type="button" className="btn-ghost" onClick={onEdit}>Edit</button>
            <button type="button" className="btn-ghost" onClick={onMessage}>Message all</button>
            <button type="button" className="btn-ghost danger" onClick={onCancel}>Cancel</button>
          </div>
        </div>
      </article>
    </div>
  );
}

function ActivityRow({ item: { activity, view }, actions, expanded, onToggle }) {
  const expandable = actions.length > 0;
  return (
    <div className={`act-row${expanded ? ' open' : ''}`}>
      <button
        type="button"
        className="act-row-main"
        onClick={onToggle}
        disabled={!expandable}
        aria-expanded={expandable ? expanded : undefined}
      >
        <span className={`act-stripe ${view.tone}`} aria-hidden="true" />
        <span className="act-info">
          <span className={`act-eyebrow${view.tone === 'accent' ? ' accent' : ''}`}>{view.eyebrow}</span>
          <span className="act-title">{activity.title}</span>
          <span className="act-sub">{view.subtitle}</span>
        </span>
        <span className={`badge ${view.badge.tone}`}>{view.badge.label}</span>
      </button>
      {expanded && (
        <div className="act-actions">
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              className={`btn-ghost${action.danger ? ' danger' : ''}${action.solid ? ' solid' : ''}`}
              onClick={action.onClick}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ filter, onHost }) {
  const text = {
    all: 'No upcoming activities yet.',
    hosting: "You aren't hosting anything right now.",
    joined: "You haven't joined any upcoming activities.",
    past: 'Finished and cancelled activities will appear here.',
  }[filter];
  return (
    <div className="empty">
      <p>{text}</p>
      {filter !== 'past' && filter !== 'joined' && (
        <button type="button" className="btn-primary" onClick={onHost}>
          <span>Host an activity</span>
          <span className="arrow" aria-hidden="true">&rarr;</span>
        </button>
      )}
    </div>
  );
}

function dialogCopy({ kind, activity: a }) {
  switch (kind) {
    case 'cancel': {
      const others = Math.max(0, a.confirmedCount - 1);
      const who = [
        others > 0 && plural(others, 'confirmed member'),
        a.pendingRequests > 0 && plural(a.pendingRequests, 'pending request'),
      ].filter(Boolean);
      return {
        eyebrow: 'Cancel activity',
        title: `Cancel ${a.title}?`,
        body: `${who.length ? `${who.join(' and ')} will be notified. ` : ''}This can't be undone.`,
        confirmLabel: 'Cancel activity',
      };
    }
    case 'discard':
      return {
        eyebrow: 'Draft',
        title: `Discard ${a.title}?`,
        body: 'The draft has not been published, so nobody else has seen it.',
        confirmLabel: 'Discard draft',
      };
    case 'leave': {
      const locked = a.costLockAt && new Date(a.costLockAt) < new Date();
      return {
        eyebrow: 'Leave activity',
        title: `Leave ${a.title}?`,
        body: locked
          ? 'The cost is already locked, so you still owe your share after leaving.'
          : 'Your place will open for the next person on the waitlist.',
        confirmLabel: 'Leave',
        cancelLabel: 'Stay',
      };
    }
    case 'withdraw':
      return {
        eyebrow: 'Join request',
        title: 'Withdraw your request?',
        body: `The host of ${a.title} will no longer see your request.`,
        confirmLabel: 'Withdraw',
      };
    default:
      return {};
  }
}
