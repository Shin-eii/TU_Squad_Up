import { useEffect, useRef } from 'react';

export default function ConfirmDialog({ eyebrow, title, body, confirmLabel, cancelLabel = 'Keep it', onConfirm, onClose }) {
  const safeButton = useRef(null);

  useEffect(() => {
    safeButton.current?.focus();
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title" onClick={(e) => e.stopPropagation()}>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h2 id="confirm-title">{title}</h2>
        <p>{body}</p>
        <div className="btn-row">
          <button ref={safeButton} type="button" className="btn-ghost" onClick={onClose}>{cancelLabel}</button>
          <button type="button" className="btn-ghost solid" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
