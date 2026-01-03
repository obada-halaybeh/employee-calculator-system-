import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import Card from '../../components/Card';
import api from '../../api/api';
import { useAuth } from '../../context/AuthContext';

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);

  const [editing, setEditing] = useState(null);
  const { user } = useAuth();

  const loadEmployees = async () => {
    setError('');
    setLoading(true);
    try {
      const data = await api.get('/hr/employees');
      setEmployees(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (emp) => {
    if (user && String(emp.id) === String(user.id)) {
      setError('You cannot edit your own account.');
      return;
    }
    setEditing({ ...emp });
  };

  const updateEmployee = async (e) => {
    e.preventDefault();
    if (user && editing && String(editing.id) === String(user.id)) {
      setError('You cannot edit your own account.');
      setEditing(null);
      return;
    }
    setSaving(true);
    try {
      await api.put(`/hr/employees/${editing.id}`, {
        fullName: editing.fullName,
        department: editing.department,
        position: editing.position,
        bankInfo: editing.bankInfo
      });
      setEditing(null);
      loadEmployees();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteEmployee = async (emp) => {
    if (user && String(emp.id) === String(user.id)) {
      setError('You cannot delete your own account.');
      return;
    }
    if (!emp?.id) return;
    setError('');
    setDeletingId(emp.id);
    try {
      await api.delete(`/hr/employees/${emp.id}`);
      setEmployees((prev) => prev.filter((e) => e.id !== emp.id));
      setConfirmTarget(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  return (
    <>
      <Layout>
        {editing && (
          <div className="modal-overlay">
            <div className="modal-content">
              <Card title="Edit Employee" className="add-user-card">
                <form className="add-user-form" onSubmit={updateEmployee}>
                  <label>
                    Full Name
                    <input
                      value={editing.fullName}
                      placeholder="Full Name"
                      onChange={(e) => setEditing({ ...editing, fullName: e.target.value })}
                      required
                    />
                  </label>
                  <label>
                    Department
                    <input
                      value={editing.department || ''}
                      placeholder="Department"
                      onChange={(e) => setEditing({ ...editing, department: e.target.value })}
                    />
                  </label>
                  <label>
                    Position
                    <input
                      value={editing.position || ''}
                      placeholder="Position"
                      onChange={(e) => setEditing({ ...editing, position: e.target.value })}
                    />
                  </label>
                  <label>
                    Bank Info
                    <input
                      value={editing.bankInfo || ''}
                      placeholder="Bank Info"
                      onChange={(e) => setEditing({ ...editing, bankInfo: e.target.value })}
                    />
                  </label>
                  <div className="edit-actions">
                    <button className="btn primary add-user-submit full" type="submit" disabled={saving}>
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button className="btn ghost add-user-submit full" type="button" onClick={() => setEditing(null)}>
                      Cancel
                    </button>
                  </div>
                </form>
              </Card>
            </div>
          </div>
        )}

        <Card title="Employees">
          {error && <div className="error">{error}</div>}
          {loading ? (
            <div>Loading...</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Department</th>
                  <th>Position</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {employees.map((e) => (
                  // Prevent the current user from editing/deleting themselves
                  <tr key={e.id}>
                    <td>
                      {e.fullName} <span className="muted" style={{ fontSize: 12 }}>#{e.id}</span>
                    </td>
                    <td>{e.department || '-'}</td>
                    <td>{e.position || '-'}</td>
                    <td>{e.isActive ? 'Active' : 'Inactive'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          className="btn secondary"
                          onClick={() => startEdit(e)}
                          disabled={user && String(e.id) === String(user.id)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn danger"
                          onClick={() => {
                            if (user && String(e.id) === String(user.id)) {
                              setError('You cannot delete your own account.');
                              return;
                            }
                            setConfirmTarget(e);
                          }}
                          disabled={deletingId === e.id || (user && String(e.id) === String(user.id))}
                        >
                          {deletingId === e.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </Layout>

      {confirmTarget && (
        <div className="modal-overlay">
          <div className="modal-content">
            <Card title="Delete Employee" className="add-user-card">
              <div className="card-body">
                <div className="muted">This action cannot be undone.</div>
                <div className="strong">#{confirmTarget.id} — {confirmTarget.fullName}</div>
                <div className="muted small">
                  Dept: {confirmTarget.department || '—'} · Position: {confirmTarget.position || '—'}
                </div>
                <div className="edit-actions">
                  <button
                    className="btn danger add-user-submit full"
                    onClick={() => deleteEmployee(confirmTarget)}
                    disabled={deletingId === confirmTarget.id}
                  >
                    {deletingId === confirmTarget.id ? 'Deleting...' : 'Confirm delete'}
                  </button>
                  <button
                    className="btn ghost add-user-submit full"
                    onClick={() => setConfirmTarget(null)}
                    disabled={deletingId === confirmTarget.id}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </>
  );
};

export default EmployeeManagement;
