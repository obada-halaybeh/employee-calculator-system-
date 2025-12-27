import React from 'react';
import Sidebar from './Sidebar';

const Layout = ({ children }) => (
  <div className="app-shell">
    <Sidebar />
    <main className="main-content">
      <header className="top-header">
        <h1>Employee Calculator</h1>
      </header>
      <div className="content-area">{children}</div>
    </main>
  </div>
);

export default Layout;
