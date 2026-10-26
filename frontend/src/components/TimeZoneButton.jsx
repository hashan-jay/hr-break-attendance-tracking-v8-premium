import { useEffect, useRef, useState } from 'react';
import { useTimeZonePicker } from '../theme/TimeZoneContext';
import { VIEW_TIME_ZONES, zoneOffsetLabel } from '../lib/timeZones';

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8.25" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 7.4V12l3.1 2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function TimeZoneButton() {
  const { zoneId, setTimeZone } = useTimeZonePicker();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const selected = VIEW_TIME_ZONES.find((zone) => zone.id === zoneId) || VIEW_TIME_ZONES[0];

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className={`tz-switch ${open ? 'is-open' : ''}`} ref={rootRef}>
      <button
        type="button"
        className="tz-switch__button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Time zone ${selected.city}. Open time zone list`}
        title={`${selected.city} (${zoneOffsetLabel(selected.id)})`}
        onClick={() => setOpen((value) => !value)}
      >
        <ClockIcon />
      </button>
      {open && (
        <div className="tz-switch__menu" role="listbox" aria-label="Time zones">
          <p className="tz-switch__note">View times in your zone. Records stay on Colombo +05:30.</p>
          {VIEW_TIME_ZONES.map((zone) => {
            const active = zone.id === zoneId;
            return (
              <button
                key={zone.id}
                type="button"
                role="option"
                aria-selected={active}
                className={`tz-switch__option ${active ? 'is-selected' : ''}`}
                onClick={() => {
                  setTimeZone(zone.id);
                  setOpen(false);
                }}
              >
                <span className="tz-switch__city">{zone.city}</span>
                <span className="tz-switch__meta">{zoneOffsetLabel(zone.id)} · {zone.region}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
