import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import Card from '../../components/Card';
import api from '../../api/api';

const AdvanceRequests = () => {
  const [pending, setPending] = useState([]);
  const [approved, setApproved] = useState([]);
  const [error, setError] = useState('');

  const loadData = async () => {
    setError('');
    try {
      const [pendingData, approvedData] = await Promise.all([
        api.get('/hr/advance/pending'),
        api.get('/hr/advance/approved')
      ]);
      setPending(pendingData || []);
      setApproved(approvedData || []);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const updateStatus = async (requestId, status) => {
    try {
      await api.patch(`/hr/advance/${requestId}`, { status });
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Layout>
      <Card title="Advance Requests">
        {error && <div className="error">{error}</div>}
        <div className="grid cols-2">
          <div>
            <h4>Pending</h4>
            {pending.length === 0 && <div className="muted">No pending requests</div>}
            {pending.map((r) => (
              <div key={r.requestId} className="card" style={{ marginBottom: 10 }}>
                <div className="flex-between">
                  <div>
                    <div>{r.fullName}</div>
                    <div className="muted">{r.department || '-'}</div>
                    <div>Amount: {r.amount}</div>
                    <div className="muted">{r.reason}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn primary" onClick={() => updateStatus(r.requestId, 'APPROVED')}>Approve</button>
                    <button className="btn secondary" onClick={() => updateStatus(r.requestId, 'REJECTED')}>Reject</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div>
            <h4>Approved</h4>
            {approved.length === 0 && <div className="muted">No approved requests</div>}
            {approved.map((r) => (
              <div key={r.requestId} className="card" style={{ marginBottom: 10 }}>
                <div className="flex-between">
                  <div>
                    <div>{r.fullName}</div>
                    <div className="muted">{r.department || '-'}</div>
                    <div>Amount: {r.amount}</div>
                    <div className="muted">{r.reason}</div>
                  </div>
                  <div className="pill neutral">APPROVED</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </Layout>
  );
};

export default AdvanceRequests;
