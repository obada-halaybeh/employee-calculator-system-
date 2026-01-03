import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const iconProps = {
  width: 18,
  height: 18,
  stroke: 'currentColor',
  fill: 'none',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true
};

const DashboardIcon = (props) => (
  <svg {...iconProps} {...props} viewBox="0 0 24 24">
    <path d="M4 12h7V4H4zM13 20h7v-8h-7zM4 20h7v-6H4zM13 4v5h7V4z" />
  </svg>
);

const UsersIcon = (props) => (
  <svg {...iconProps} {...props} viewBox="0 0 24 24">
    <path d="M5 20v-1a4 4 0 0 1 4-4h0a4 4 0 0 1 4 4v1M15 11.5a3 3 0 1 0-2-5.5M7 11a3 3 0 1 0-2-5" />
  </svg>
);

const UserPlusIcon = (props) => (
  <svg {...iconProps} {...props} viewBox="0 0 24 24">
    <path d="M10 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" />
    <path d="M3 20v-1.5A5.5 5.5 0 0 1 8.5 13h3" />
    <path d="M16 8v6M13 11h6" />
  </svg>
);

const WalletIcon = (props) => (
  <svg {...iconProps} {...props} viewBox="0 0 24 24">
    <path d="M4 7h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2zM16 13h4" />
    <path d="M16 11h4V9a2 2 0 0 0-2-2h-2z" />
  </svg>
);

const CoinsIcon = (props) => (
  <svg {...iconProps} {...props} viewBox="0 0 24 24">
    <ellipse cx="12" cy="6" rx="6" ry="3" />
    <path d="M6 6v5c0 1.7 2.7 3 6 3s6-1.3 6-3V6" />
    <path d="M6 11v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5" />
  </svg>
);

const AdvanceIcon = (props) => (
  <svg {...iconProps} {...props} viewBox="0 0 24 24">
    <path d="M12 3v18M8 7h6.5a3.5 3.5 0 0 1 0 7H8l6.5 7" />
  </svg>
);

const ChartIcon = (props) => (
  <svg {...iconProps} {...props} viewBox="0 0 24 24">
    <path d="M4 20h16" />
    <path d="M7 20V9M12 20V4M17 20v-8" />
  </svg>
);

const BellIcon = (props) => (
  <svg {...iconProps} {...props} viewBox="0 0 24 24">
    <path d="M6 9a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8" />
    <path d="M10 21h4" />
  </svg>
);

const DocumentIcon = (props) => (
  <svg {...iconProps} {...props} viewBox="0 0 24 24">
    <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
    <path d="M14 3v6h6" />
    <path d="M9 13h6M9 17h4" />
  </svg>
);

const iconMap = {
  dashboard: DashboardIcon,
  people: UsersIcon,
  addUser: UserPlusIcon,
  salary: WalletIcon,
  payroll: CoinsIcon,
  advance: AdvanceIcon,
  reports: ChartIcon,
  notifications: BellIcon,
  payslips: DocumentIcon
};

const linksByRole = {
  Admin: [
    { to: '/admin/home', label: 'Dashboard', icon: 'dashboard' },
    { to: '/admin/add-user', label: 'Add User', icon: 'addUser' },
    { to: '/admin/user-list', label: 'User List', icon: 'people' }
  ],
  HRStaff: [
    { to: '/hr/home', label: 'Dashboard', icon: 'dashboard' },
    { to: '/hr/employee-management', label: 'Employees', icon: 'people' },
    { to: '/hr/salary-details', label: 'Salary Details', icon: 'salary' },
    { to: '/hr/payroll', label: 'Payroll', icon: 'payroll' },
    { to: '/hr/advance-requests', label: 'Advance Requests', icon: 'advance' },
    { to: '/hr/reports', label: 'Reports', icon: 'reports' },
    { to: '/hr/notifications', label: 'Notifications', icon: 'notifications' }
  ],
  Employee: [
    { to: '/employee/home', label: 'Dashboard', icon: 'dashboard' },
    { to: '/employee/payslips', label: 'Payslips', icon: 'payslips' },
    { to: '/employee/request-advance', label: 'Advance', icon: 'advance' },
    { to: '/employee/notifications', label: 'Notifications', icon: 'notifications' }
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
        {links.map((link) => {
          const Icon = iconMap[link.icon];
          return (
          <Link
            key={link.to}
            to={link.to}
            className={location.pathname === link.to ? 'active' : ''}
          >
            {Icon && <Icon className="sidebar-icon" />}
            <span className="sidebar-link-label">{link.label}</span>
          </Link>
          );
        })}
      </nav>
      <button className="btn secondary full sidebar-logout" onClick={logout}>
        Logout
      </button>
    </aside>
  );
};

export default Sidebar;
