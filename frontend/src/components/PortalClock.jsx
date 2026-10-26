import { useEffect, useState } from 'react';
import { formatNowParts } from '../lib/timeZones';
import { useViewTimeZone } from '../theme/TimeZoneContext';

export default function PortalClock({ size = 'default' }) {
  useViewTimeZone();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const parts = formatNowParts(now);

  return (
    <div className={`portal-clock ${size === 'large' ? 'portal-clock--large' : ''}`} aria-live="polite">
      <div className="portal-clock__section portal-clock__section--date">
        <div className="portal-clock__date">{parts.date}</div>
      </div>
      <div className="portal-clock__section portal-clock__section--time">
        <div className="portal-clock__time">{parts.time}</div>
      </div>
    </div>
  );
}
