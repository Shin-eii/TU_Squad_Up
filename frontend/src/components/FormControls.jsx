export function Field({ label, htmlFor, aside, hint, error, children }) {
  return (
    <div className="field">
      <div className="field-head">
        {htmlFor ? (
          <label className="label" htmlFor={htmlFor}>{label}</label>
        ) : (
          <span className="label">{label}</span>
        )}
        {aside}
      </div>
      {children}
      {hint && <p className="hint">{hint}</p>}
      {error && <p className="error">{error}</p>}
    </div>
  );
}

export function Segmented({ label, options, value, onChange, accent = false }) {
  return (
    <div className={`segmented${accent ? ' accent' : ''}`} role="radiogroup" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function Stepper({ label, value, onChange, min = 1, max = 200 }) {
  return (
    <div className="stepper">
      <div className="stepper-label">{label}</div>
      <div className="stepper-row">
        <button
          type="button"
          aria-label={`Decrease ${label.toLowerCase()}`}
          disabled={value <= min}
          onClick={() => onChange(Math.max(min, value - 1))}
        >
          &minus;
        </button>
        <input
          type="number"
          inputMode="numeric"
          aria-label={label}
          value={value === 0 ? '' : value}
          min={min}
          max={max}
          onChange={(e) => {
            const n = parseInt(e.target.value, 10);
            onChange(Number.isNaN(n) ? 0 : Math.min(max, n));
          }}
          onBlur={() => value < min && onChange(min)}
        />
        <button
          type="button"
          aria-label={`Increase ${label.toLowerCase()}`}
          disabled={value >= max}
          onClick={() => onChange(Math.min(max, value + 1))}
        >
          +
        </button>
      </div>
    </div>
  );
}
