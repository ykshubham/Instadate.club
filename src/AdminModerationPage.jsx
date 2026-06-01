import React from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, AlertTriangle, RefreshCw, BarChart2, CheckCircle, XCircle, Clock, Flag
} from 'lucide-react';

// Sprint 1 Task 7 (CONN-BE-04 / moderation queue UI).
// Admin-only review queue for abuse reports created via POST /api/reports.
// Backend gate: GET/POST /api/admin/reports (ADMIN_USER_IDS allowlist).

const STATUS_TABS = [
  { id: 'open', label: 'Open', icon: AlertTriangle, color: '#ff2e93' },
  { id: 'reviewing', label: 'Reviewing', icon: Clock, color: '#ffc107' },
  { id: 'actioned', label: 'Actioned', icon: CheckCircle, color: '#25d366' },
  { id: 'dismissed', label: 'Dismissed', icon: XCircle, color: 'var(--muted)' }
];

export default function AdminModerationPage({ navigate }) {
  const [reports, setReports] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [statusFilter, setStatusFilter] = React.useState('open');
  const [busyId, setBusyId] = React.useState(null);

  const fetchReports = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/reports?status=${statusFilter}`, {
        credentials: 'same-origin',
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (response.status === 403) throw new Error('Admin access required.');
      if (!response.ok) throw new Error(`Failed to load reports: ${response.statusText}`);
      const json = await response.json();
      setReports(json.reports || []);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load moderation queue.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  React.useEffect(() => { fetchReports(); }, [fetchReports]);

  const resolve = async (reportId, nextStatus) => {
    if (busyId) return;
    setBusyId(reportId);
    try {
      const response = await fetch(`/api/admin/reports/${reportId}`, {
        method: 'POST',
        credentials: 'same-origin',
        cache: 'no-store',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      if (!response.ok) throw new Error('Update failed');
      // Drop it from the current filtered view.
      setReports(current => current.filter(r => r.id !== reportId));
    } catch (err) {
      console.error(err);
      setError('Could not update report. Try again.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="page-shell admin-analytics-shell" style={{
      color: '#fff', paddingBottom: '6rem', maxWidth: '1100px', margin: '0 auto',
      height: '100%', overflowY: 'auto', width: '100%', boxSizing: 'border-box', display: 'block'
    }}>
      {/* Header bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', gap: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn-quiet" style={{ minWidth: '40px', padding: '0 10px' }} onClick={() => navigate('/profile')}>
            <ArrowLeft style={{ width: '18px', height: '18px' }} />
          </button>
          <div>
            <span className="eyebrow" style={{ color: 'var(--pink)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }}>TRUST & SAFETY</span>
            <h1 style={{ margin: '0.1rem 0 0', font: '900 2.2rem Outfit, sans-serif', letterSpacing: '-0.02em', background: 'linear-gradient(135deg, #fff, var(--muted))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Moderation Queue 🚩
            </h1>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn-quiet" style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => navigate('/admin/analytics')}>
            <BarChart2 style={{ width: '15px', height: '15px' }} /> Analytics
          </button>
          <button className="btn-main" style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={fetchReports}>
            <RefreshCw style={{ width: '14px', height: '14px' }} /> Refresh
          </button>
        </div>
      </div>

      {/* Status tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {STATUS_TABS.map(tab => {
          const Icon = tab.icon;
          const active = statusFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className="btn-quiet"
              style={{
                display: 'flex', alignItems: 'center', gap: '6px', minHeight: '38px',
                borderColor: active ? tab.color : 'var(--line)',
                background: active ? 'rgba(255,46,147,0.12)' : 'var(--panel-soft)',
                color: active ? '#fff' : 'var(--muted)', fontWeight: 700
              }}
            >
              <Icon style={{ width: '15px', height: '15px', color: tab.color }} /> {tab.label}
            </button>
          );
        })}
      </div>

      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}>
          <motion.div
            style={{ width: '38px', height: '38px', border: '3px solid rgba(255, 46, 147, 0.2)', borderTop: '3px solid #ff2e93', borderRadius: '50%' }}
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          />
        </div>
      )}

      {!loading && error && (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--muted)' }}>
          <AlertTriangle style={{ width: 32, height: 32, color: 'var(--pink)', marginBottom: '0.75rem' }} />
          <p style={{ margin: 0 }}>{error}</p>
        </div>
      )}

      {!loading && !error && reports.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--muted)' }}>
          <Flag style={{ width: 36, height: 36, color: 'var(--soft)', marginBottom: '0.75rem' }} />
          <p style={{ margin: 0, fontWeight: 700 }}>Nothing in the “{statusFilter}” queue.</p>
        </div>
      )}

      {!loading && !error && reports.map(report => (
        <div key={report.id} style={{
          background: 'var(--panel-soft)', border: '1px solid var(--line)', borderRadius: '16px',
          padding: '1rem 1.2rem', marginBottom: '0.85rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ minWidth: 0 }}>
              <span style={{ display: 'inline-block', fontSize: '0.66rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--cyan)', background: 'rgba(0,224,255,0.1)', padding: '2px 8px', borderRadius: '99px' }}>
                {report.target_type}
              </span>
              <strong style={{ display: 'block', font: '800 1rem Outfit, sans-serif', margin: '6px 0 2px' }}>{report.reason}</strong>
              {report.details && (
                <p style={{ margin: '4px 0', fontSize: '0.84rem', color: 'var(--muted)', wordBreak: 'break-word' }}>{report.details}</p>
              )}
              <small style={{ color: 'var(--soft)', fontSize: '0.72rem' }}>
                Reporter: {report.reporter_name || report.reporter_user_id} · Target: <code>{report.target_id}</code> · {new Date(report.created_at).toLocaleString()}
              </small>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.85rem', flexWrap: 'wrap' }}>
            {statusFilter !== 'reviewing' && (
              <button className="btn-quiet" disabled={busyId === report.id} style={{ minHeight: 34, fontSize: '0.78rem', padding: '0 14px' }} onClick={() => resolve(report.id, 'reviewing')}>
                Mark Reviewing
              </button>
            )}
            <button className="btn-quiet" disabled={busyId === report.id} style={{ minHeight: 34, fontSize: '0.78rem', padding: '0 14px', borderColor: 'rgba(37,211,102,0.4)', color: '#9af7bb' }} onClick={() => resolve(report.id, 'actioned')}>
              {busyId === report.id ? '…' : 'Action'}
            </button>
            <button className="btn-quiet" disabled={busyId === report.id} style={{ minHeight: 34, fontSize: '0.78rem', padding: '0 14px' }} onClick={() => resolve(report.id, 'dismissed')}>
              Dismiss
            </button>
          </div>
        </div>
      ))}
    </section>
  );
}
