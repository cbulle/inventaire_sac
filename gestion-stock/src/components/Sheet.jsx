import { useEffect } from 'react';

// Panneau qui monte du bas de l'écran (centré sur ordinateur)
export default function Sheet({ title, onClose, children, footer }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title} onClick={e => e.stopPropagation()}>
        <div className="sheet-header">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Fermer">
            <span className="material-icons">close</span>
          </button>
        </div>
        <div className="sheet-body">{children}</div>
        {footer && <div className="sheet-footer">{footer}</div>}
      </div>
    </div>
  );
}

export function Stepper({ value, onChange, min = 0, label }) {
  const n = Number(value) || 0;
  return (
    <div className="stepper" aria-label={label}>
      <button type="button" onClick={() => onChange(Math.max(min, n - 1))} aria-label="Moins" disabled={n <= min}>
        <span className="material-icons">remove</span>
      </button>
      <input
        type="number" inputMode="numeric" min={min} value={value}
        onChange={e => onChange(e.target.value === '' ? '' : Math.max(min, Number(e.target.value)))}
      />
      <button type="button" onClick={() => onChange(n + 1)} aria-label="Plus">
        <span className="material-icons">add</span>
      </button>
    </div>
  );
}
