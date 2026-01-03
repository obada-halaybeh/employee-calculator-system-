import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../../components/Layout';
import Card from '../../components/Card';
import api from '../../api/api';

const PayrollDetail = () => {
  const { periodId } = useParams();
  const navigate = useNavigate();
  const [payslips, setPayslips] = useState([]);
  const [period, setPeriod] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    const load = async () => {
      setError('');
      setLoading(true);
      try {
        const [slips, periods] = await Promise.all([
          api.get(`/hr/payslips?periodId=${periodId}`),
          api.get('/hr/payperiods')
        ]);
        setPayslips(slips || []);
        const matched = (periods || []).find((p) => String(p.periodId) === String(periodId));
        setPeriod(matched || null);
      } catch (err) {
        setError(err.message || 'Failed to load payroll');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [periodId]);

  const totals = useMemo(() => {
    const summary = { employees: 0, totalEarnings: 0, totalDeductions: 0, netPay: 0 };
    for (const slip of payslips) {
      summary.employees += 1;
      summary.totalEarnings += Number(slip.grossPay || 0) + Number(slip.totalAllowances || 0);
      summary.totalDeductions += Number(slip.totalDeductions || 0);
      summary.netPay += Number(slip.netSalary || 0);
    }
    return summary;
  }, [payslips]);

  const formatDate = (value) => {
    if (!value) return '—';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString();
  };

  const formatAmount = (val) => Number(val || 0).toFixed(2);

  const closePeriod = async () => {
    if (!periodId) return;
    setClosing(true);
    setError('');
    try {
      await api.patch(`/hr/payperiods/${periodId}/status`, { status: 'CLOSED' });
      setPeriod((prev) => (prev ? { ...prev, status: 'CLOSED' } : prev));
    } catch (err) {
      setError(err.message || 'Failed to close period');
    } finally {
      setClosing(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="muted">Loading payroll...</div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="error">{error}</div>
        <button className="btn secondary" onClick={() => navigate(-1)}>Back</button>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="payroll-detail">
        <Card
          title="Payroll Summary"
          actions={(
            <div className="detail-actions">
              <button className="btn ghost" onClick={() => window.print()}>Download</button>
              <button className="btn secondary" onClick={() => navigate(-1)}>Back</button>
            </div>
          )}
        >
          <div className="payroll-hero">
            <div>
              <div className="payslip-name">Period #{periodId}</div>
              <div className="payslip-meta muted">
                {period ? `${formatDate(period.startDate)} - ${formatDate(period.endDate)} · ${period.status || '—'}` : 'Period info unavailable'}
              </div>
            </div>
            <div className="payroll-status-actions">
              <div className="pill neutral">Employees: {totals.employees}</div>
              {period?.status !== 'CLOSED' && (
                <button className="btn secondary" onClick={closePeriod} disabled={closing}>
                  {closing ? 'Closing...' : 'Close period'}
                </button>
              )}
            </div>
          </div>

          <div className="payslip-summary">
            <SummaryItem label="Total Earnings" value={totals.totalEarnings} />
            <SummaryItem label="Total Deductions" value={totals.totalDeductions} />
            <SummaryItem label="Net Pay" value={totals.netPay} />
            <SummaryItem label="Status" value={period?.status || '—'} hideCurrency />
          </div>

          <div className="payroll-panels">
            <Card title="Earnings" className="mini-card">
              <div className="payslip-lines">
                {payslips.map((p) => (
                  <LineItem
                    key={p.payslipId}
                    label={`${p.fullName || 'Employee'} (ID ${p.employeeId})`}
                    value={Number(p.grossPay || 0) + Number(p.totalAllowances || 0)}
                  />
                ))}
              </div>
              <div className="line-total">
                <span>Total Earnings</span>
                <strong>${formatAmount(totals.totalEarnings)}</strong>
              </div>
            </Card>

            <Card title="Deductions" className="mini-card">
              <div className="payslip-lines">
                {payslips.map((p) => (
                  <LineItem
                    key={p.payslipId}
                    label={`${p.fullName || 'Employee'} (ID ${p.employeeId})`}
                    value={p.totalDeductions}
                  />
                ))}
              </div>
              <div className="line-total">
                <span>Total Deductions</span>
                <strong>${formatAmount(totals.totalDeductions)}</strong>
              </div>
              <div className="line-total">
                <span>Net Pay</span>
                <strong>${formatAmount(totals.netPay)}</strong>
              </div>
            </Card>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

const SummaryItem = ({ label, value, hideCurrency }) => (
  <div className="summary-item">
    <div className="muted small">{label}</div>
    <div className="summary-value">
      {hideCurrency ? value : `$${Number(value || 0).toFixed(2)}`}
    </div>
  </div>
);

const LineItem = ({ label, value }) => (
  <div className="line-item">
    <span>{label}</span>
    <span>${Number(value || 0).toFixed(2)}</span>
  </div>
);

export default PayrollDetail;
