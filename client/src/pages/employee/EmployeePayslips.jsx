import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import Card from '../../components/Card';
import api from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { syncEmployeeNotifications } from '../../utils/employeeNotifications';

const EmployeePayslips = () => {
  const { user } = useAuth();
  const [payslips, setPayslips] = useState([]);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const loadPayslips = async () => {
    setError('');
    setLoading(true);
    try {
      const data = await api.get('/employee/payslips');
      const sorted = (data || []).slice().sort((a, b) => new Date(b.generationDate) - new Date(a.generationDate));
      setPayslips(sorted);
      setSelected(sorted[0] || null);
      syncEmployeeNotifications(sorted, []);
    } catch (err) {
      setError(err.message || 'Failed to load payslips');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayslips();
  }, []);

  const handleDownloadCsv = () => {
    if (!selected) return;
    setDownloading(true);
    const csv = buildPayslipCsv({
      slip: selected,
      employeeName: user?.fullName || user?.username || 'Employee',
      employeeId: user?.id,
      department: user?.department
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `payslip-${selected.payslipId || 'latest'}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setTimeout(() => setDownloading(false), 150);
  };

  const selectedSlip = selected;
  const earnings = selectedSlip
    ? [
        { label: 'Gross Pay', value: selectedSlip.grossPay },
        { label: 'Allowances', value: selectedSlip.totalAllowances }
      ]
    : [];
  const deductions = selectedSlip ? [{ label: 'Deductions', value: selectedSlip.totalDeductions }] : [];
  const totals = getTotals(selectedSlip);

  return (
    <Layout>
      <div className="employee-payslips-page">
        <Card
          title="Payslip"
          actions={
            <div className="detail-actions">
              <button className="btn primary" onClick={handleDownloadCsv} disabled={!selectedSlip || downloading}>
                {downloading ? 'Preparing…' : 'Download CSV'}
              </button>
            </div>
          }
        >
          {error && <div className="error">{error}</div>}
          {loading ? (
            <div className="muted">Loading payslips…</div>
          ) : selectedSlip ? (
            <div className="payslip-detail">
              <div className="payslip-summary">
                <SummaryItem label="Total Earnings" value={totals.totalEarnings} />
                <SummaryItem label="Total Deductions" value={totals.totalDeductions} />
                <SummaryItem label="Net Pay" value={totals.netPay} />
                <SummaryItem label="Currency" value="Jordanian Dinars (JOD)" isCurrency={false} />
              </div>

              <div className="payslip-panels">
                <Card title="Earnings" className="mini-card">
                  <div className="payslip-lines">
                    {earnings.map((item) => (
                      <LineItem key={item.label} label={item.label} value={item.value} />
                    ))}
                  </div>
                  <div className="line-total">
                    <span>Total Earnings</span>
                    <strong>${totals.totalEarnings.toFixed(2)}</strong>
                  </div>
                </Card>

                <Card title="Deductions" className="mini-card">
                  <div className="payslip-lines">
                    {deductions.map((item) => (
                      <LineItem key={item.label} label={item.label} value={item.value} />
                    ))}
                  </div>
                  <div className="line-total">
                    <span>Total Deductions</span>
                    <strong>${totals.totalDeductions.toFixed(2)}</strong>
                  </div>
                  <div className="line-total">
                    <span>Net Pay</span>
                    <strong>${totals.netPay.toFixed(2)}</strong>
                  </div>
                </Card>
              </div>
            </div>
          ) : (
            <div className="muted">No payslips available yet.</div>
          )}
        </Card>

        <Card title="Old slips">
          <div className="payslip-archive-header" style={{ padding: 0 }}>
            <div className="muted small">Select any slip to view its details above.</div>
            <div className="muted small">{payslips.length} total</div>
          </div>
          {payslips.length ? (
            <div className="payslip-archive-grid">
              {payslips.map((slip) => (
                <button
                  key={slip.payslipId}
                  className={`payslip-archive-card ${selectedSlip?.payslipId === slip.payslipId ? 'active' : ''}`}
                  onClick={() => setSelected(slip)}
                >
                  <div className="archive-id">#{slip.payslipId}</div>
                  <div className="archive-period">{formatDateRange(slip.startDate, slip.endDate)}</div>
                  <div className="archive-net">Net {formatCurrency(slip.netSalary)}</div>
                  <div className="archive-date">Generated {formatDateTime(slip.generationDate)}</div>
                </button>
              ))}
            </div>
          ) : (
            <div className="muted">No past slips yet.</div>
          )}
        </Card>
      </div>
    </Layout>
  );
};

const SummaryItem = ({ label, value, isCurrency = true }) => (
  <div className="summary-item">
    <div className="muted small">{label}</div>
    <div className="summary-value">{isCurrency ? `$${Number(value || 0).toFixed(2)}` : value}</div>
  </div>
);

const LineItem = ({ label, value }) => (
  <div className="line-item">
    <span>{label}</span>
    <span>${Number(value || 0).toFixed(2)}</span>
  </div>
);

const formatDateRange = (start, end) => {
  const s = formatDate(start);
  const e = formatDate(end);
  if (s && e) return `${s} – ${e}`;
  return s || e || '';
};

const formatDateTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
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

const safeNumber = (value) => {
  const num = Number(value);
  return Number.isNaN(num) ? 0 : num;
};

const formatCurrency = (value) => {
  const num = safeNumber(value);
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(num);
};

const getTotals = (slip) => {
  if (!slip) return { totalEarnings: 0, totalDeductions: 0, netPay: 0 };
  const totalEarnings = safeNumber(slip.grossPay) + safeNumber(slip.totalAllowances);
  const totalDeductions = safeNumber(slip.totalDeductions);
  const netPay = safeNumber(slip.netSalary);
  return { totalEarnings, totalDeductions, netPay };
};

const buildPayslipCsv = ({ slip, employeeName, employeeId, department }) => {
  const headers = [
    'Payslip ID',
    'Employee ID',
    'Employee Name',
    'Department',
    'Period Start',
    'Period End',
    'Gross Pay',
    'Allowances',
    'Deductions',
    'Net Salary',
    'Generated'
  ];
  const row = [
    slip.payslipId,
    employeeId || '',
    `"${(employeeName || '').replace(/"/g, '""')}"`,
    `"${(department || '').replace(/"/g, '""')}"`,
    slip.startDate || '',
    slip.endDate || '',
    safeNumber(slip.grossPay).toFixed(2),
    safeNumber(slip.totalAllowances).toFixed(2),
    safeNumber(slip.totalDeductions).toFixed(2),
    safeNumber(slip.netSalary).toFixed(2),
    slip.generationDate || ''
  ];
  return `${headers.join(',')}\n${row.join(',')}`;
};

export default EmployeePayslips;
