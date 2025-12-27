import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const linksByRole = {
  Admin: [
    { to: '/admin/home', label: 'Dashboard' },
    { to: '/admin/add-user', label: 'Add User' },
    { to: '/admin/user-list', label: 'User List' }
  ],
  HRStaff: [
    { to: '/hr/home', label: 'Dashboard' },
    { to: '/hr/employee-management', label: 'Employees' },
    { to: '/hr/salary-details', label: 'Salary Details' },
    { to: '/hr/payroll', label: 'Payroll' },
    { to: '/hr/advance-requests', label: 'Advance Requests' },
    { to: '/hr/reports', label: 'Reports' }
  ],
  Employee: [
    { to: '/employee/home', label: 'Dashboard' },
    { to: '/employee/payslips', label: 'Payslips' },
    { to: '/employee/request-advance', label: 'Advance' },
    { to: '/employee/notifications', label: 'Notifications' }
  ]
};

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) return null;
  const links = linksByRole[user.role] || [];

  return (
    <aside className="sidebar">
      <div className="sidebar-profile">
        <div className="avatar">{user.fullName?.[0] || 'U'}</div>
        <div>
          <div className="sidebar-name">{user.fullName || user.username}</div>
          <div className="sidebar-role">{user.role}</div>
        </div>
      </div>
      <nav className="sidebar-nav">
        {links.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={location.pathname === link.to ? 'active' : ''}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <button className="btn secondary full sidebar-logout" onClick={logout}>
        Logout
      </button>
    </aside>
  );
};

export default Sidebar;
