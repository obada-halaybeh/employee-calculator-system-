import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import Card from '../../components/Card';
import api from '../../api/api';

const EmployeePayslips = () => {
  const [payslips, setPayslips] = useState([]);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');

  const loadPayslips = async () => {
    setError('');
    try {
      const data = await api.get('/employee/payslips');
      setPayslips(data);
      if (data[0]) setSelected(data[0]);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadPayslips();
  }, []);

  return (
    <Layout>
      <div className="grid cols-2">
        <Card title="Payslips">
          {error && <div className="error">{error}</div>}
          <div className="grid" style={{ maxHeight: 400, overflow: 'auto' }}>
            {payslips.map((p) => (
              <button
                key={p.payslipId}
                className={`btn secondary full ${selected?.payslipId === p.payslipId ? 'active' : ''}`}
                onClick={() => setSelected(p)}
              >
                #{p.payslipId} — {p.netSalary} ({p.status})
              </button>
            ))}
          </div>
        </Card>
        <Card title="Details">
          {selected ? (
            <div className="grid">
              <div>Period: {selected.startDate} - {selected.endDate}</div>
              <div>Gross Pay: {selected.grossPay}</div>
              <div>Total Allowances: {selected.totalAllowances}</div>
              <div>Total Deductions: {selected.totalDeductions}</div>
              <div>Net Salary: {selected.netSalary}</div>
              <div>Status: {selected.status}</div>
            </div>
          ) : (
            <div className="muted">Select a payslip</div>
          )}
        </Card>
      </div>
    </Layout>
  );
};

export default EmployeePayslips;
