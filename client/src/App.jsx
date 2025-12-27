import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import AdminHome from './pages/admin/AdminHome';
import AddUser from './pages/admin/AddUser';
import UserList from './pages/admin/UserList';
import UpdateUser from './pages/admin/UpdateUser';
import HrHome from './pages/hr/HrHome';
import EmployeeManagement from './pages/hr/EmployeeManagement';
import SalaryDetails from './pages/hr/SalaryDetails';
import Payroll from './pages/hr/Payroll';
import AdvanceRequests from './pages/hr/AdvanceRequests';
import Reports from './pages/hr/Reports';
import EmployeeHome from './pages/employee/EmployeeHome';
import EmployeePayslips from './pages/employee/EmployeePayslips';
import EmployeeAdvance from './pages/employee/EmployeeAdvance';
import EmployeeNotifications from './pages/employee/EmployeeNotifications';
import ProtectedRoute from './routes/ProtectedRoute';
import RoleRoute from './routes/RoleRoute';
import { useAuth } from './context/AuthContext';

function App() {
  const { user } = useAuth();

  const redirectByRole = () => {
    if (!user) return '/login';
    if (user.role === 'Admin') return '/admin/home';
    if (user.role === 'HRStaff') return '/hr/home';
    if (user.role === 'Employee') return '/employee/home';
    return '/login';
  };

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={<Navigate to={redirectByRole()} replace />}
      />

      <Route element={<ProtectedRoute />}>
        <Route element={<RoleRoute roles={['Admin']} />}>
          <Route path="/admin/home" element={<AdminHome />} />
          <Route path="/admin/add-user" element={<AddUser />} />
          <Route path="/admin/user-list" element={<UserList />} />
          <Route path="/admin/update-user/:id" element={<UpdateUser />} />
        </Route>

        <Route element={<RoleRoute roles={['HRStaff']} />}>
          <Route path="/hr/home" element={<HrHome />} />
          <Route path="/hr/employee-management" element={<EmployeeManagement />} />
          <Route path="/hr/salary-details" element={<SalaryDetails />} />
          <Route path="/hr/payroll" element={<Payroll />} />
          <Route path="/hr/advance-requests" element={<AdvanceRequests />} />
          <Route path="/hr/reports" element={<Reports />} />
        </Route>

        <Route element={<RoleRoute roles={['Employee']} />}>
          <Route path="/employee/home" element={<EmployeeHome />} />
          <Route path="/employee/payslips" element={<EmployeePayslips />} />
          <Route path="/employee/request-advance" element={<EmployeeAdvance />} />
          <Route path="/employee/notifications" element={<EmployeeNotifications />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
