import React from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, AlertTriangle, RefreshCw, BarChart2, CheckCircle, XCircle, Clock, Flag,
  Users as UsersIcon, Calendar, ScrollText, Ban, PauseCircle, RotateCcw, EyeOff, ShieldCheck
} from 'lucide-react';

// Sprint 4 Task 3 — Admin & Moderation Controls.
// Unified moderator/admin console: report review queue, user suspension/banning,
// event moderation, role management, and the audit trail.
// Backend gate: every /api/admin/* route requires moderator (admin for roles),
// resolved from users.role with the ADMIN_USER_IDS env allowlist as super-admin.

const REPORT_TABS = [
  { id: 'open', label: 'Open', icon: AlertTriangle, color: '#ff2e93' },
  { id: 'reviewing', label: 'Reviewing', icon: Clock, color: '#ffc107' },
  { id: 'actioned', label: 'Actioned', icon: CheckCircle, color: '#25d366' },
  { id: 'dismissed', label: 'Dismissed', icon: XCircle, color: 'var(--muted)' }
];

const SECTIONS = [
  { id: 'reports', label: 'Reports', icon: Flag },
  { id: 'users', label: 'Users', icon: UsersIcon },
  { id: 'events', label: 'Events', icon: Calendar },
  { id: 'audit', label: 'Audit Log', icon: ScrollText }
];

const STATUS_COLOR = {
  active: '#25d366', suspended: '#ffc107', banned: '#ff2e93', deactivated: 'var(--muted)',
  hidden: '#ffc107', removed: '#ff2e93'
};

async function api(path, options) {
  const response = await fetch(path, {
    credentials: 'same-origin',
    cache: 'no-store',
    headers: { 'Cache-Control': 'no-cache', ...(options?.body ? { 'content-type': 'application/json' } : {}) },
    ...options
  });
  if (response.status === 403) throw new Error('Admin access required.');
  if (!response.ok) {
    let detail = response.statusText;
    try { detail = (await response.json()).error || detail; } catch { /* ignore */ }
    throw new Error(detail);
  }
  return response.json();
}

function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}>
      <motion.div
        style={{ width: '38px', height: '38px', border: '3px solid rgba(255, 46, 147, 0.2)', borderTop: '3px solid #ff2e93', borderRadius: '50%' }}
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
      />
    </div>
  );
}

const cardStyle = {
  background: 'var(--panel-soft)', border: '1px solid var(--line)', borderRadius: '16px',
  padding: '1rem 1.2rem', marginBottom: '0.85rem'
};
const pillBtn = {
  minHeight: 34, fontSize: '0.78rem', padding: '0 14px'
};

function Badge({ children, color }) {
  return (
    <span style={{
      display: 'inline-block', fontSize: '0.66rem', fontWeight: 900, textTransform: 'uppercase',
      letterSpacing: '0.06em', color: color || 'var(--cyan)', background: 'rgba(255,255,255,0.06)',
      padding: '2px 8px', borderRadius: '99px'
    }}>{children}</span>
  );
}

// --- Reports queue ----------------------------------------------------------
function ReportsSection({ setError }) {
  const [reports, setReports] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [statusFilter, setStatusFilter] = React.useState('open');
  const [busyId, setBusyId] = React.useState(null);

  const fetchReports = React.useCallback(async () => {
    setLoading(true);
    try {
      const json = await api(`/api/admin/reports?status=${statusFilter}`);
      setReports(json.reports || []);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [statusFilter, setError]);

  React.useEffect(() => { fetchReports(); }, [fetchReports]);

  const resolve = async (reportId, nextStatus) => {
    if (busyId) return;
    setBusyId(reportId);
    try {
      await api(`/api/admin/reports/${reportId}`, { method: 'POST', body: JSON.stringify({ status: nextStatus }) });
      setReports(current => current.filter(r => r.id !== reportId));
    } catch (err) { setError('Could not update report. ' + err.message); }
    finally { setBusyId(null); }
  };

  return (
    <>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {REPORT_TABS.map(tab => {
          const Icon = tab.icon;
          const active = statusFilter === tab.id;
          return (
            <button key={tab.id} onClick={() => setStatusFilter(tab.id)} className="btn-quiet" style={{
              display: 'flex', alignItems: 'center', gap: '6px', minHeight: '38px',
              borderColor: active ? tab.color : 'var(--line)',
              background: active ? 'rgba(255,46,147,0.12)' : 'var(--panel-soft)',
              color: active ? '#fff' : 'var(--muted)', fontWeight: 700
            }}>
              <Icon style={{ width: '15px', height: '15px', color: tab.color }} /> {tab.label}
            </button>
          );
        })}
      </div>

      {loading ? <Spinner /> : reports.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--muted)' }}>
          <Flag style={{ width: 36, height: 36, color: 'var(--soft)', marginBottom: '0.75rem' }} />
          <p style={{ margin: 0, fontWeight: 700 }}>Nothing in the “{statusFilter}” queue.</p>
        </div>
      ) : reports.map(report => (
        <div key={report.id} style={cardStyle}>
          <Badge>{report.target_type}</Badge>
          <strong style={{ display: 'block', font: '800 1rem Outfit, sans-serif', margin: '6px 0 2px' }}>{report.reason}</strong>
          {report.details && <p style={{ margin: '4px 0', fontSize: '0.84rem', color: 'var(--muted)', wordBreak: 'break-word' }}>{report.details}</p>}
          <small style={{ color: 'var(--soft)', fontSize: '0.72rem' }}>
            Reporter: {report.reporter_name || report.reporter_user_id} · Target: <strong style={{ color: 'var(--pink)' }}>{report.target_name || report.target_id}</strong> · {new Date(report.created_at).toLocaleString()}
          </small>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.85rem', flexWrap: 'wrap' }}>
            {statusFilter !== 'reviewing' && (
              <button className="btn-quiet" disabled={busyId === report.id} style={pillBtn} onClick={() => resolve(report.id, 'reviewing')}>Mark Reviewing</button>
            )}
            <button className="btn-quiet" disabled={busyId === report.id} style={{ ...pillBtn, borderColor: 'rgba(37,211,102,0.4)', color: '#9af7bb' }} onClick={() => resolve(report.id, 'actioned')}>
              {busyId === report.id ? '…' : 'Action'}
            </button>
            <button className="btn-quiet" disabled={busyId === report.id} style={pillBtn} onClick={() => resolve(report.id, 'dismissed')}>Dismiss</button>
          </div>
        </div>
      ))}
    </>
  );
}

// --- Users moderation -------------------------------------------------------
function UsersSection({ setError, isAdmin }) {
  const [users, setUsers] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [statusFilter, setStatusFilter] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [busyId, setBusyId] = React.useState(null);

  const fetchUsers = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (search.trim()) params.set('search', search.trim());
      const json = await api(`/api/admin/users?${params.toString()}`);
      setUsers(json.users || []);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [statusFilter, search, setError]);

  React.useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const setStatus = async (user, status) => {
    let reason = '';
    if (status !== 'active') {
      reason = window.prompt(`Reason for ${status === 'banned' ? 'banning' : 'suspending'} ${user.fullName || user.id}?`, '');
      if (reason === null) return; // cancelled
    }
    let until = null;
    if (status === 'suspended') {
      const days = window.prompt('Suspend for how many days? (blank = indefinite)', '7');
      if (days && Number(days) > 0) until = new Date(Date.now() + Number(days) * 86400000).toISOString();
    }
    setBusyId(user.id);
    try {
      await api(`/api/admin/users/${user.id}/status`, { method: 'POST', body: JSON.stringify({ status, reason, until }) });
      await fetchUsers();
    } catch (err) { setError('Could not update user. ' + err.message); }
    finally { setBusyId(null); }
  };

  const changeRole = async (user) => {
    const role = window.prompt(`Set role for ${user.fullName || user.id} (member | moderator | admin)`, user.role);
    if (!role || role === user.role) return;
    setBusyId(user.id);
    try {
      await api(`/api/admin/users/${user.id}/role`, { method: 'POST', body: JSON.stringify({ role: role.trim() }) });
      await fetchUsers();
    } catch (err) { setError('Could not change role. ' + err.message); }
    finally { setBusyId(null); }
  };

  return (
    <>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or email…"
          className="btn-quiet" style={{ flex: '1 1 200px', minHeight: 38, padding: '0 12px', textAlign: 'left' }} />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="btn-quiet"
          style={{ minHeight: 38, padding: '0 12px' }}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="banned">Banned</option>
          <option value="deactivated">Deactivated</option>
        </select>
      </div>

      {loading ? <Spinner /> : users.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--muted)' }}>
          <UsersIcon style={{ width: 36, height: 36, color: 'var(--soft)', marginBottom: '0.75rem' }} />
          <p style={{ margin: 0, fontWeight: 700 }}>No users match.</p>
        </div>
      ) : users.map(user => (
        <div key={user.id} style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ minWidth: 0 }}>
              <strong style={{ font: '800 1rem Outfit, sans-serif' }}>{user.fullName || '(no name)'}</strong>
              <div style={{ display: 'flex', gap: '6px', margin: '6px 0', flexWrap: 'wrap' }}>
                <Badge color={STATUS_COLOR[user.status]}>{user.status}</Badge>
                {user.role !== 'member' && <Badge color="#00e0ff">{user.role}</Badge>}
                {user.openReports > 0 && <Badge color="#ff2e93">{user.openReports} open report{user.openReports > 1 ? 's' : ''}</Badge>}
              </div>
              <small style={{ color: 'var(--soft)', fontSize: '0.72rem' }}>
                {user.email || user.id}
                {user.statusReason ? ` · ${user.statusReason}` : ''}
                {user.statusUntil ? ` · until ${new Date(user.statusUntil).toLocaleDateString()}` : ''}
              </small>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.85rem', flexWrap: 'wrap' }}>
            {user.status !== 'active' ? (
              <button className="btn-quiet" disabled={busyId === user.id} style={{ ...pillBtn, borderColor: 'rgba(37,211,102,0.4)', color: '#9af7bb' }} onClick={() => setStatus(user, 'active')}>
                <RotateCcw style={{ width: 13, height: 13 }} /> Reinstate
              </button>
            ) : (
              <>
                <button className="btn-quiet" disabled={busyId === user.id} style={{ ...pillBtn, color: '#ffd166' }} onClick={() => setStatus(user, 'suspended')}>
                  <PauseCircle style={{ width: 13, height: 13 }} /> Suspend
                </button>
                <button className="btn-quiet" disabled={busyId === user.id} style={{ ...pillBtn, borderColor: 'rgba(255,46,147,0.4)', color: '#ff8fc4' }} onClick={() => setStatus(user, 'banned')}>
                  <Ban style={{ width: 13, height: 13 }} /> Ban
                </button>
              </>
            )}
            {isAdmin && (
              <button className="btn-quiet" disabled={busyId === user.id} style={{ ...pillBtn, color: '#00e0ff' }} onClick={() => changeRole(user)}>
                <ShieldCheck style={{ width: 13, height: 13 }} /> Role
              </button>
            )}
          </div>
        </div>
      ))}
    </>
  );
}

// --- Events moderation ------------------------------------------------------
function EventsSection({ setError }) {
  const [events, setEvents] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [statusFilter, setStatusFilter] = React.useState('');
  const [busyId, setBusyId] = React.useState(null);

  const fetchEvents = React.useCallback(async () => {
    setLoading(true);
    try {
      const json = await api(`/api/admin/events${statusFilter ? `?status=${statusFilter}` : ''}`);
      setEvents(json.events || []);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [statusFilter, setError]);

  React.useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const moderate = async (event, status) => {
    let reason = '';
    if (status !== 'active') {
      reason = window.prompt(`Reason for ${status === 'removed' ? 'removing' : 'hiding'} "${event.title}"?`, '');
      if (reason === null) return;
    }
    setBusyId(event.id);
    try {
      await api(`/api/admin/events/${event.id}/moderation`, { method: 'POST', body: JSON.stringify({ status, reason }) });
      await fetchEvents();
    } catch (err) { setError('Could not moderate event. ' + err.message); }
    finally { setBusyId(null); }
  };

  return (
    <>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="btn-quiet" style={{ minHeight: 38, padding: '0 12px' }}>
          <option value="">All events</option>
          <option value="active">Active</option>
          <option value="hidden">Hidden</option>
          <option value="removed">Removed</option>
        </select>
      </div>

      {loading ? <Spinner /> : events.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--muted)' }}>
          <Calendar style={{ width: 36, height: 36, color: 'var(--soft)', marginBottom: '0.75rem' }} />
          <p style={{ margin: 0, fontWeight: 700 }}>No events match.</p>
        </div>
      ) : events.map(event => (
        <div key={event.id} style={cardStyle}>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '6px', flexWrap: 'wrap' }}>
            <Badge color={STATUS_COLOR[event.moderationStatus] || '#25d366'}>{event.moderationStatus}</Badge>
            {event.openReports > 0 && <Badge color="#ff2e93">{event.openReports} open report{event.openReports > 1 ? 's' : ''}</Badge>}
          </div>
          <strong style={{ display: 'block', font: '800 1rem Outfit, sans-serif' }}>{event.title}</strong>
          <small style={{ color: 'var(--soft)', fontSize: '0.72rem', display: 'block', margin: '4px 0' }}>
            Host: {event.hostName} · {event.location} · {event.date}
            {event.moderationReason ? ` · ${event.moderationReason}` : ''}
          </small>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.85rem', flexWrap: 'wrap' }}>
            {event.moderationStatus !== 'active' ? (
              <button className="btn-quiet" disabled={busyId === event.id} style={{ ...pillBtn, borderColor: 'rgba(37,211,102,0.4)', color: '#9af7bb' }} onClick={() => moderate(event, 'active')}>
                <RotateCcw style={{ width: 13, height: 13 }} /> Restore
              </button>
            ) : (
              <>
                <button className="btn-quiet" disabled={busyId === event.id} style={{ ...pillBtn, color: '#ffd166' }} onClick={() => moderate(event, 'hidden')}>
                  <EyeOff style={{ width: 13, height: 13 }} /> Hide
                </button>
                <button className="btn-quiet" disabled={busyId === event.id} style={{ ...pillBtn, borderColor: 'rgba(255,46,147,0.4)', color: '#ff8fc4' }} onClick={() => moderate(event, 'removed')}>
                  <XCircle style={{ width: 13, height: 13 }} /> Remove
                </button>
              </>
            )}
          </div>
        </div>
      ))}
    </>
  );
}

// --- Audit trail ------------------------------------------------------------
function AuditSection({ setError }) {
  const [logs, setLogs] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const json = await api('/api/admin/audit');
        setLogs(json.logs || []);
      } catch (err) { setError(err.message); }
      finally { setLoading(false); }
    })();
  }, [setError]);

  if (loading) return <Spinner />;
  if (logs.length === 0) return (
    <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--muted)' }}>
      <ScrollText style={{ width: 36, height: 36, color: 'var(--soft)', marginBottom: '0.75rem' }} />
      <p style={{ margin: 0, fontWeight: 700 }}>No moderation actions logged yet.</p>
    </div>
  );

  return logs.map(log => (
    <div key={log.id} style={{ ...cardStyle, padding: '0.8rem 1.1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ minWidth: 0 }}>
          <Badge color="#00e0ff">{log.action}</Badge>
          <span style={{ marginLeft: 8, fontSize: '0.84rem', color: 'var(--muted)' }}>
            {log.targetType}{log.targetId ? ` · ${log.targetId}` : ''}
          </span>
          {log.reason && <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--soft)' }}>{log.reason}</p>}
        </div>
        <small style={{ color: 'var(--soft)', fontSize: '0.7rem', whiteSpace: 'nowrap' }}>
          {log.actorName} · {new Date(log.createdAt).toLocaleString()}
        </small>
      </div>
    </div>
  ));
}

export default function AdminModerationPage({ navigate }) {
  const [section, setSection] = React.useState('reports');
  const [error, setError] = React.useState(null);
  const [me, setMe] = React.useState(null);
  const [accessError, setAccessError] = React.useState(null);

  React.useEffect(() => {
    (async () => {
      try { setMe(await api('/api/admin/me')); }
      catch (err) { setAccessError(err.message); }
    })();
  }, []);

  // Clear transient errors when switching tabs.
  React.useEffect(() => { setError(null); }, [section]);

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
              Moderation Console 🚩
            </h1>
          </div>
        </div>
        <button className="btn-quiet" style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => navigate('/admin/analytics')}>
          <BarChart2 style={{ width: '15px', height: '15px' }} /> Analytics
        </button>
      </div>

      {accessError ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--muted)' }}>
          <AlertTriangle style={{ width: 32, height: 32, color: 'var(--pink)', marginBottom: '0.75rem' }} />
          <p style={{ margin: 0 }}>{accessError}</p>
        </div>
      ) : (
        <>
          {/* Section tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
            {SECTIONS.map(s => {
              const Icon = s.icon;
              const active = section === s.id;
              return (
                <button key={s.id} onClick={() => setSection(s.id)} className="btn-quiet" style={{
                  display: 'flex', alignItems: 'center', gap: '6px', minHeight: '40px',
                  borderColor: active ? 'var(--pink)' : 'var(--line)',
                  background: active ? 'rgba(255,46,147,0.12)' : 'var(--panel-soft)',
                  color: active ? '#fff' : 'var(--muted)', fontWeight: 800
                }}>
                  <Icon style={{ width: '15px', height: '15px' }} /> {s.label}
                </button>
              );
            })}
          </div>

          {error && (
            <div style={{ ...cardStyle, borderColor: 'rgba(255,46,147,0.4)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle style={{ width: 18, height: 18, color: 'var(--pink)', flexShrink: 0 }} />
              <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>{error}</span>
            </div>
          )}

          {section === 'reports' && <ReportsSection setError={setError} />}
          {section === 'users' && <UsersSection setError={setError} isAdmin={Boolean(me?.isAdmin)} />}
          {section === 'events' && <EventsSection setError={setError} />}
          {section === 'audit' && <AuditSection setError={setError} />}
        </>
      )}
    </section>
  );
}
