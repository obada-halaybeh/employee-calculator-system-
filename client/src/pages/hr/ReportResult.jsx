import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import Card from '../../components/Card';
import api from '../../api/api';
import { addActivity } from '../../utils/localActivity';

const ReportResult = () => {
  const { state, search } = useLocation();
  const navigate = useNavigate();
  const [result, setResult] = useState(state?.result || null);
  const [filters, setFilters] = useState(state?.filters || {});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [salaries, setSalaries] = useState({});

  const searchParams = new URLSearchParams(search);
  const reportIdParam = searchParams.get('id');
  const reportId = state?.reportId || (reportIdParam ? Number(reportIdParam) : null);

  const reportType = (filters?.type || '').toLowerCase();
  const hasFilters = Boolean(filters && Object.keys(filters).length);
  const hasReportId = Boolean(reportId);

  useEffect(() => {
    // If user lands without data but has filters, refetch so direct visits still work
    const refetch = async () => {
      if (result || !hasFilters || hasReportId) return;
      setLoading(true);
      try {
        const data = await api.post('/hr/reports/custom', filters);
        setResult(data);
        if (data.reportId) {
          // Keep reportId in navigation history
          navigate('/hr/reports/result', { replace: true, state: { result: data, filters, reportId: data.reportId } });
        }
        addActivity({
          id: data.reportId ? `report-${data.reportId}` : `report-${Date.now()}`,
          type: 'report_generated',
          message: data.reportId
            ? `Report #${data.reportId} (${reportType || 'all'}) generated`
            : `Report (${reportType || 'all'}) generated`,
          createdAt: new Date().toISOString()
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    refetch();
  }, [filters, hasFilters, hasReportId, navigate, result]);

  useEffect(() => {
    const loadSaved = async () => {
      if (!reportId || result) return;
      setLoading(true);
      try {
        const data = await api.get(`/hr/reports/saved/${reportId}`);
        setFilters(data.filters || {});
        setResult(data.result || null);
        addActivity({
          id: `report-${data.reportId}`,
          type: 'report_generated',
          message: `Report #${data.reportId} (${data.type || 'all'}) generated`,
          createdAt: data.createdAt
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadSaved();
  }, [reportId, result]);

  useEffect(() => {
    if (!result) return;
    const id = reportId ? `report-${reportId}` : `report-${Date.now()}`;
    addActivity({
      id,
      type: 'report_generated',
      message: reportId
        ? `Report #${reportId} (${reportType || 'all'}) generated`
        : `Report (${reportType || 'all'}) generated`,
      createdAt: new Date().toISOString()
    });
  }, [reportId, reportType, result]);

  // For employee reports, load employees and salary details to populate department distribution
  useEffect(() => {
    // Prefer snapshot employees from the report result; fallback to live data only if missing.
    if (result?.employees?.length) {
      setEmployees(result.employees);
      const map = {};
      result.employees.forEach((emp) => {
        map[emp.id] = { net: emp.net, gross: emp.gross };
      });
      setSalaries(map);
      return;
    }

    const loadEmployees = async () => {
      if (reportType !== 'employee') return;
      try {
        const data = await api.get('/hr/employees');
        setEmployees(data || []);
      } catch (err) {
        setError(err.message);
      }
    };
    loadEmployees();
  }, [reportType, result]);

  const departmentTotals = useMemo(() => {
    const totals = {};
    if (reportType === 'employee') {
      (employees || []).forEach((emp) => {
        const dept = (emp?.department || 'Unassigned').trim() || 'Unassigned';
        const net = salaries[emp.id]?.net ?? emp.net ?? 0;
        totals[dept] = (totals[dept] || 0) + net;
      });
    } else if (result?.payslips) {
      result.payslips.forEach((p) => {
        const dept = (p.department || 'Unassigned').trim() || 'Unassigned';
        totals[dept] = (totals[dept] || 0) + Number(p.netSalary || 0);
      });
    }
    return totals;
  }, [employees, reportType, result, salaries]);

  const advanceSummary = useMemo(() => {
    if (!result?.advances) return null;
    const uniq = new Set(result.advances.map((a) => a.employeeId)).size;
    const total = result.advances.reduce((sum, a) => sum + Number(a.amount || 0), 0);
    const approvedTotal = result.advances
      .filter((a) => String(a.status).toUpperCase() === 'APPROVED')
      .reduce((sum, a) => sum + Number(a.amount || 0), 0);
    return { employees: uniq, total, approvedTotal };
  }, [result]);

  const formatCurrency = (val) =>
    `$${Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const printReport = () => {
    if (!result) return;
    window.print();
  };

  if (!state && !result && !hasFilters) {
    return (
      <Layout>
        <Card title="Report">
          <div className="muted">No report found. Generate one first.</div>
          <button className="btn primary" onClick={() => navigate('/hr/reports/create')}>
            Go to report builder
          </button>
        </Card>
      </Layout>
    );
  }

  return (
    <Layout>
      <Card
        title="Report"
        actions={
          <div className="flex gap-8">
            <button className="btn secondary" onClick={() => navigate(-1)}>
              Back
            </button>
            <button className="btn primary" onClick={printReport} disabled={!result || loading}>
              Print report
            </button>
          </div>
        }
      >
        {loading && <div className="muted">Loading report...</div>}
        {error && <div className="error">{error}</div>}
        {!loading && result && (
          <>
            {reportType === 'advance' && advanceSummary ? (
              <Card title="Advance Summary">
                <div className="grid cols-2">
                  <div className="card">
                    <div className="muted">Employees requesting</div>
                    <div>{advanceSummary.employees}</div>
                  </div>
                  <div className="card">
                    <div className="muted">Total requested</div>
                    <div>{formatCurrency(advanceSummary.total)}</div>
                  </div>
                  <div className="card">
                    <div className="muted">Total approved</div>
                    <div>{formatCurrency(advanceSummary.approvedTotal)}</div>
                  </div>
                </div>
              </Card>
            ) : (
              <Card title="Summary">
                <div className="grid cols-3">
                  <div className="card">
                    <div className="muted">Total Employees</div>
                    <div>{result.summary?.totalEmployees ?? 0}</div>
                  </div>
                  <div className="card">
                    <div className="muted">Total Net Salary</div>
                    <div>{formatCurrency(result.summary?.totalNetSalary)}</div>
                  </div>
                  <div className="card">
                    <div className="muted">Total Deductions</div>
                    <div>{formatCurrency(result.summary?.totalDeductions)}</div>
                  </div>
                </div>
              </Card>
            )}

            {result.payslips && (
              <Card title="Payslip Results">
                <table className="table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Employee</th>
                      <th>Department</th>
                      <th>Net Salary</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.payslips.map((p) => (
                      <tr key={p.payslipId}>
                        <td>{p.payslipId}</td>
                        <td>{p.fullName}</td>
                        <td>{p.department || '-'}</td>
                        <td>{p.netSalary}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            )}

            {result.advances && (
              <Card title="Advance Results">
                <table className="table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Employee</th>
                      <th>Department</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.advances.map((a) => (
                      <tr key={a.requestId}>
                        <td>{a.requestId}</td>
                        <td>{a.fullName}</td>
                        <td>{a.department || '-'}</td>
                        <td>{formatCurrency(a.amount)}</td>
                        <td>{a.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            )}

            {reportType === 'employee' && (
              <>
                <Card title="Employee Report Details">
                  <div className="muted">Salary snapshot by employee</div>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Employee Name</th>
                        <th>Department</th>
                        <th>Position</th>
                        <th>Net Salary</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employees.map((emp) => (
                        <tr key={emp.id}>
                          <td>{emp.fullName || emp.username || 'N/A'}</td>
                          <td>{emp.department || 'Unassigned'}</td>
                          <td>{emp.position || 'N/A'}</td>
                          <td>
                            {salaries[emp.id] ? formatCurrency(salaries[emp.id].net) : 'No salary set'}
                          </td>
                          <td>{emp.isActive ? 'Active' : 'Inactive'}</td>
                        </tr>
                      ))}
                      {!employees.length && (
                        <tr>
                          <td colSpan="5" className="muted">No employee data available.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </Card>

                <Card title="Department Distribution">
                  {Object.keys(departmentTotals).length === 0 ? (
                    <div className="muted">No salary data available.</div>
                  ) : (
                    <div className="donut-wrapper">
                      <DepartmentDonut totals={departmentTotals} />
                      <div className="donut-legend">
                        {Object.entries(departmentTotals).map(([dept, val], idx) => {
                          const colors = ['#2563eb', '#6366f1', '#a855f7', '#22c55e', '#f59e0b', '#ef4444'];
                          const color = colors[idx % colors.length];
                          const total = Object.values(departmentTotals).reduce((sum, n) => sum + n, 0);
                          const pct = total ? Math.round((val / total) * 100) : 0;
                          return (
                            <div key={dept} className="donut-legend-item">
                              <span className="dot" style={{ background: color }} />
                              <span className="donut-legend-text">{dept}</span>
                              <span className="donut-legend-pct">{pct}%</span>
                              <span className="donut-legend-amt">{formatCurrency(val)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </Card>
              </>
            )}
          </>
        )}
      </Card>
    </Layout>
  );
};

const wrapCsv = (val) => {
  if (val === null || val === undefined) return '';
  const safe = String(val).replace(/"/g, '""');
  return `"${safe}"`;
};

const DepartmentDonut = ({ totals }) => {
  const colors = ['#2563eb', '#6366f1', '#a855f7', '#22c55e', '#f59e0b', '#ef4444'];
  const entries = Object.entries(totals);
  const total = entries.reduce((sum, [, v]) => sum + v, 0);
  let cumulative = 0;
  const radius = 60;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="donut-chart-container">
      <svg className="donut-chart" viewBox="0 0 200 200">
        <circle className="donut-bg" cx="100" cy="100" r={radius} strokeWidth="24" fill="transparent" />
        {entries.map(([dept, value], idx) => {
          const pct = total ? value / total : 0;
          const dash = pct * circumference;
          const gap = circumference - dash;
          const rotation = (cumulative / total) * 360;
          cumulative += value;
          return (
            <circle
              key={dept}
              cx="100"
              cy="100"
              r={radius}
              fill="transparent"
              stroke={colors[idx % colors.length]}
              strokeWidth="24"
              strokeDasharray={`${dash} ${gap}`}
              transform={`rotate(-90 100 100) rotate(${rotation} 100 100)`}
            />
          );
        })}
        <text x="100" y="95" textAnchor="middle" className="donut-total">${total.toLocaleString()}</text>
        <text x="100" y="115" textAnchor="middle" className="donut-label">Total</text>
      </svg>
    </div>
  );
};

export default ReportResult;
