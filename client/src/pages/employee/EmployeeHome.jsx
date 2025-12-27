import React from 'react';
import Layout from '../../components/Layout';
import Card from '../../components/Card';

const EmployeeHome = () => (
  <Layout>
    <div className="grid cols-3">
      <Card title="My Payslips">
        <div className="muted">View your latest payslips.</div>
      </Card>
      <Card title="Advance Requests">
        <div className="muted">Create and track cash advances.</div>
      </Card>
      <Card title="Notifications">
        <div className="muted">Stay up to date.</div>
      </Card>
    </div>
  </Layout>
);

export default EmployeeHome;
