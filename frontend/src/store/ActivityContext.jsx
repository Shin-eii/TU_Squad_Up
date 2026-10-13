import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { createMockActivities } from '../data/mockData.js';

// In-browser stand-in for the backend. Swap these functions for API calls
// (POST /activities, PATCH /activities/:id, ...) when the server is ready.
const STORAGE_KEY = 'tu-squad-up.activities.v1';
const ActivityContext = createContext(null);

function loadActivities() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // Storage unavailable or corrupted: fall back to demo data.
  }
  return createMockActivities();
}

export function ActivityProvider({ children }) {
  const [activities, setActivities] = useState(loadActivities);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(activities));
    } catch {
      // Ignore: the demo still works for this session.
    }
  }, [activities]);

  const saveActivity = useCallback((activity) => {
    setActivities((list) =>
      list.some((a) => a.id === activity.id)
        ? list.map((a) => (a.id === activity.id ? activity : a))
        : [activity, ...list],
    );
  }, []);

  const updateActivity = useCallback((id, patch) => {
    setActivities((list) => list.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  }, []);

  const removeActivity = useCallback((id) => {
    setActivities((list) => list.filter((a) => a.id !== id));
  }, []);

  const resetDemo = useCallback(() => setActivities(createMockActivities()), []);

  const value = useMemo(
    () => ({ activities, saveActivity, updateActivity, removeActivity, resetDemo }),
    [activities, saveActivity, updateActivity, removeActivity, resetDemo],
  );

  return <ActivityContext.Provider value={value}>{children}</ActivityContext.Provider>;
}

export function useActivities() {
  const ctx = useContext(ActivityContext);
  if (!ctx) throw new Error('useActivities must be used inside <ActivityProvider>');
  return ctx;
}
