import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import Card from '../../components/Card';
import api from '../../api/api';
import { getActivities } from '../../utils/localActivity';

const HrNotifications = () => {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const formatDate = (value) => {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const load = async () => {
    setError('');
    setLoading(true);
    try {
      const [payPeriods, advances] = await Promise.all([
        api.get('/hr/payperiods'),
        api.get('/hr/advance/pending')
      ]);

      const recent = [];
      (advances || []).forEach((a) => {
        recent.push({
          createdAt: a.requestDate,
          message: `Advance request from ${a.fullName || 'Employee'} for $${a.amount}`,
          meta: `Status: ${a.status || 'PENDING'}`
        });
      });

      (payPeriods || []).forEach((p) => {
        recent.push({
          createdAt: p.startDate,
          message: `Pay period ${p.periodId} is ${p.status || 'OPEN'}.`,
          meta: `Dates: ${formatDate(p.startDate)} - ${formatDate(p.endDate)}`
        });
      });

      const localActivity = (getActivities() || []).map((item) => ({
        createdAt: item.createdAt,
        message: item.message,
        meta: 'Generated locally'
      }));

      const merged = [...localActivity, ...recent]
        .filter((a) => a.createdAt || a.message)
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

      setItems(merged);
    } catch (err) {
      setError(err.message || 'Failed to load activity');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <Layout>
      <div className="reports-builder">
        <Card
          title="Recent Activity"
          actions={
            <button className="btn secondary" onClick={load} disabled={loading}>
              {loading ? 'Refreshing…' : 'Refresh'}
            </button>
          }
        >
          {error && <div className="error">{error}</div>}
          {loading ? (
            <div className="muted">Loading activity…</div>
          ) : items.length ? ( 
            <div className="hr-activity-list scrollable"> 
              {items.map((item, idx) => (
                <div key={idx} className="activity-item">
                  <div className="activity-meta">{formatDate(item.createdAt)}</div>
                  <div className="activity-text strong">{item.message}</div>
                  {item.meta && <div className="muted small">{item.meta}</div>}
                </div>
              ))}
            </div>
          ) : (
            <div className="muted">No recent activity.</div>
          )}
        </Card>
      </div>
    </Layout>
  );
};

export default HrNotifications;
