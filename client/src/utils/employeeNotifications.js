const KEY = 'employeeNotifications';
const MAX_FEED = 50;

const loadState = () => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : { payslips: {}, advances: {}, feed: [] };
  } catch {
    return { payslips: {}, advances: {}, feed: [] };
  }
};

const persistState = (state) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // ignore quota errors
  }
};

const addNotification = (state, notif) => {
  if (!notif?.id || !notif?.message) return state;
  const feed = [notif, ...state.feed.filter((n) => n.id !== notif.id)].slice(0, MAX_FEED);
  return { ...state, feed };
};

const formatDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

const formatRange = (start, end) => {
  const s = formatDate(start);
  const e = formatDate(end);
  if (s && e) return `${s} - ${e}`;
  return s || e;
};

export const syncEmployeeNotifications = (payslips = [], advances = []) => {
  let state = loadState();
  let changed = false;
  const now = () => new Date().toISOString();

  // Rebuild feed fresh using current data to ensure messages stay accurate/formatted
  const newFeed = [];

  payslips.forEach((p) => {
    const key = `payslip-${p.payslipId}`;
    state.payslips[key] = true;
    newFeed.push({
      id: key,
      type: 'payslip',
      message: `New payslip #${p.payslipId} for period ${formatRange(p.startDate, p.endDate)}`,
      createdAt: now()
    });
  });

  advances.forEach((a) => {
    const key = `advance-${a.requestId}`;
    state.advances[key] = a.status;
    newFeed.push({
      id: key,
      type: 'advance',
      message: `Advance #${a.requestId} is ${a.status}`,
      createdAt: now()
    });
  });

  state.feed = newFeed.slice(0, MAX_FEED);
  persistState(state);
  return state.feed;
};

export const getEmployeeNotifications = () => {
  const state = loadState();
  return state.feed || [];
};

export const clearEmployeeNotifications = () => {
  persistState({ payslips: {}, advances: {}, feed: [] });
};
