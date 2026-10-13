import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Field, Segmented, Stepper } from '../components/FormControls.jsx';
import { useToast } from '../components/Toast.jsx';
import { CATEGORIES, JOIN_MODES, MAX_CAPACITY, SPLIT_MODES } from '../data/constants.js';
import { CURRENT_MEMBER } from '../data/mockData.js';
import { activityToForm, emptyForm, formToActivity } from '../lib/activityForm.js';
import {
  addHours,
  baht,
  costTotal,
  formatWhen,
  fromDateAndTime,
  fromDateTimeInput,
  newId,
  toDateTimeInput,
} from '../lib/format.js';
import { hasErrors, validateActivity } from '../lib/validate.js';
import { useActivities } from '../store/ActivityContext.jsx';

/** C1 · Enter details, rules, capacity & cost. Also used to edit a hosted activity. */
export default function NewActivity() {
  const { id } = useParams();
  const { activities } = useActivities();
  const existing = id ? activities.find((a) => a.id === id) : null;

  if (id && (!existing || existing.role !== 'host')) return <Navigate to="/mine" replace />;
  return <ActivityForm key={id ?? 'new'} existing={existing} />;
}

function ActivityForm({ existing }) {
  const navigate = useNavigate();
  const toast = useToast();
  const { saveActivity } = useActivities();

  const [form, setForm] = useState(() => (existing ? activityToForm(existing) : emptyForm()));
  const [attempts, setAttempts] = useState(0);
  const [newItem, setNewItem] = useState({ label: '', amount: '' });
  const [itemError, setItemError] = useState('');
  const [newRule, setNewRule] = useState('');
  const summaryRef = useRef(null);
  const itemInputRef = useRef(null);
  const ruleInputRef = useRef(null);

  const isDraft = !existing || existing.status === 'draft';
  const errors = useMemo(() => validateActivity(form, existing), [form, existing]);
  const shown = attempts > 0 ? errors : {};
  const total = costTotal(form.costItems);
  const paid = total > 0;
  const joinMode = JOIN_MODES.find((m) => m.value === form.joinMode);

  useEffect(() => {
    if (attempts > 0) summaryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [attempts]);

  const update = (patch) => setForm((f) => ({ ...f, ...patch }));

  // Moving the start time drags the deadline and cost lock along until the host sets them by hand.
  function updateSchedule(patch) {
    setForm((f) => {
      const next = { ...f, ...patch };
      const start = fromDateAndTime(next.date, next.startTime);
      if (start) {
        if (!next.deadlineTouched) next.deadline = toDateTimeInput(addHours(start, -1));
        if (!next.costLockTouched) next.costLock = toDateTimeInput(addHours(start, -2));
      }
      return next;
    });
  }

  function addCostItem() {
    const label = newItem.label.trim();
    const amount = Number(newItem.amount);
    if (!label) return setItemError('Name the cost item.');
    if (!(amount > 0)) return setItemError('The amount must be more than 0฿.');
    update({ costItems: [...form.costItems, { id: newId('ci'), label, amount: Math.round(amount * 100) / 100 }] });
    setNewItem({ label: '', amount: '' });
    setItemError('');
    itemInputRef.current?.focus();
  }

  function addRule() {
    const text = newRule.trim();
    if (!text) return;
    update({ rules: [...form.rules, { id: newId('r'), text }] });
    setNewRule('');
    ruleInputRef.current?.focus();
  }

  // Enter inside the "add" inputs should add the row, not submit the whole form.
  const onEnter = (fn) => (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      fn();
    }
  };

  function save() {
    saveActivity(formToActivity(form, existing, CURRENT_MEMBER));
  }

  function handleSaveDraft() {
    if (!form.title.trim()) {
      toast('Add a title before saving a draft.');
      return;
    }
    save();
    toast('Draft saved.');
    navigate('/mine');
  }

  function handleSubmit(e) {
    e.preventDefault();
    setAttempts((n) => n + 1);
    if (hasErrors(errors)) return;
    save();
    toast(isDraft
      ? 'Details saved as a draft. The location step (C2) is the next screen to build.'
      : 'Changes saved.');
    navigate('/mine');
  }

  const perPerson = (people) => baht(Math.ceil(total / people));
  const lock = fromDateTimeInput(form.costLock);

  return (
    <div className="screen">
      <header className="topbar">
        <button type="button" className="icon-btn" aria-label="Close" onClick={() => navigate(-1)}>&times;</button>
        <div>
          <div className="eyebrow">{isDraft ? 'Step 1 of 3' : 'Hosting'}</div>
          <div className="topbar-title">{existing ? 'Edit activity' : 'New activity'}</div>
        </div>
        {isDraft && (
          <button type="button" className="link-btn" onClick={handleSaveDraft}>Save draft</button>
        )}
      </header>
      {isDraft && (
        <div className="progress" aria-hidden="true"><span className="on" /><span /><span /></div>
      )}

      <form className="form" onSubmit={handleSubmit} noValidate>
        <Field label="Title" htmlFor="title" error={shown.title}>
          <input
            id="title"
            className={`input strong${shown.title ? ' invalid' : ''}`}
            placeholder="e.g. Football pickup match"
            maxLength={100}
            value={form.title}
            onChange={(e) => update({ title: e.target.value })}
          />
        </Field>

        <Field label="Category">
          <div className="chips" role="group" aria-label="Category">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                className="chip"
                aria-pressed={form.category === c}
                onClick={() => update({ category: c })}
              >
                {c}
              </button>
            ))}
          </div>
        </Field>

        <div>
          <div className="row">
            <Field label="Date" htmlFor="date">
              <input
                id="date"
                type="date"
                className={`input${shown.time ? ' invalid' : ''}`}
                value={form.date}
                onChange={(e) => updateSchedule({ date: e.target.value })}
              />
            </Field>
          </div>
          <div className="row" style={{ marginTop: 'var(--space-3)' }}>
            <Field label="Start" htmlFor="start">
              <input
                id="start"
                type="time"
                className={`input${shown.time ? ' invalid' : ''}`}
                value={form.startTime}
                onChange={(e) => updateSchedule({ startTime: e.target.value })}
              />
            </Field>
            <Field label="End" htmlFor="end">
              <input
                id="end"
                type="time"
                className={`input${shown.time ? ' invalid' : ''}`}
                value={form.endTime}
                onChange={(e) => update({ endTime: e.target.value })}
              />
            </Field>
          </div>
          {shown.time && <p className="error">{shown.time}</p>}
        </div>

        <div>
          <div className="row stack-narrow">
            <Field label="Registration deadline" htmlFor="deadline">
              <input
                id="deadline"
                type="datetime-local"
                className={`input${shown.deadline ? ' invalid' : ''}`}
                value={form.deadline}
                onChange={(e) => update({ deadline: e.target.value, deadlineTouched: true })}
              />
            </Field>
            <Field label="Cost lock at" htmlFor="costLock">
              <input
                id="costLock"
                type="datetime-local"
                className={`input${paid ? ' strong' : ''}${shown.costLock ? ' invalid' : ''}`}
                value={form.costLock}
                disabled={!paid}
                onChange={(e) => update({ costLock: e.target.value, costLockTouched: true })}
              />
            </Field>
          </div>
          {shown.deadline && <p className="error">{shown.deadline}</p>}
          {shown.costLock && <p className="error">{shown.costLock}</p>}
          <p className="hint">
            {paid
              ? 'Paid activities must lock their costs. The default is two hours before the start.'
              : 'Free activity, so no cost lock is needed. Add a cost item below to set one.'}
          </p>
        </div>

        <Field label="Capacity" aside={<span className="aside">min must be &le; max</span>} error={shown.capacity}>
          <div className={`capacity${shown.capacity ? ' invalid' : ''}`}>
            <Stepper label="Minimum" value={form.min} min={1} max={MAX_CAPACITY} onChange={(min) => update({ min })} />
            <Stepper label="Maximum" value={form.max} min={1} max={MAX_CAPACITY} onChange={(max) => update({ max })} />
          </div>
        </Field>

        <Field label="Join approval" hint={joinMode?.hint}>
          <Segmented label="Join approval" options={JOIN_MODES} value={form.joinMode} onChange={(joinMode) => update({ joinMode })} />
        </Field>

        <Field
          label="Cost items"
          aside={<button type="button" className="aside-action" onClick={() => itemInputRef.current?.focus()}>+ Add item</button>}
          error={itemError}
        >
          <div className="list-box">
            {form.costItems.map((item) => (
              <div key={item.id} className="list-row">
                <span>{item.label}</span>
                <strong className="amount">{baht(item.amount)}</strong>
                <button
                  type="button"
                  className="remove-btn"
                  aria-label={`Remove ${item.label}`}
                  onClick={() => update({ costItems: form.costItems.filter((i) => i.id !== item.id) })}
                >
                  &times;
                </button>
              </div>
            ))}
            <div className="add-row">
              <input
                ref={itemInputRef}
                className="input"
                placeholder="Item, e.g. Court booking"
                aria-label="New cost item name"
                value={newItem.label}
                onChange={(e) => setNewItem({ ...newItem, label: e.target.value })}
                onKeyDown={onEnter(addCostItem)}
              />
              <input
                className="input amount-input"
                type="number"
                inputMode="decimal"
                min="0"
                placeholder="Baht"
                aria-label="New cost item amount in baht"
                value={newItem.amount}
                onChange={(e) => setNewItem({ ...newItem, amount: e.target.value })}
                onKeyDown={onEnter(addCostItem)}
              />
              <button type="button" className="btn-add" onClick={addCostItem}>Add</button>
            </div>
            <div className="list-row total">
              <span>{paid ? 'Estimated total' : 'Free activity'}</span>
              <span>{baht(total)}</span>
            </div>
          </div>
          {paid && (
            <Segmented label="Split method" accent options={SPLIT_MODES} value={form.splitMode} onChange={(splitMode) => update({ splitMode })} />
          )}
          {paid && form.splitMode === 'equal' && form.min >= 1 && (
            <p className="hint">
              At {form.min} {form.min === 1 ? 'person' : 'people'} that is {perPerson(form.min)} each
              {form.max > form.min && <>, or {perPerson(form.max)} at {form.max}</>}. Shown as an estimate until the cost lock
              {lock && <> ({formatWhen(lock)})</>}.
            </p>
          )}
          {paid && form.splitMode === 'individual' && (
            <p className="hint">Each member pays for what they use. The items above are shown as reference prices.</p>
          )}
        </Field>

        <Field
          label="Rules"
          aside={<button type="button" className="aside-action" onClick={() => ruleInputRef.current?.focus()}>+ Add rule</button>}
        >
          <div className="rules">
            {form.rules.map((rule) => (
              <div key={rule.id} className="rule">
                <span>{rule.text}</span>
                <button
                  type="button"
                  className="remove-btn"
                  aria-label={`Remove rule: ${rule.text}`}
                  onClick={() => update({ rules: form.rules.filter((r) => r.id !== rule.id) })}
                >
                  &times;
                </button>
              </div>
            ))}
            <div className="add-row">
              <input
                ref={ruleInputRef}
                className="input"
                placeholder="e.g. Arrive 10 minutes early"
                aria-label="New rule"
                maxLength={120}
                value={newRule}
                onChange={(e) => setNewRule(e.target.value)}
                onKeyDown={onEnter(addRule)}
              />
              <button type="button" className="btn-add" onClick={addRule}>Add</button>
            </div>
          </div>
        </Field>

        {hasErrors(shown) && (
          <div className="error-summary" ref={summaryRef} role="alert">
            <h2>Fix these before continuing</h2>
            <ul>
              {Object.entries(shown).map(([key, message]) => <li key={key}>{message}</li>)}
            </ul>
          </div>
        )}

        <button type="submit" className="btn-primary">
          <span>{isDraft ? 'Next: set the location' : 'Save changes'}</span>
          <span className="arrow" aria-hidden="true">&rarr;</span>
        </button>
      </form>
    </div>
  );
}
