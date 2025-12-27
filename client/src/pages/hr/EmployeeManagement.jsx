import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import Card from '../../components/Card';
import api from '../../api/api';

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
   const [saving, setSaving] = useState(false);

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

  const [editing, setEditing] = useState(null);

  const startEdit = (emp) => {
    setEditing({ ...emp });
  };

  const updateEmployee = async (e) => {
    e.preventDefault();
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

  useEffect(() => {
    loadEmployees();
  }, []);

  return (
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
                <tr key={e.id}>
                  <td>{e.fullName} <span className="muted" style={{ fontSize: 12 }}>#{e.id}</span></td>
                  <td>{e.department || '-'}</td>
                  <td>{e.position || '-'}</td>
                  <td>{e.isActive ? 'Active' : 'Inactive'}</td>
                  <td>
                    <button className="btn secondary" onClick={() => startEdit(e)}>Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </Layout>
  );
};

export default EmployeeManagement;
