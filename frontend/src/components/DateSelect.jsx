import { useEffect, useMemo, useRef, useState } from 'react';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function parseIso(value) {
  const [year, month, day] = String(value || '').split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function toIso(date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function sameDay(a, b) {
  return a && b
    && a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

export default function DateSelect({ value, onChange, label = 'Date', max = '', className = '' }) {
  const selected = parseIso(value);
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(() => selected || new Date());
  const [panelStyle, setPanelStyle] = useState(null);
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const dropUp = className.includes('date-select--drop-up');

  useEffect(() => {
    const parsed = parseIso(value);
    if (parsed) setCursor(parsed);
  }, [value]);

  useEffect(() => {
    if (!open || !dropUp) {
      setPanelStyle(null);
      return undefined;
    }
    const place = () => {
      const button = buttonRef.current;
      if (!button || window.innerWidth > 720) {
        setPanelStyle(null);
        return;
      }
      const rect = button.getBoundingClientRect();
      const width = Math.min(rect.width, window.innerWidth - 24);
      const left = Math.max(12, Math.min(rect.left, window.innerWidth - width - 12));
      setPanelStyle({
        position: 'fixed',
        left,
        width,
        right: 'auto',
        top: 'auto',
        bottom: Math.max(8, window.innerHeight - rect.top + 8),
        transform: 'none',
        maxHeight: Math.max(180, rect.top - 16),
      });
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open, dropUp]);

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const days = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const first = new Date(year, month, 1);
    const start = new Date(first);
    start.setDate(1 - first.getDay());
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return date;
    });
  }, [cursor]);

  const labelText = selected
    ? selected.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })
    : 'Select a date';
  const monthLabel = cursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const today = new Date();
  const maxDate = parseIso(max);

  const isAfterMax = (date) => maxDate && date > maxDate && !sameDay(date, maxDate);

  const pick = (date) => {
    if (isAfterMax(date)) return;
    onChange(toIso(date));
    setOpen(false);
  };

  const shiftMonth = (amount) => {
    setCursor((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1));
  };

  return (
    <div className={['date-select', open ? 'is-open' : '', className].filter(Boolean).join(' ')} ref={rootRef}>
      <button
        type="button"
        ref={buttonRef}
        className="date-select__button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((current) => !current)}
      >
        {labelText}
      </button>
      {open && (
        <div className="date-select__panel" role="dialog" aria-label={label} style={panelStyle || undefined}>
          <div className="date-select__head">
            <strong>{monthLabel}</strong>
            <div className="date-select__nav">
              <button type="button" aria-label="Previous month" onClick={() => shiftMonth(-1)}>‹</button>
              <button type="button" aria-label="Next month" onClick={() => shiftMonth(1)}>›</button>
            </div>
          </div>
          <div className="date-select__week" aria-hidden="true">
            {WEEKDAYS.map((day) => <span key={day}>{day}</span>)}
          </div>
          <div className="date-select__grid">
            {days.map((date) => {
              const outside = date.getMonth() !== cursor.getMonth();
              const isSelected = sameDay(date, selected);
              const isToday = sameDay(date, today);
              const disabled = isAfterMax(date);
              return (
                <button
                  key={toIso(date)}
                  type="button"
                  disabled={disabled}
                  className={[
                    'date-select__day',
                    outside ? 'is-outside' : '',
                    isSelected ? 'is-selected' : '',
                    isToday ? 'is-today' : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => pick(date)}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
          <div className="date-select__foot">
            <button type="button" onClick={() => { onChange(''); setOpen(false); }}>Clear</button>
            <button type="button" onClick={() => pick(today)}>Today</button>
          </div>
        </div>
      )}
    </div>
  );
}
