import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../api/api';
import { getActivities } from '../../utils/localActivity';

const icons = {
  people: (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path d="M24 22c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7Z" />
      <path d="M32 26c3.866 0 7-3.134 7-7s-3.134-7-7-7" />
      <path d="M14 26c-3.866 0-7-3.134-7-7s3.134-7 7-7" />
      <path d="M33 32.5c0-3.59-4.03-6.5-9-6.5s-9 2.91-9 6.5V35" />
      <path d="M42 35c0-4.418-4.477-8-10-8" />
      <path d="M16 27c-5.523 0-10 3.582-10 8" />
    </svg>
  ),
  money: (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path d="M10 16c0-2.21 1.79-4 4-4h20c2.21 0 4 1.79 4 4v16c0 2.21-1.79 4-4 4H14c-2.21 0-4-1.79-4-4V16Z" />
      <path d="M18 21h8.5a3.5 3.5 0 0 1 0 7H18" />
      <path d="M18 18v17" />
    </svg>
  ),
  trend: (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path d="M10 34V12" />
      <path d="M18 28l6-12 6 12 8-18" />
    </svg>
  ),
};

const HrHome = () => {
  const [stats, setStats] = useState({
    employees: 0,
    payrollPending: 0,
    advanceRequests: 0,
  });
  const [activity, setActivity] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setError('');
      setLoading(true);
      try {
        const [employees, payPeriods, advances] = await Promise.all([
          api.get('/hr/employees'),
          api.get('/hr/payperiods'),
          api.get('/hr/advance/pending'),
        ]);

        const payrollPending = (payPeriods || []).filter((p) => p.status !== 'CLOSED').length;
        setStats({
          employees: employees?.length || 0,
          payrollPending,
          advanceRequests: advances?.length || 0,
        });

        const recent = [];
        (advances || []).slice(0, 5).forEach((a) => {
          const createdAt = a.requestDate;
          recent.push({
            time: formatDate(createdAt),
            text: `Advance request from ${a.fullName || 'Employee'} for $${a.amount}`,
            createdAt
          });
        });
        (payPeriods || []).slice(0, 3).forEach((p) => {
          const createdAt = p.startDate;
          recent.push({
            time: formatDate(createdAt),
            text: `Pay period ${p.periodId} is ${p.status || 'OPEN'}.`,
            createdAt
          });
        });

        // Merge locally stored activity (e.g., report generation notifications)
        const localActivity = (getActivities() || []).map((item) => ({
          time: formatDate(item.createdAt),
          text: item.message,
          createdAt: item.createdAt
        }));

        const merged = [...localActivity, ...recent]
          .sort((a, b) => toTimestamp(b.createdAt) - toTimestamp(a.createdAt));
        if (merged.length === 0) {
          merged.push({ time: '', text: 'No recent activity yet.' });
        }
        setActivity(merged);
      } catch (err) {
        setError(err.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <Layout>
      <section className="hr-stats">
        {[
          { label: 'Total Employees', value: stats.employees, icon: icons.people },
          { label: 'Payroll Pending', value: stats.payrollPending, icon: icons.money },
          { label: 'Advance Requests', value: stats.advanceRequests, icon: icons.trend },
        ].map((item) => (
          <div key={item.label} className="stat-card">
            <div className="stat-text">
              <span className="stat-label">{item.label}</span>
              <span className="stat-value">{loading ? '—' : item.value}</span>
            </div>
            <div className="stat-icon">{item.icon}</div>
          </div>
        ))}
      </section>

      <section className="hr-activity">
        <div className="hr-activity-header">Recent Activity</div>
        {error && <div className="error">{error}</div>}
        {!error && (
          <div className="hr-activity-list scrollable">
            {activity.map((item, idx) => (
              <div key={idx} className="activity-item">
                <div className="activity-meta">{item.time}</div>
                <div className="activity-text">{item.text}</div>
              </div>
            ))}
          </div>
        )}
      </section>
    </Layout>
  );
};

const formatDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
};

const toTimestamp = (value) => {
  const date = value ? new Date(value) : null;
  const time = date?.getTime();
  return Number.isNaN(time) ? 0 : time;
};

export default HrHome;
