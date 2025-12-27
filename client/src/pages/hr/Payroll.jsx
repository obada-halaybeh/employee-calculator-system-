import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import Card from '../../components/Card';
import api from '../../api/api';

const Payroll = () => {
  const [periods, setPeriods] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [employeeId, setEmployeeId] = useState('');

  const loadPeriods = async () => {
    try {
      const data = await api.get('/hr/payperiods');
      setPeriods(data);
      if (data[0]) setSelectedPeriod(data[0].periodId);
    } catch (err) {
      setError(err.message);
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

  useEffect(() => {
    loadPeriods();
  }, []);

  useEffect(() => {
    if (selectedPeriod) loadPayslips(selectedPeriod);
  }, [selectedPeriod]);

  const handleGenerate = async () => {
    setMessage('');
    setError('');
    if (!employeeId || !selectedPeriod) {
      setError('Employee ID and Period are required');
      return;
    }
    setLoading(true);
    try {
      await api.post('/hr/payslips/generate', { employeeId: Number(employeeId), periodId: Number(selectedPeriod) });
      setMessage('Payslip generated');
      loadPayslips(selectedPeriod);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Card title="Payroll">
        <div className="form-grid">
          <label>
            Pay Period
            <select value={selectedPeriod} onChange={(e) => setSelectedPeriod(e.target.value)}>
              <option value="">Select period</option>
              {periods.map((p) => (
                <option key={p.periodId} value={p.periodId}>
                  {p.startDate} to {p.endDate} ({p.status})
                </option>
              ))}
            </select>
          </label>
          <label>
            Employee ID
            <input value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} />
          </label>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
            <button className="btn primary" onClick={handleGenerate} disabled={loading}>
              {loading ? 'Generating...' : 'Generate Payslip'}
            </button>
          </div>
        </div>
        {error && <div className="error">{error}</div>}
        {message && <div className="success">{message}</div>}
      </Card>

      <Card title="Payslips">
        {loading ? (
          <div>Loading...</div>
        ) : (
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
              {payslips.map((p) => (
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
        )}
      </Card>
    </Layout>
  );
};

export default Payroll;
