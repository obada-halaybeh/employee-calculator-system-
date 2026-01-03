import React, { useCallback, useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import Card from '../../components/Card';
import api from '../../api/api';
import { syncEmployeeNotifications } from '../../utils/employeeNotifications';

const EmployeeHome = () => {
  const [payslips, setPayslips] = useState([]);
  const [advances, setAdvances] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState('');
  const [updatedAt, setUpdatedAt] = useState(null);

  const load = useCallback(async () => {
    setError('');
    try {
      const [slips, adv] = await Promise.all([
        api.get('/employee/payslips'),
        api.get('/employee/advance')
      ]);
      const sortedAdv = (adv || []).slice().sort((a, b) => new Date(b.requestDate) - new Date(a.requestDate));
      setPayslips(slips || []);
      setAdvances(sortedAdv);
      setNotifications(syncEmployeeNotifications(slips || [], sortedAdv));
      setUpdatedAt(new Date());
    } catch (err) {
      setError(err.message || 'Failed to load dashboard');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const interval = setInterval(() => {
      load();
    }, 15000);
    return () => clearInterval(interval);
  }, [load]);

  useEffect(() => {
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [load]);

  const recentPayslips = (payslips || []).slice(0, 10);
  const recentAdvances = (advances || []).slice(0, 10);
  const topNotifications = (notifications || []).slice(0, 10);

  return (
    <Layout>
      <div className="grid cols-3" style={{ gap: '16px' }}>
        <Card
          title="Notifications"
          actions={
            updatedAt ? <span className="muted small">Updated {formatDateTime(updatedAt)}</span> : null
          }
        >
          {topNotifications.length ? (
            <div className="stacked" style={{ gap: '10px' }}>
              {topNotifications.map((n) => (
                <div
                  key={n.id}
                  className="activity-item"
                  style={{
                    padding: '10px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '10px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                  }}
                >
                  <div className="activity-meta">{formatDateTime(n.createdAt)}</div>
                  <div className="activity-text strong" style={{ fontSize: '14px' }}>{n.message}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="muted">No notifications yet.</div>
          )}
        </Card>

        <Card title="Advance Requests">
          {recentAdvances.length ? (
            <div className="stacked" style={{ gap: '12px' }}>
              {recentAdvances.map((adv) => (
                <div key={adv.requestId} style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '10px' }}>
                  <div className="flex space-between" style={{ alignItems: 'center', marginBottom: '4px' }}>
                    <div className="strong">Request #{adv.requestId}</div>
                    <span className="pill neutral" style={statusStyle(adv.status)}>
                      {adv.status}
                    </span>
                  </div>
                  <div className="muted small">Amount: {adv.amount}</div>
                  <div className="muted small">Date: {formatDateTime(adv.requestDate)}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="muted">No advance requests.</div>
          )}
        </Card>
      </div>
    </Layout>
  );
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

const formatDateTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
};

const formatDateRange = (start, end) => {
  const s = formatDate(start);
  const e = formatDate(end);
  if (!s && !e) return '';
  if (s && e) return `${s} — ${e}`;
  return s || e;
};

const statusStyle = (status = '') => {
  const upper = String(status).toUpperCase();
  const base = {
    padding: '4px 8px',
    borderRadius: '999px',
    fontWeight: 600,
    fontSize: '12px'
  };
  if (upper === 'APPROVED') return { ...base, background: '#dcfce7', color: '#166534' };
  if (upper === 'REJECTED') return { ...base, background: '#fee2e2', color: '#b91c1c' };
  return { ...base, background: '#e5e7eb', color: '#374151' };
};

export default EmployeeHome;
