const KEY = 'hrActivity';
const MAX_ITEMS = 50;

const read = () => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const write = (items) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
  } catch {
    // ignore quota errors
  }
};

export const addActivity = (activity) => {
  if (!activity?.id || !activity?.message) return;
  const existing = read().filter((item) => item.id !== activity.id);
  write([{ ...activity, createdAt: activity.createdAt || new Date().toISOString() }, ...existing]);
};

export const getActivities = () => read();

export const clearActivities = () => write([]);
