import React, { useState } from 'react';
import Layout from '../../components/Layout';
import Card from '../../components/Card';
import api from '../../api/api';

const AddUser = () => {
  const [form, setForm] = useState({
    username: '',
    password: '',
    role: 'Employee',
    fullName: '',
    isActive: true
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await api.post('/admin/users', form);
      setSuccess('User created');
      setForm({
        username: '',
        password: '',
        role: 'Employee',
        fullName: '',
        isActive: true
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="add-user-page">
        <Card title="Add User" className="add-user-card">
          <form className="add-user-form" onSubmit={handleSubmit}>
            <label>
              User Name
              <input name="username" value={form.username} onChange={handleChange} required placeholder="User Name" />
            </label>
            <label>
              Password
              <input name="password" type="password" value={form.password} onChange={handleChange} required placeholder="Password" />
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
            <div>
              {error && <div className="error">{error}</div>}
              {success && <div className="success">{success}</div>}
            </div>
            <button className="btn primary add-user-submit" type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'ADD'}
            </button>
          </form>
        </Card>
      </div>
    </Layout>
  );
};

export default AddUser;
