import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import Card from '../../components/Card';
import api from '../../api/api';

const Payroll = () => {
  const [periods, setPeriods] = useState([]);
  const [payslipPeriod, setPayslipPeriod] = useState('');
  const [payrollPeriod, setPayrollPeriod] = useState('');
  const [payslips, setPayslips] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [periodCreating, setPeriodCreating] = useState(false);
  const [message, setMessage] = useState('');
  const [bulkMessage, setBulkMessage] = useState('');
  const [error, setError] = useState('');
  const [bulkError, setBulkError] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [bulkEmployeeId, setBulkEmployeeId] = useState('');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [customError, setCustomError] = useState('');
  const navigate = useNavigate();

  const formatAmount = (val) => (val === undefined || val === null || val === '') ? '0' : `${val}`;
  const fixedRange = () => {
    const now = new Date();
    const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startDate = new Date(endDate);
    startDate.setMonth(startDate.getMonth() - 1);
    return { startDate, endDate };
  };
  const formatDateDisplay = (value) => {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const loadPeriods = async () => {
    try {
      const data = await api.get('/hr/payperiods');
      const { startDate, endDate } = fixedRange();
      const defaultMatch = (data || []).find((p) => {
        const s = new Date(p.startDate);
        const e = new Date(p.endDate);
        if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return false;
        return s <= endDate && e >= startDate;
      });

      const fallback = defaultMatch || (data && data[0]);
      setPeriods(data || []);
      if (fallback?.periodId) {
        const id = String(fallback.periodId);
        setPayslipPeriod(id);
        setPayrollPeriod(id);
      } else {
        setPayslipPeriod('');
        setPayrollPeriod('');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCustomCreate = async () => {
    setCustomError('');
    setCustomMessage('');
    if (!customStart || !customEnd) {
      setCustomError('Start and end dates are required');
      return;
    }
    const start = new Date(customStart);
    const end = new Date(customEnd);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      setCustomError('Invalid dates');
      return;
    }
    if (end < start) {
      setCustomError('End date must be after start date');
      return;
    }
    if (start.getMonth() !== end.getMonth() || start.getFullYear() !== end.getFullYear()) {
      setCustomError('Period must be within the same month');
      return;
    }
    setPeriodCreating(true);
    try {
      await api.post('/hr/payperiods', {
        startDate: customStart,
        endDate: customEnd,
        status: 'OPEN'
      });
      await loadPeriods();
      setCustomMessage('Pay period created');
    } catch (err) {
      const msg = err?.message || '';
      if (msg.toLowerCase().includes('duplicate') || msg.toLowerCase().includes('exists')) {
        await loadPeriods();
        setCustomMessage('Pay period already exists and is selected');
      } else {
        setCustomError(msg || 'Failed to create pay period');
      }
    } finally {
      setPeriodCreating(false);
    }
  };

  const loadPayslips = async (periodId) => {
    if (!periodId) return;
    setLoading(true);
    setError('');
    try {
      const data = await api.get(`/hr/payslips?periodId=${periodId}`);
      setPayslips(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const data = await api.get('/hr/employees');
      setEmployees(data);
      return data;
    } catch (err) {
      setError(err.message);
      return [];
    }
  };

  useEffect(() => {
    loadPeriods();
    loadEmployees();
  }, []);

  useEffect(() => {
    if (payslipPeriod) loadPayslips(payslipPeriod);
  }, [payslipPeriod]);

  const handleGenerate = async () => {
    setMessage('');
    setError('');
    if (!employeeId || !payslipPeriod) {
      setError('Employee ID and Period are required');
      return;
    }
    setLoading(true);
    try {
      await api.post('/hr/payslips/generate', { employeeId: Number(employeeId), periodId: Number(payslipPeriod) });
      setMessage('Payslip generated');
      setEmployeeId('');
      loadPayslips(payslipPeriod);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePayroll = async () => {
    setBulkMessage('');
    setBulkError('');
    if (!payrollPeriod) {
      setBulkError('Select a pay period first');
      return;
    }
    setBulkLoading(true);
    try {
      const list = employees.length ? employees : await loadEmployees();
      const targets = bulkEmployeeId
        ? list.filter((e) => String(e.id) === String(bulkEmployeeId))
        : list;
      if (!targets.length) {
        setBulkError('No employees found for this request');
        setBulkLoading(false);
        return;
      }

      let success = 0;
      let failed = 0;
      for (const emp of targets) {
        try {
          await api.post('/hr/payslips/generate', { employeeId: Number(emp.id), periodId: Number(payrollPeriod) });
          success += 1;
        } catch (err) {
          failed += 1;
        }
      }
      setBulkMessage(`Payroll run complete: ${success} success${failed ? `, ${failed} failed` : ''}`);
      setBulkEmployeeId('');
      loadPayslips(payslipPeriod || payrollPeriod);
    } catch (err) {
      setBulkError(err.message || 'Failed to generate payroll');
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <Layout>
      <div className="payroll-page">
        <div className="payroll-forms">
          <Card title="Generate Payslip" className="payroll-card">
            <div className="payroll-form">
              <label>
                Pay period
                <select
                  value={payslipPeriod}
                  onChange={(e) => setPayslipPeriod(e.target.value)}
                  disabled={!periods.length}
                >
                  <option value="">Select period</option>
                  {periods.map((p) => (
                    <option key={p.periodId} value={p.periodId}>
                      {formatDateDisplay(p.startDate)} to {formatDateDisplay(p.endDate)} ({p.status})
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Employee ID
                <input
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  placeholder="Enter employee ID"
                />
              </label>
              <button className="btn primary full" onClick={handleGenerate} disabled={loading}>
                {loading ? 'Generating...' : 'Generate payslip'}
              </button>
              {!periods.length && (
                <div className="muted small">No pay periods found. Create one to generate payslips.</div>
              )}
              {error && <div className="error">{error}</div>}
              {message && <div className="success">{message}</div>}
            </div>
          </Card>

          <Card title="Generate Payroll" className="payroll-card">
            <div className="payroll-form">
              <label>
                Pay period
                <select
                  value={payrollPeriod}
                  onChange={(e) => setPayrollPeriod(e.target.value)}
                  disabled={!periods.length}
                >
                  <option value="">Select period</option>
                  {periods.map((p) => (
                    <option key={p.periodId} value={p.periodId}>
                      {formatDateDisplay(p.startDate)} to {formatDateDisplay(p.endDate)} ({p.status})
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Employee ID (optional)
                <input
                  value={bulkEmployeeId}
                  onChange={(e) => setBulkEmployeeId(e.target.value)}
                  placeholder="Blank = all employees"
                />
              </label>
              <button className="btn secondary full" onClick={handleGeneratePayroll} disabled={bulkLoading}>
                {bulkLoading ? 'Running...' : 'Generate payroll'}
              </button>
              <button
                className="btn ghost full"
                onClick={() => payrollPeriod && navigate(`/hr/payroll/${payrollPeriod}`)}
                disabled={!payrollPeriod}
              >
                View payroll summary
              </button>
              {!periods.length && (
                <div className="muted small">No pay periods found. Create one to run payroll.</div>
              )}
              {bulkError && <div className="error">{bulkError}</div>}
              {bulkMessage && <div className="success">{bulkMessage}</div>}
            </div>
          </Card>
        </div>

        <Card title="Payslips" className="payslip-list-card">
          {loading ? (
            <div className="muted">Loading payslips...</div>
          ) : (
            <div className="payslip-list">
              {payslips.map((p) => (
                <div key={p.payslipId} className="payslip-item">
                  <div className="payslip-avatar">{p.fullName?.[0] || 'E'}</div>
                  <div className="payslip-info">
                    <div className="payslip-name">{p.fullName}</div>
                    <div className="payslip-meta">
                      <span>Dept: {p.department || '—'}</span>
                      <span>Net: ${formatAmount(p.netSalary)}</span>
                    </div>
                  </div>
                  <button className="btn ghost" onClick={() => navigate(`/hr/payslip/${p.payslipId}`)}>View</button>
                </div>
              ))}
              {!payslips.length && <div className="muted">No payslips yet for this period.</div>}
            </div>
          )}
        </Card>

        <Card title="Create Pay Period" className="payroll-card">
          <div className="payroll-form">
            <div className="muted small">Select a start and end date within the same month.</div>
            <label>
              Start date
              <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} />
            </label>
            <label>
              End date
              <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} />
            </label>
            <button className="btn secondary full" onClick={handleCustomCreate} disabled={periodCreating}>
              {periodCreating ? 'Creating...' : 'Create pay period'}
            </button>
            {customError && <div className="error">{customError}</div>}
            {customMessage && <div className="success">{customMessage}</div>}
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default Payroll;
