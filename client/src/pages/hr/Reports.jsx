import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import Card from '../../components/Card';
import api from '../../api/api';

const Reports = () => {
  const [filters, setFilters] = useState({
    type: '',
    periodId: '',
    department: '',
    employeeId: '',
    payslipStatus: '',
    startDate: '',
    endDate: ''
  });
  const [periods, setPeriods] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const loadPeriods = async () => {
    try {
      const data = await api.get('/hr/payperiods');
      setPeriods(data);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadPeriods();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const runReport = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.post('/hr/reports/custom', filters);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Card title="Custom Reports">
        <div className="form-grid">
          <label>
            Type
            <select name="type" value={filters.type} onChange={handleChange}>
              <option value="">All</option>
              <option value="payslip">Payslip</option>
              <option value="advance">Advance</option>
            </select>
          </label>
          <label>
            Period
            <select name="periodId" value={filters.periodId} onChange={handleChange}>
              <option value="">Any</option>
              {periods.map((p) => (
                <option key={p.periodId} value={p.periodId}>
                  {p.startDate} - {p.endDate}
                </option>
              ))}
            </select>
          </label>
          <label>
            Department
            <input name="department" value={filters.department} onChange={handleChange} />
          </label>
          <label>
            Employee ID
            <input name="employeeId" value={filters.employeeId} onChange={handleChange} />
          </label>
          <label>
            Payslip Status
            <input name="payslipStatus" value={filters.payslipStatus} onChange={handleChange} />
          </label>
          <label>
            Start Date
            <input type="date" name="startDate" value={filters.startDate} onChange={handleChange} />
          </label>
          <label>
            End Date
            <input type="date" name="endDate" value={filters.endDate} onChange={handleChange} />
          </label>
        </div>
        <button className="btn primary" onClick={runReport} disabled={loading}>
          {loading ? 'Running...' : 'Run Report'}
        </button>
        {error && <div className="error">{error}</div>}
      </Card>

      {result && (
        <>
          <Card title="Summary">
            <div className="grid cols-3">
              <div className="card">
                <div className="muted">Total Employees</div>
                <div>{result.summary?.totalEmployees ?? 0}</div>
              </div>
              <div className="card">
                <div className="muted">Total Net Salary</div>
                <div>{result.summary?.totalNetSalary ?? 0}</div>
              </div>
              <div className="card">
                <div className="muted">Total Deductions</div>
                <div>{result.summary?.totalDeductions ?? 0}</div>
              </div>
            </div>
          </Card>
          {result.payslips && (
            <Card title="Payslip Results">
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Employee</th>
                    <th>Department</th>
                    <th>Net Salary</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {result.payslips.map((p) => (
                    <tr key={p.payslipId}>
                      <td>{p.payslipId}</td>
                      <td>{p.fullName}</td>
                      <td>{p.department || '-'}</td>
                      <td>{p.netSalary}</td>
                      <td>{p.status}</td>
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
                      <td>{a.amount}</td>
                      <td>{a.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </>
      )}
    </Layout>
  );
};

export default Reports;
