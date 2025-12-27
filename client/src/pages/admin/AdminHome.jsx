import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';

const actions = [
  {
    to: '/admin/add-user',
    label: 'Add User',
    icon: (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path d="M18 23c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7Z" />
        <path d="M26 29c0-3.866-3.134-7-7-7h-2c-3.866 0-7 3.134-7 7v3" />
        <path d="M32 20v12" />
        <path d="M26 26h12" />
      </svg>
    ),
  },
  {
    to: '/admin/user-list',
    label: 'User List',
    icon: (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path d="M24 22c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7Z" />
        <path d="M32 26c3.866 0 7-3.134 7-7s-3.134-7-7-7" />
        <path d="M14 26c-3.866 0-7-3.134-7-7s3.134-7 7-7" />
        <path d="M33 32.5c0-3.59-4.03-6.5-9-6.5s-9 2.91-9 6.5V35" />
        <path d="M42 35c0-4.418-4.477-8-10-8" />
        <path d="M16 27c-5.523 0-10 3.582-10 8" />
      </svg>
    ),
  },
  {
    to: '/admin/user-list',
    label: 'Edit User',
    wide: true,
    icon: (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path d="M20 23c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7Z" />
        <path d="M28 28.5c0-3.59-4.03-6.5-9-6.5s-9 2.91-9 6.5V31" />
        <path d="M35.5 22.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z" />
        <path d="M37.5 32.5a5.5 5.5 0 0 0-11 0v2.5" />
      </svg>
    ),
  },
];

const AdminHome = () => (
  <Layout>
    <div className="admin-actions">
      {actions.map(({ to, label, icon, wide }) => (
        <Link
          key={label}
          to={to}
          className={`action-card${wide ? ' wide' : ''}`}
        >
          <span className="action-icon">{icon}</span>
          <span className="action-text">{label}</span>
        </Link>
      ))}
    </div>
  </Layout>
);

export default AdminHome;
