import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import Card from '../../components/Card';
import { getEmployeeNotifications, clearEmployeeNotifications } from '../../utils/employeeNotifications';

const EmployeeNotifications = () => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    setItems(getEmployeeNotifications());
  }, []);

  return (
    <Layout>
      <Card
        title="Notifications"
        actions={
          <button className="btn ghost" onClick={() => { clearEmployeeNotifications(); setItems([]); }}>
            Clear
          </button>
        }
      >
        {items.length === 0 && <div className="muted">No notifications yet.</div>}
        {items.length > 0 && (
          <div className="activity-list">
            {items.map((n) => (
              <div key={n.id} className="activity-item">
                <div className="activity-meta">{formatDate(n.createdAt)}</div>
                <div className="activity-text">{n.message}</div>
              </div>
            ))}
          </div>
        )}
      </Card>
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
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
};

export default EmployeeNotifications;
