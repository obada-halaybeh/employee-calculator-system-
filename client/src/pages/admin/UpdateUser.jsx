import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../../components/Layout';
import Card from '../../components/Card';
import api from '../../api/api';

const UpdateUser = () => {
  const { id } = useParams();
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const loadUser = async () => {
    setError('');
    try {
      const users = await api.get('/admin/users');
      const found = users.find((u) => String(u.id) === String(id));
      if (!found) {
        setError('User not found');
      } else {
        setForm({
          username: found.username,
          password: '',
          role: found.role,
          fullName: found.fullName,
          isActive: !!found.isActive
        });
      }
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadUser();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;
      await api.put(`/admin/users/${id}`, payload);
      setSuccess('User updated');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!form) {
    return (
      <Layout>
        <div className="add-user-page">
          <Card title="Update User" className="add-user-card">
            {error ? <div className="error">{error}</div> : <div>Loading...</div>}
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="add-user-page">
        <Card title={`Update User #${id}`} className="add-user-card">
          <form className="add-user-form" onSubmit={handleSubmit}>
            <label>
              User Name
              <input name="username" value={form.username} onChange={handleChange} required placeholder="User Name" />
            </label>
            <label>
              Password (leave blank to keep)
              <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Password" />
            </label>
            <label>
              Role
              <select name="role" value={form.role} onChange={handleChange}>
                <option value="Admin">Admin</option>
                <option value="HRStaff">HRStaff</option>
                <option value="Employee">Employee</option>
              </select>
            </label>
            <label>
              Employee Name
              <input name="fullName" value={form.fullName} onChange={handleChange} required placeholder="Employee Name" />
            </label>
            <label className="toggle-row">
              <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange} />
              Active
            </label>
            <div>
              {error && <div className="error">{error}</div>}
              {success && <div className="success">{success}</div>}
            </div>
            <button className="btn primary add-user-submit" type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </Card>
      </div>
    </Layout>
  );
};

export default UpdateUser;
