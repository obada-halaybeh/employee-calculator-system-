import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import Card from '../../components/Card';
import api from '../../api/api';
import { syncEmployeeNotifications } from '../../utils/employeeNotifications';

const EmployeeAdvance = () => {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [halfSalary, setHalfSalary] = useState(null);

  const loadRequests = async () => {
    setError('');
    try {
      const data = await api.get('/employee/advance');
      const sorted = (data || []).slice().sort((a, b) => new Date(b.requestDate) - new Date(a.requestDate));
      setRequests(sorted);
      syncEmployeeNotifications([], data || []);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadRequests();
    loadHalfSalary();
  }, []);

  const loadHalfSalary = async () => {
    try {
      const payslips = await api.get('/employee/payslips');
      if (Array.isArray(payslips) && payslips.length) {
        const latest = payslips[0];
        const net = Number(latest?.netSalary);
        if (!Number.isNaN(net) && net > 0) {
          setHalfSalary(net / 2);
        }
      }
    } catch {
      // Keep silent; validation will still block invalid amounts.
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    const numericAmount = Number(amount);
    if (Number.isNaN(numericAmount)) {
      setError('Enter a valid amount.');
      return;
    }
    if (numericAmount <= 0) {
      setError('Amount must be greater than zero.');
      return;
    }
    if (halfSalary !== null && numericAmount > halfSalary) {
      setError(`Amount cannot exceed half of your salary (${halfSalary.toFixed(2)}).`);
      return;
    }
    setLoading(true);
    try {
      await api.post('/employee/advance', { amount: Number(amount), reason });
      setMessage('Request submitted');
      setAmount('');
      setReason('');
      loadRequests();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const pendingRequests = (requests || []).filter((r) => String(r.status).toUpperCase() === 'PENDING');

  const cancelLatestPending = async (requestId) => {
    if (!requestId) return;
    setError('');
    setMessage('');
    setCanceling(true);
    try {
      await api.delete(`/employee/advance/${requestId}`);
      setMessage('Request cancelled');
      loadRequests();
    } catch (err) {
      setError(err.message);
    } finally {
      setCanceling(false);
    }
  };

  return (
    <Layout>
      <div className="employee-advance-page">
        <div className="advance-panels">
          <Card title="Create Request" className="advance-card">
            <form className="advance-form" onSubmit={submit}>
              <label>
                Amount
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  placeholder="Enter amount"
                  min="0"
                  step="0.01"
                  max={halfSalary !== null ? halfSalary : undefined}
                />
              </label>
              {halfSalary !== null && (
                <div className="muted small">Max allowed: {halfSalary.toFixed(2)} (half of your salary)</div>
              )}
              <label>
                Reason for request
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Enter your reason"
                  rows={4}
                />
              </label>
              <div className="advance-messages">
                {error && <div className="error">{error}</div>}
                {message && <div className="success">{message}</div>}
              </div>
              <div className="advance-submit">
                <button className="btn primary" type="submit" disabled={loading}>
                  {loading ? 'Submitting…' : 'Send'}
                </button>
              </div>
            </form>
          </Card>

          <Card title="Request Status" className="advance-card">
            {pendingRequests.length ? (
              <div className="advance-status">
                <div className={`status-pill status-${(pendingRequests[0].status || '').toLowerCase()}`}>
                  {pendingRequests[0].status || 'Pending'}
                </div>
                <div className="muted small">Your latest request is being reviewed</div>
                <div className="status-meta">
                  <div>Amount: {pendingRequests[0].amount}</div>
                  <div>Date: {formatDateTime(pendingRequests[0].requestDate)}</div>
                </div>
                <button
                  className="btn secondary"
                  type="button"
                  disabled={canceling}
                  onClick={() => cancelLatestPending(pendingRequests[0].requestId)}
                >
                  {canceling ? 'Cancelling…' : 'Cancel'}
                </button>
              </div>
            ) : (
              <div className="advance-status empty">
                <div className="muted">No pending requests.</div>
              </div>
            )}
          </Card>
        </div>

        <Card title="My Requests">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.requestId}>
                  <td>{r.requestId}</td>
                  <td>{r.amount}</td>
                  <td>{r.status}</td>
                  <td>{formatDateTime(r.requestDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </Layout>
  );
};

const formatDateTime = (value) => {
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

export default EmployeeAdvance;
