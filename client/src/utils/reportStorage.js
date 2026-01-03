const STORAGE_KEY = 'hrReports';
const MAX_REPORTS_PER_TYPE = 10;

export const loadSavedReports = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

const persist = (reports) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
  } catch {
    // ignore write errors (storage full)
  }
};

export const saveReportSummary = (report) => {
  if (!report?.type) return;
  const reports = loadSavedReports();
  const filtered = reports.filter((r) => !(r.type === report.type && JSON.stringify(r.filters) === JSON.stringify(report.filters)));
  const withNew = [
    {
      id: Date.now(),
      ...report
    },
    ...filtered
  ];
  const limited = withNew.filter((r, _, arr) => {
    const byType = arr.filter((x) => x.type === r.type);
    const indexInType = byType.findIndex((x) => x.id === r.id);
    return indexInType > -1 ? indexInType < MAX_REPORTS_PER_TYPE : true;
  });
  persist(limited);
};

export const clearReports = () => {
  persist([]);
};
