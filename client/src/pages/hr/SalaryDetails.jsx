import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import Card from '../../components/Card';
import api from '../../api/api';

const SalaryDetails = () => {
  const [employees, setEmployees] = useState([]);
  const [selected, setSelected] = useState(null);
  const [details, setDetails] = useState({});
  const [error, setError] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [netSalary, setNetSalary] = useState(null);

  const loadEmployees = async () => {
    try {
      const data = await api.get('/hr/employees');
      setEmployees(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const loadDetails = async (employeeId) => {
    setError('');
    setStatusMsg('');
    setNetSalary(null);
    try {
      const data = await api.get(`/hr/salary/${employeeId}`);
      setDetails(data);
    } catch (err) {
      if (err.message.includes('not found')) {
        setDetails({});
      } else {
        setError(err.message);
      }
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const handleSelect = (emp) => {
    setSelected(emp);
    loadDetails(emp.id);
  };

  const handleCalculate = async () => {
    if (!selected) return;
    const body = {
      basicPay: Number(details.basicPay || 0),
      housingAllowance: Number(details.housingAllowance || 0),
      transportAllowance: Number(details.transportAllowance || 0),
      taxDeductionRate: Number(details.taxDeductionRate || 0),
      insuranceDeductionRate: Number(details.insuranceDeductionRate || 0)
    };
    try {
      if (details && details.employeeId) {
        await api.put(`/hr/salary/${selected.id}`, body);
        setStatusMsg('Calculated & updated salary details');
      } else {
        await api.post(`/hr/salary/${selected.id}`, body);
        setStatusMsg('Calculated & created salary details');
      }
      loadDetails(selected.id);
      const grossPay = body.basicPay + body.housingAllowance + body.transportAllowance;
      const deductions = grossPay * (body.taxDeductionRate / 100) + grossPay * (body.insuranceDeductionRate / 100);
      setNetSalary(grossPay - deductions);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Layout>
      <div className="salary-layout">
        <Card title="Employees" className="employee-list-card">
          <div className="employee-list">
            {employees.map((emp) => (
              <button
                key={emp.id}
                className={`employee-chip ${selected?.id === emp.id ? 'active' : ''}`}
                onClick={() => handleSelect(emp)}
              >
                {emp.fullName}
              </button>
            ))}
          </div>
        </Card>
        <Card title="Salary Details" className="salary-card">
          {selected ? (
            <>
              <div className="muted">For: {selected.fullName}</div>
              <div className="salary-grid">
                <label>
                  Basic Pay
                  <input
                    type="number"
                    value={details?.basicPay ?? ''}
                    onChange={(e) => setDetails({ ...details, basicPay: e.target.value })}
                    placeholder="0"
                  />
                </label>
                <label>
                  Housing Allowance
                  <input
                    type="number"
                    value={details?.housingAllowance ?? ''}
                    onChange={(e) => setDetails({ ...details, housingAllowance: e.target.value })}
                    placeholder="0"
                  />
                </label>
                <label>
                  Transport Allowance
                  <input
                    type="number"
                    value={details?.transportAllowance ?? ''}
                    onChange={(e) => setDetails({ ...details, transportAllowance: e.target.value })}
                    placeholder="0"
                  />
                </label>
                <label>
                  Tax Deduction Rate (%)
                  <input
                    type="number"
                    value={details?.taxDeductionRate ?? ''}
                    onChange={(e) => setDetails({ ...details, taxDeductionRate: e.target.value })}
                    placeholder="0"
                  />
                </label>
                <label>
                  Insurance Deduction Rate (%)
                  <input
                    type="number"
                    value={details?.insuranceDeductionRate ?? ''}
                    onChange={(e) => setDetails({ ...details, insuranceDeductionRate: e.target.value })}
                    placeholder="0"
                  />
                </label>
              </div>
              {netSalary !== null && (
                <div className="net-salary">Net Salary: <strong>${netSalary.toFixed(2)}</strong></div>
              )}
              {error && <div className="error">{error}</div>}
              {statusMsg && <div className="success">{statusMsg}</div>}
              <button className="btn primary full salary-action" onClick={handleCalculate}>Calculate</button>
            </>
          ) : (
            <div className="muted">Select an employee</div>
          )}
        </Card>
      </div>
    </Layout>
  );
};

export default SalaryDetails;
