import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import Card from '../../components/Card';
import api from '../../api/api';

const Reports = () => {
  const navigate = useNavigate();

  const [savedReports, setSavedReports] = useState([]);

  useEffect(() => {
    const loadReports = async () => {
      try {
        const data = await api.get('/hr/reports/saved');
        setSavedReports(data || []);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to load reports', err);
      }
    };
    loadReports();
  }, []);

  const grouped = useMemo(() => {
    const byType = { payroll: [], payslip: [], employee: [], advance: [] };
    savedReports.forEach((r) => {
      if (!byType[r.type]) byType[r.type] = [];
      byType[r.type].push(r);
    });
    return byType;
  }, [savedReports]);

  const renderReportList = (items) => {
    if (!items.length) {
      return <div className="muted">No reports yet. Generate one to see it here.</div>;
    }
    return items.map((r) => (
      <div key={r.id} className="report-item">
        <div className="report-lines">
          <span className="report-title">{`${(r.type || '').toUpperCase()} Report #${r.reportId}`}</span>
          <span className="report-sub">{new Date(r.createdAt).toLocaleString()}</span>
        </div>
        <button
          className="btn secondary"
          onClick={() => navigate('/hr/reports/result', { state: { reportId: r.reportId } })}
        >
          View
        </button>
      </div>
    ));
  };

  return (
    <Layout>
      <div className="reports-page">
        <div className="reports-grid">
          <Card
            title="Payroll Reports"
          className="report-column"
          actions={
            <button className="btn primary" onClick={() => navigate('/hr/reports/create?type=payroll')}>
              Generate report
            </button>
          }
        >
            <div className="report-list">
              {renderReportList(grouped.payroll)}
            </div>
          </Card>

          <Card
            title="Employee Reports"
            className="report-column"
            actions={
              <button className="btn primary" onClick={() => navigate('/hr/reports/create?type=employee')}>
                Generate report
              </button>
            }
          >
            <div className="report-list">
              {renderReportList(grouped.employee)}
            </div>
          </Card>

          <Card
            title="Advance Request Reports"
            className="report-column"
            actions={
              <button className="btn primary" onClick={() => navigate('/hr/reports/create?type=advance')}>
                Generate report
              </button>
            }
          >
            <div className="report-list">
              {renderReportList(grouped.advance)}
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Reports;
