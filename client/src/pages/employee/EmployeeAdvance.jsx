import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import Card from '../../components/Card';
import api from '../../api/api';

const EmployeeAdvance = () => {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const loadRequests = async () => {
    setError('');
    try {
      const data = await api.get('/employee/advance');
      setRequests(data);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
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

  return (
    <Layout>
      <Card title="Request Advance">
        <form className="form-grid" onSubmit={submit}>
          <label>
            Amount
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          </label>
          <label>
            Reason
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} />
          </label>
          <div style={{ gridColumn: '1/-1' }}>
            {error && <div className="error">{error}</div>}
            {message && <div className="success">{message}</div>}
          </div>
          <button className="btn primary" type="submit" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit'}
          </button>
        </form>
      </Card>

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
                <td>{r.requestDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </Layout>
  );
};

export default EmployeeAdvance;
