import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import Card from '../../components/Card';
import api from '../../api/api';

const SalaryDetails = () => {
  const [employees, setEmployees] = useState([]);
  const [salaryRows, setSalaryRows] = useState([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [showOverview, setShowOverview] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [selected, setSelected] = useState(null);
  const [details, setDetails] = useState({});
  const [error, setError] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [netSalary, setNetSalary] = useState(null);

  const normalizeSalary = (data = {}) => {
    const safe = data || {};
    return {
      basicPay: Number(safe.basicPay || 0),
      housingAllowance: Number(safe.housingAllowance || 0),
      transportAllowance: Number(safe.transportAllowance || 0),
      taxDeductionRate: Number(safe.taxDeductionRate || 0),
      insuranceDeductionRate: Number(safe.insuranceDeductionRate || 0)
    };
  };

  const buildRow = (emp, salaryData) => {
    const normalized = normalizeSalary(salaryData);
    const gross = normalized.basicPay + normalized.housingAllowance + normalized.transportAllowance;
    const deductions =
      gross * (normalized.taxDeductionRate / 100) + gross * (normalized.insuranceDeductionRate / 100);
    const additions = normalized.housingAllowance + normalized.transportAllowance;
    const net = gross - deductions;

    return {
      employeeId: emp.id,
      name: emp.fullName,
      department: emp.department,
      isActive: emp.isActive,
      hasDetails: Boolean(salaryData && salaryData.employeeId),
      ...normalized,
      gross,
      additions,
      deductions,
      net
    };
  };

  const loadEmployees = async () => {
    try {
      const data = await api.get('/hr/employees');
      setEmployees(data);
      await loadSalaryTable(data);
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

  const loadSalaryTable = async (list = employees) => {
    if (!list?.length) return;
    setTableLoading(true);
    setError('');
    try {
      const rows = await Promise.all(
        list.map(async (emp) => {
          try {
            const salaryData = await api.get(`/hr/salary/${emp.id}`);
            return buildRow(emp, salaryData);
          } catch (err) {
            if (err.message?.includes('not found')) {
              return buildRow(emp, null);
            }
            throw err;
          }
        })
      );
      setSalaryRows(rows);
    } catch (err) {
      setError(err.message || 'Failed to load salary overview');
    } finally {
      setTableLoading(false);
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
      await Promise.all([loadDetails(selected.id), loadSalaryTable()]);
      const grossPay = body.basicPay + body.housingAllowance + body.transportAllowance;
      const deductions = grossPay * (body.taxDeductionRate / 100) + grossPay * (body.insuranceDeductionRate / 100);
      setNetSalary(grossPay - deductions);
    } catch (err) {
      setError(err.message);
    }
  };

  const filteredRows = salaryRows.filter((row) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;
    return (
      row.name?.toLowerCase().includes(term) ||
      String(row.employeeId).includes(term) ||
      (row.department || '').toLowerCase().includes(term)
    );
  }).filter((row) => {
    if (filterStatus === 'all') return true;
    const isActive = Boolean(row.isActive);
    return filterStatus === 'active' ? isActive : !isActive;
  });

  const totals = filteredRows.reduce(
    (acc, row) => {
      acc.employees += 1;
      acc.basic += row.basicPay || 0;
      acc.additions += row.additions || 0;
      acc.deductions += row.deductions || 0;
      acc.net += row.net || 0;
      return acc;
    },
    { employees: 0, basic: 0, additions: 0, deductions: 0, net: 0 }
  );

  const activeCount = employees.filter((e) => e.isActive).length;
  const inactiveCount = employees.length - activeCount;

  const handleDownload = () => {
    if (!filteredRows.length) return;
    const header = [
      'Employee ID',
      'Name',
      'Department',
      'Basic salary',
      'Allowances',
      'Total salary',
      'Total deductions',
      'Net',
      'Status'
    ];
    const lines = filteredRows.map((row) => [
      row.employeeId,
      row.name || '',
      row.department || '',
      row.basicPay.toFixed(2),
      row.additions.toFixed(2),
      row.gross.toFixed(2),
      row.deductions.toFixed(2),
      row.net.toFixed(2),
      row.isActive ? 'Active' : 'Inactive'
    ]);
    const csv = [header, ...lines].map((line) => line.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'salary_overview.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Layout>
      <div className="salary-page">
        <div className="salary-table-toggle">
          <button
            className="btn secondary"
            onClick={() => {
              if (!showOverview) loadSalaryTable();
              setShowOverview(!showOverview);
            }}
          >
            {showOverview ? 'Hide all salary details' : 'View all salary details'}
          </button>
        </div>

        {showOverview && (
          <Card title="Salary Overview" className="salary-table-card">
            <div className="salary-table-toolbar">
              <div className="salary-meta">
                <div className="muted">Employee salary details</div>
                <div className="salary-counts">
                  <span className="pill neutral">Active: {activeCount}</span>
                  <span className="pill neutral muted-text">Inactive: {inactiveCount}</span>
                </div>
              </div>
              <div className="salary-table-actions">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, ID, or department"
                  className="salary-search"
                />
                <select
                  className="salary-filter"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All employees</option>
                  <option value="active">Active only</option>
                  <option value="inactive">Inactive only</option>
                </select>
                <button className="btn secondary" onClick={handleDownload} disabled={!filteredRows.length}>
                  Download
                </button>
                <button className="btn secondary" onClick={() => loadSalaryTable()} disabled={tableLoading}>
                  {tableLoading ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
            </div>
            <div className="salary-table-wrapper">
              <table className="salary-table">
                <thead>
                  <tr>
                    <th>ID / Name</th>
                    <th>Department</th>
                    <th>Basic salary</th>
                    <th>Allowances</th>
                    <th>Total salary</th>
                    <th>Total deductions</th>
                    <th>Net</th>
                  </tr>
                </thead>
                <tbody>
                  {!tableLoading && filteredRows.length === 0 && (
                    <tr>
                      <td colSpan="7" className="muted center">No matching employees</td>
                    </tr>
                  )}
                  {tableLoading && (
                    <tr>
                      <td colSpan="7" className="muted center">Loading salary details...</td>
                    </tr>
                  )}
                  {!tableLoading && filteredRows.map((row) => (
                    <tr
                      key={row.employeeId}
                      className={selected?.id === row.employeeId ? 'selected' : ''}
                      onClick={() => {
                        const emp = employees.find((e) => e.id === row.employeeId);
                        if (emp) handleSelect(emp);
                      }}
                    >
                      <td>
                        <div className="stacked">
                          <span className="strong">{row.employeeId}</span>
                          <span className="muted">{row.name || 'Not set'}</span>
                        </div>
                      </td>
                      <td>{row.department || '—'}</td>
                      <td>${row.basicPay.toFixed(2)}</td>
                      <td>${row.additions.toFixed(2)}</td>
                      <td>${row.gross.toFixed(2)}</td>
                      <td>${row.deductions.toFixed(2)}</td>
                      <td>
                        <div className="stacked">
                          <span>${row.net.toFixed(2)}</span>
                          {!row.hasDetails && <span className="pill warning">Missing details</span>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td>{totals.employees} employees</td>
                    <td />
                    <td>${totals.basic.toFixed(2)}</td>
                    <td>${totals.additions.toFixed(2)}</td>
                    <td>${(totals.basic + totals.additions).toFixed(2)}</td>
                    <td>${totals.deductions.toFixed(2)}</td>
                    <td>${totals.net.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
        )}

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
      </div>
    </Layout>
  );
};

export default SalaryDetails;
