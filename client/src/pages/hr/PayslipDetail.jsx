import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../../components/Layout';
import Card from '../../components/Card';
import api from '../../api/api';

const PayslipDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [payslip, setPayslip] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setError('');
      setLoading(true);
      try {
        const data = await api.get(`/hr/payslips/${id}`);
        setPayslip(data);
      } catch (err) {
        setError(err.message || 'Failed to load payslip');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <Layout>
        <div className="muted">Loading payslip...</div>
      </Layout>
    );
  }

  if (error || !payslip) {
    return (
      <Layout>
        <div className="error">{error || 'Payslip not found'}</div>
        <button className="btn secondary" onClick={() => navigate(-1)}>Back</button>
      </Layout>
    );
  }

  const earnings = [
    { label: 'Gross Pay', value: payslip.grossPay },
    { label: 'Allowances', value: payslip.totalAllowances }
  ];

  const deductions = [
    { label: 'Deductions', value: payslip.totalDeductions }
  ];

  const safeNumber = (val) => Number(val || 0);
  const totalEarnings = safeNumber(payslip.grossPay) + safeNumber(payslip.totalAllowances);
  const totalDeductions = safeNumber(payslip.totalDeductions);
  const netPay = safeNumber(payslip.netSalary);

  const formatDate = (value) => {
    if (!value) return '—';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString();
  };

  return (
    <Layout>
      <div className="payslip-detail">
        <Card title="Payslip" actions={(
          <div className="detail-actions">
            <button className="btn ghost" onClick={() => window.print()}>Download</button>
            <button className="btn secondary" onClick={() => navigate(-1)}>Back</button>
          </div>
        )}>
          <div className="payslip-hero">
            <div className="payslip-hero-left">
              <div className="payslip-avatar large">{payslip.fullName?.[0] || 'E'}</div>
              <div>
                <div className="payslip-name">{payslip.fullName}</div>
                <div className="payslip-meta muted">
                  Dept: {payslip.department || '—'} · Employee ID: {payslip.employeeId}
                </div>
              </div>
            </div>
            <div className="payslip-hero-right">
              <div className="muted small">Generated: {formatDate(payslip.generationDate)}</div>
            </div>
          </div>

          <div className="payslip-summary">
            <SummaryItem label="Total Earnings" value={totalEarnings} />
            <SummaryItem label="Total Deductions" value={totalDeductions} />
            <SummaryItem label="Net Pay" value={netPay} />
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
                <strong>${totalEarnings.toFixed(2)}</strong>
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
                <strong>${totalDeductions.toFixed(2)}</strong>
              </div>
              <div className="line-total">
                <span>Net Pay</span>
                <strong>${netPay.toFixed(2)}</strong>
              </div>
            </Card>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

const SummaryItem = ({ label, value, isCurrency = true }) => (
  <div className="summary-item">
    <div className="muted small">{label}</div>
    <div className="summary-value">
      {isCurrency ? `$${Number(value || 0).toFixed(2)}` : value}
    </div>
  </div>
);

const LineItem = ({ label, value }) => (
  <div className="line-item">
    <span>{label}</span>
    <span>${Number(value || 0).toFixed(2)}</span>
  </div>
);

export default PayslipDetail;
