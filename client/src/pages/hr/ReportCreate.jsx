import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import Card from '../../components/Card';
import api from '../../api/api';

const ReportCreate = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const initialType = params.get('type') || '';

  const [filters, setFilters] = useState({
    type: initialType,
    periodId: '',
    department: '',
    employeeId: ''
  });
  const [periods, setPeriods] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const formatDate = (value) => {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  useEffect(() => {
    const loadPeriods = async () => {
      try {
        const data = await api.get('/hr/payperiods');
        setPeriods(data || []);
      } catch (err) {
        setError(err.message);
      }
    };
    loadPeriods();
  }, []);

  const visibleFields = useMemo(() => {
    switch ((filters.type || initialType || '').toLowerCase()) {
      case 'payroll':
      case 'payslip':
        return ['periodId', 'department', 'employeeId'];
      case 'advance':
        return ['department', 'employeeId'];
      case 'employee':
        return ['department'];
      default:
        return ['periodId', 'department', 'employeeId'];
    }
  }, [filters.type, initialType]);

  const isTypeLocked = Boolean(initialType);
  const typeLabel = filters.type ? filters.type.charAt(0).toUpperCase() + filters.type.slice(1) : 'All';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const runReport = async () => {
    setLoading(true);
    setError('');
    try {
      const payload = Object.entries(filters).reduce((acc, [key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {});
      const data = await api.post('/hr/reports/custom', payload);
      navigate('/hr/reports/result', { state: { result: data, filters: payload, reportId: data.reportId } });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="reports-builder">
        <Card
          title="Create Report"
          className="report-card"
          actions={
            <div className="report-actions">
              <button
                className="btn secondary"
                onClick={() => setFilters({ type: initialType, periodId: '', department: '', employeeId: '' })}
                disabled={loading}
              >
                Clear
              </button>
              <button className="btn primary" onClick={runReport} disabled={loading}>
                {loading ? 'Running...' : 'Generate report'}
              </button>
            </div>
          }
        >
          <div className="form-grid two-col report-grid">
            <label className="stacked">
              <span className="muted">Report type</span>
              <select
                name="type"
                value={filters.type}
                onChange={handleChange}
                disabled={isTypeLocked}
              >
                <option value="">All</option>
                <option value="payroll">Payroll</option>
                <option value="payslip">Payslip</option>
                <option value="employee">Employee</option>
                <option value="advance">Advance</option>
              </select>
              {isTypeLocked && <span className="hint">Locked from navigation shortcut.</span>}
            </label>

            {visibleFields.includes('periodId') && (
              <label className="stacked">
                <span className="muted">Period</span>
                <select name="periodId" value={filters.periodId} onChange={handleChange}>
                  <option value="">Any period</option>
                  {periods.map((p) => (
                    <option key={p.periodId} value={p.periodId}>
                      {formatDate(p.startDate)} - {formatDate(p.endDate)}
                    </option>
                  ))}
                </select>
                <span className="hint">Filter to a specific pay period.</span>
              </label>
            )}

            {visibleFields.includes('department') && (
              <label className="stacked">
                <span className="muted">Department</span>
                <input name="department" value={filters.department} onChange={handleChange} placeholder="e.g. Finance" />
                <span className="hint">Leave blank to include all departments.</span>
              </label>
            )}

            {visibleFields.includes('employeeId') && (
              <label className="stacked">
                <span className="muted">Employee ID</span>
                <input name="employeeId" value={filters.employeeId} onChange={handleChange} placeholder="Optional" />
                <span className="hint">Target one employee, or leave empty for all.</span>
              </label>
            )}
          </div>

          <div className="pill-row report-pills">
            <span className="pill neutral">Type: {typeLabel}</span>
            {filters.periodId && <span className="pill neutral">Period #{filters.periodId}</span>}
            {filters.department && <span className="pill neutral">Dept: {filters.department}</span>}
            {filters.employeeId && <span className="pill neutral">Employee #{filters.employeeId}</span>}
          </div>

          {error && <div className="error">{error}</div>}
        </Card>

        <div className="info-grid">
          <Card title="How it works">
            <ul className="muted info-list">
              <li>Select the report type to tailor available filters.</li>
              <li>Set optional filters to narrow the data (period, department, or employee).</li>
              <li>Click Generate to see a snapshot that won’t change if data updates later.</li>
            </ul>
          </Card>
          <Card title="Recent periods">
            {periods.slice(0, 3).length === 0 && <div className="muted">No pay periods found.</div>}
            {periods.slice(0, 3).map((p) => (
              <div key={p.periodId} className="stacked" style={{ marginBottom: 8 }}>
                <span className="strong">Period #{p.periodId}</span>
                <span className="muted">{formatDate(p.startDate)} - {formatDate(p.endDate)}</span>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default ReportCreate;
