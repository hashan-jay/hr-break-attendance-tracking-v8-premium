import { createContext, useContext, useMemo, useState } from 'react';
import { getViewTimeZone, persistTimeZone, setActiveTimeZone, STORAGE_TIME_ZONE } from '../lib/timeZones';

const TimeZoneContext = createContext(null);

export function TimeZoneProvider({ children }) {
  const [zoneId, setZoneId] = useState(() => {
    const initial = getViewTimeZone();
    setActiveTimeZone(initial);
    return initial;
  });

  const value = useMemo(() => ({
    zoneId,
    setTimeZone(next) {
      const saved = persistTimeZone(next);
      setZoneId(saved);
    },
  }), [zoneId]);

  setActiveTimeZone(zoneId || STORAGE_TIME_ZONE);

  return (
    <TimeZoneContext.Provider value={value}>
      {children}
    </TimeZoneContext.Provider>
  );
}

export function useViewTimeZone() {
  const context = useContext(TimeZoneContext);
  return context?.zoneId || STORAGE_TIME_ZONE;
}

export function useTimeZonePicker() {
  const context = useContext(TimeZoneContext);
  if (!context) {
    return { zoneId: STORAGE_TIME_ZONE, setTimeZone: persistTimeZone };
  }
  return context;
}
