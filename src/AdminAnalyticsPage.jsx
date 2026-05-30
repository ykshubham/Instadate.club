import React from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, AlertTriangle, Users, Heart, Calendar, MessageCircle, ShieldCheck,
  TrendingUp, Award, Clock, RefreshCw, BarChart2, Star, CheckCircle, XCircle, Zap
} from 'lucide-react';

export default function AdminAnalyticsPage({ navigate }) {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState('overview'); // overview, funnel, matches, events, trust, cohorts, feed
  const [error, setError] = React.useState(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/analytics', {
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch analytics: ${response.statusText}`);
      }
      const json = await response.json();
      setData(json);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load analytics data.');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div style={{
        minHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        color: '#fff'
      }}>
        <motion.div
          style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(255, 46, 147, 0.2)',
            borderTop: '3px solid #ff2e93',
            borderRadius: '50%'
          }}
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        />
        <span style={{ fontSize: '0.9rem', color: 'var(--muted)', fontWeight: 'bold' }}>
          Aggregating warehouse logs & telemetry...
        </span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="page-shell" style={{ color: '#fff', textAlign: 'center', padding: '4rem 2rem' }}>
        <AlertTriangle style={{ width: '48px', height: '48px', color: 'var(--pink)', marginBottom: '1rem' }} />
        <h2>Analytics Load Failed</h2>
        <p style={{ color: 'var(--muted)', margin: '0.5rem 0 1.5rem' }}>{error || 'Data is unavailable'}</p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button className="btn-main" onClick={fetchAnalytics}>Retry Fetch</button>
          <button className="btn-quiet" onClick={() => navigate('/')}>Back to Home</button>
        </div>
      </div>
    );
  }

  const { dashboard, cohorts, funnels, recentActivity, alerts } = data;
  const { northStar, matchQuality, eventQuality, trustAnalytics, realWorldSuccess } = dashboard;

  return (
    <section className="page-shell admin-analytics-shell" style={{ color: '#fff', paddingBottom: '5rem' }}>
      {/* Header bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn-quiet" style={{ minWidth: '40px', padding: '0 10px' }} onClick={() => navigate('/')}>
            <ArrowLeft style={{ width: '18px', height: '18px' }} />
          </button>
          <div>
            <span className="eyebrow" style={{ color: 'var(--pink)', fontWeight: 'bold' }}>Lead Admin Panel</span>
            <h1 style={{ margin: '0.1rem 0 0', font: '900 2.2rem Outfit, sans-serif' }}>Operational Validation Dashboard</h1>
          </div>
        </div>
        <button className="btn-quiet" style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={fetchAnalytics}>
          <RefreshCw style={{ width: '14px', height: '14px' }} /> Sync Logs
        </button>
      </div>

      {/* Critical Alert Warning Banners */}
      {alerts && alerts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
          {alerts.map((alert, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              style={{
                background: 'rgba(255, 46, 147, 0.08)',
                border: '1px solid rgba(255, 46, 147, 0.25)',
                borderRadius: '16px',
                padding: '1rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                color: '#ff68b4'
              }}
            >
              <AlertTriangle style={{ width: '20px', height: '20px', flexShrink: 0 }} />
              <span style={{ fontSize: '0.86rem', fontWeight: 'bold', lineHeight: 1.45 }}>{alert.message}</span>
            </motion.div>
          ))}
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div style={{
        display: 'flex',
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        borderRadius: '16px',
        padding: '4px',
        marginBottom: '2rem',
        overflowX: 'auto',
        gap: '4px',
        whiteSpace: 'nowrap'
      }}>
        {[
          { id: 'overview', label: 'North Star', icon: Star },
          { id: 'funnel', label: 'User Funnel', icon: BarChart2 },
          { id: 'matches', label: 'Match Quality', icon: Heart },
          { id: 'events', label: 'Event Quality', icon: Calendar },
          { id: 'trust', label: 'Trust Analytics', icon: ShieldCheck },
          { id: 'cohorts', label: 'Cohort Analytics', icon: Users },
          { id: 'feed', label: 'Activity Feed', icon: Clock }
        ].map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: active ? 'linear-gradient(135deg, rgba(255, 46, 147, 0.15), rgba(155, 48, 255, 0.15))' : 'transparent',
                border: active ? '1px solid rgba(255, 46, 147, 0.25)' : '1px solid transparent',
                borderRadius: '12px',
                color: active ? '#fff' : 'var(--muted)',
                padding: '10px 16px',
                fontSize: '0.82rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}
            >
              <Icon style={{ width: '14px', height: '14px' }} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}

      {/* 1. Overview Tab */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gap: '2rem' }}>
          {/* North Star Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
            <MetricCard title="Users Today" value={northStar.usersRegisteredToday} sub="Signups today" icon={<Users />} gradient="cyan" />
            <MetricCard title="Users This Week" value={northStar.usersRegisteredThisWeek} sub="Past 7 calendar days" icon={<TrendingUp />} gradient="purple" />
            <MetricCard title="Total Profiles" value={northStar.profilesCompleted} sub={`${northStar.profileCompletionRate}% completed`} icon={<ShieldCheck />} gradient="pink" />
            <MetricCard title="Meetups Done" value={northStar.meetupsCompleted} sub={`${northStar.meetupCompletionRate}% completed`} icon={<Award />} gradient="green" />
          </div>

          {/* Real-World Success Metrics */}
          <div className="feature-card" style={{
            background: 'rgba(37, 211, 102, 0.04)',
            border: '1px solid rgba(37, 211, 102, 0.16)',
            borderRadius: '24px',
            padding: '1.75rem'
          }}>
            <h3 style={{ font: '900 1.25rem Outfit, sans-serif', color: '#9af7bb', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap style={{ width: '18px', height: '18px' }} /> Real-World Success metrics
            </h3>
            <p style={{ margin: '0 0 1.5rem 0', color: 'var(--muted)', fontSize: '0.86rem' }}>
              These are our core validation metrics. They prove whether Instadate generates genuine connections offline.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem' }}>
              <div>
                <span style={{ fontSize: '0.74rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>Connections Created</span>
                <strong style={{ display: 'block', fontSize: '1.8rem', color: '#fff', margin: '4px 0' }}>{realWorldSuccess.connectionsCreated}</strong>
                <small style={{ color: 'var(--muted)' }}>Matches accepted</small>
              </div>
              <div style={{ borderLeft: '1px solid rgba(255,255,255,0.08)', paddingLeft: '1.25rem' }}>
                <span style={{ fontSize: '0.74rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>Meetups Planned</span>
                <strong style={{ display: 'block', fontSize: '1.8rem', color: '#fff', margin: '4px 0' }}>{realWorldSuccess.meetupsPlanned}</strong>
                <small style={{ color: 'var(--muted)' }}>Dating calendar holds</small>
              </div>
              <div style={{ borderLeft: '1px solid rgba(255,255,255,0.08)', paddingLeft: '1.25rem' }}>
                <span style={{ fontSize: '0.74rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>Completion Rate</span>
                <strong style={{ display: 'block', fontSize: '1.8rem', color: 'var(--green)', margin: '4px 0' }}>{realWorldSuccess.meetupCompletionRate}%</strong>
                <small style={{ color: 'var(--muted)' }}>Outings occurred</small>
              </div>
              <div style={{ borderLeft: '1px solid rgba(255,255,255,0.08)', paddingLeft: '1.25rem' }}>
                <span style={{ fontSize: '0.74rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>Would Meet Again</span>
                <strong style={{ display: 'block', fontSize: '1.8rem', color: '#ff2e93', margin: '4px 0' }}>{realWorldSuccess.wouldMeetAgainRate}%</strong>
                <small style={{ color: 'var(--muted)' }}>Positive feedback rate</small>
              </div>
            </div>
          </div>

          {/* Quick Metrics grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            <div className="feature-card" style={{ padding: '1.5rem' }}>
              <h4 style={{ margin: '0 0 1rem 0', font: '800 1rem Outfit, sans-serif' }}>Interaction Telemetry</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '10px', fontSize: '0.84rem' }}>
                <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--muted)' }}>Recommendations Viewed</span>
                  <strong>{northStar.recommendationsViewed}</strong>
                </li>
                <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--muted)' }}>Match Requests Sent</span>
                  <strong>{northStar.matchRequestsSent}</strong>
                </li>
                <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--muted)' }}>Chats Started</span>
                  <strong>{northStar.chatsStarted}</strong>
                </li>
                <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--muted)' }}>Chat Messages Sent</span>
                  <strong>{northStar.messagesSent}</strong>
                </li>
              </ul>
            </div>

            <div className="feature-card" style={{ padding: '1.5rem' }}>
              <h4 style={{ margin: '0 0 1rem 0', font: '800 1rem Outfit, sans-serif' }}>Event & Plan Telemetry</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '10px', fontSize: '0.84rem' }}>
                <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--muted)' }}>Event RSVPs</span>
                  <strong>{northStar.eventRSVPs}</strong>
                </li>
                <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--muted)' }}>Event Attendance Rate</span>
                  <strong style={{ color: 'var(--pink)' }}>{northStar.eventAttendanceRate}%</strong>
                </li>
                <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--muted)' }}>Instant Plans Created</span>
                  <strong>{northStar.instantPlansCreated}</strong>
                </li>
                <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--muted)' }}>Instant Plan Members Joined</span>
                  <strong>{northStar.instantPlansJoined}</strong>
                </li>
              </ul>
            </div>

            <div className="feature-card" style={{ padding: '1.5rem' }}>
              <h4 style={{ margin: '0 0 1rem 0', font: '800 1rem Outfit, sans-serif' }}>Reliability Metrics</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '10px', fontSize: '0.84rem' }}>
                <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--muted)' }}>Meetup No Shows</span>
                  <strong>{northStar.noShows}</strong>
                </li>
                <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--muted)' }}>No Show Rate</span>
                  <strong style={{ color: northStar.noShowRate > 20 ? 'var(--pink)' : '#fff' }}>
                    {northStar.noShowRate}%
                  </strong>
                </li>
                <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--muted)' }}>Average Trust Score</span>
                  <strong>{realWorldSuccess.averageTrustScore}/100</strong>
                </li>
                <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--muted)' }}>Average Attendee Reliability</span>
                  <strong>{realWorldSuccess.averageReliabilityScore}/100</strong>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 2. Funnels Tab */}
      {activeTab === 'funnel' && (
        <div style={{ display: 'grid', gap: '2rem' }}>
          <div className="feature-card" style={{ padding: '2rem' }}>
            <h3 style={{ font: '800 1.25rem Outfit, sans-serif', margin: '0 0 1.5rem 0' }}>Conversion Funnel Analytics</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <FunnelBar label="1. Distinct Visitors" count={funnels.steps.visitors} percent={100} color="var(--muted)" />
              <FunnelBar label="2. Users Registered" count={funnels.steps.registered} percent={funnels.steps.visitors > 0 ? (funnels.steps.registered / funnels.steps.visitors) * 100 : 0} color="var(--cyan)" />
              <FunnelBar label="3. Profiles Started" count={funnels.steps.profilesStarted} percent={funnels.steps.registered > 0 ? (funnels.steps.profilesStarted / funnels.steps.registered) * 100 : 0} color="var(--purple)" />
              <FunnelBar label="4. Profiles Completed" count={funnels.steps.profilesCompleted} percent={funnels.steps.registered > 0 ? (funnels.steps.profilesCompleted / funnels.steps.registered) * 100 : 0} color="var(--pink)" />
              <FunnelBar label="5. Recommendations Viewed" count={funnels.steps.recommendationsViewed} percent={funnels.steps.profilesCompleted > 0 ? (funnels.steps.recommendationsViewed / funnels.steps.profilesCompleted) * 100 : 0} color="#bf86ff" />
              <FunnelBar label="6. Match Requests Sent" count={funnels.steps.matchRequestsSent} percent={funnels.steps.profilesCompleted > 0 ? (funnels.steps.matchRequestsSent / funnels.steps.profilesCompleted) * 100 : 0} color="#ff68b4" />
              <FunnelBar label="7. Match Requests Accepted" count={funnels.steps.matchRequestsAccepted} percent={funnels.steps.matchRequestsSent > 0 ? (funnels.steps.matchRequestsAccepted / funnels.steps.matchRequestsSent) * 100 : 0} color="var(--green)" />
              <FunnelBar label="8. Chats Started" count={funnels.steps.chatsStarted} percent={funnels.steps.matchRequestsAccepted > 0 ? (funnels.steps.chatsStarted / funnels.steps.matchRequestsAccepted) * 100 : 0} color="#6bf299" />
              <FunnelBar label="9. Meetups Planned" count={funnels.steps.meetupsPlanned} percent={funnels.steps.chatsStarted > 0 ? (funnels.steps.meetupsPlanned / funnels.steps.chatsStarted) * 100 : 0} color="#ff9e2e" />
              <FunnelBar label="10. Meetups Completed" count={funnels.steps.meetupsCompleted} percent={funnels.steps.meetupsPlanned > 0 ? (funnels.steps.meetupsCompleted / funnels.steps.meetupsPlanned) * 100 : 0} color="#ff3333" />
            </div>
          </div>

          {/* Conversion Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
            <div className="feature-card" style={{ padding: '1.25rem', textAlign: 'center' }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>Profile Completion</span>
              <strong style={{ display: 'block', fontSize: '2rem', color: 'var(--pink)', margin: '6px 0' }}>
                {funnels.rates.profileCompletionRate}%
              </strong>
              <small style={{ color: 'var(--muted)' }}>Completed / Registered</small>
            </div>
            <div className="feature-card" style={{ padding: '1.25rem', textAlign: 'center' }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>Match Requesting</span>
              <strong style={{ display: 'block', fontSize: '2rem', color: 'var(--purple)', margin: '6px 0' }}>
                {funnels.rates.matchRequestRate}%
              </strong>
              <small style={{ color: 'var(--muted)' }}>Requests Sent / Profiles</small>
            </div>
            <div className="feature-card" style={{ padding: '1.25rem', textAlign: 'center' }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>Acceptance Rate</span>
              <strong style={{ display: 'block', fontSize: '2rem', color: 'var(--cyan)', margin: '6px 0' }}>
                {funnels.rates.acceptanceRate}%
              </strong>
              <small style={{ color: 'var(--muted)' }}>Accepted / Requests Sent</small>
            </div>
            <div className="feature-card" style={{ padding: '1.25rem', textAlign: 'center' }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>Meetup Completion</span>
              <strong style={{ display: 'block', fontSize: '2rem', color: 'var(--green)', margin: '6px 0' }}>
                {funnels.rates.meetupCompletionRate}%
              </strong>
              <small style={{ color: 'var(--muted)' }}>Completed / Planned</small>
            </div>
          </div>
        </div>
      )}

      {/* 3. Match Quality Tab */}
      {activeTab === 'matches' && (
        <div style={{ display: 'grid', gap: '2rem' }}>
          {/* Match Quality Stats */}
          <div className="feature-card" style={{ padding: '2rem' }}>
            <h3 style={{ font: '800 1.25rem Outfit, sans-serif', margin: '0 0 1.5rem 0' }}>Matchmaking Quality Ratios</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
              <div>
                <h4 style={{ margin: '0 0 0.75rem 0', font: '800 0.95rem Outfit, sans-serif', color: 'var(--pink)' }}>Conversion Efficiency</h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '12px', fontSize: '0.86rem' }}>
                  <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--muted)' }}>Rec → Meetup Outing</span>
                    <strong>{matchQuality.recommendationToMeetupRate}%</strong>
                  </li>
                  <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--muted)' }}>Match Request → Meetup</span>
                    <strong>{matchQuality.matchToMeetupRate}%</strong>
                  </li>
                  <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--muted)' }}>Rec → Chat Thread</span>
                    <strong>{matchQuality.recommendationToChatRate}%</strong>
                  </li>
                </ul>
              </div>

              <div style={{ borderLeft: '1px solid rgba(255,255,255,0.08)', paddingLeft: '1.5rem' }}>
                <h4 style={{ margin: '0 0 0.75rem 0', font: '800 0.95rem Outfit, sans-serif', color: 'var(--purple)' }}>Demand Telemetry</h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '12px', fontSize: '0.86rem' }}>
                  <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--muted)' }}>Recommendations Generated</span>
                    <strong>{matchQuality.recommendationsGenerated}</strong>
                  </li>
                  <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--muted)' }}>Member Profile Clicks</span>
                    <strong>{matchQuality.profileViews}</strong>
                  </li>
                  <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--muted)' }}>Match Outings Planned</span>
                    <strong>{matchQuality.meetupsPlanned}</strong>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Event Quality Tab */}
      {activeTab === 'events' && (
        <div style={{ display: 'grid', gap: '2rem' }}>
          <div className="feature-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ font: '800 1.25rem Outfit, sans-serif', margin: '0 0 1rem 0' }}>Top Performing Social Mixers</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'var(--muted)', textAlign: 'left' }}>
                    <th style={{ padding: '8px' }}>Mixer Name</th>
                    <th style={{ padding: '8px' }}>Views</th>
                    <th style={{ padding: '8px' }}>RSVPs</th>
                    <th style={{ padding: '8px' }}>Attendance</th>
                    <th style={{ padding: '8px' }}>No-Shows</th>
                    <th style={{ padding: '8px' }}>Quality Score</th>
                  </tr>
                </thead>
                <tbody>
                  {eventQuality.best.map((ev, i) => (
                    <tr key={ev.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '10px 8px', fontWeight: 'bold' }}>
                        <span style={{ color: 'var(--pink)', marginRight: '6px' }}>#{i+1}</span>
                        {ev.title}
                      </td>
                      <td style={{ padding: '10px 8px' }}>{ev.views}</td>
                      <td style={{ padding: '10px 8px' }}>{ev.rsvps}</td>
                      <td style={{ padding: '10px 8px', color: 'var(--green)' }}>{ev.attendance} ({ev.attendanceRate}%)</td>
                      <td style={{ padding: '10px 8px', color: ev.noShows > 0 ? 'var(--pink)' : '#fff' }}>{ev.noShows}</td>
                      <td style={{ padding: '10px 8px', fontWeight: 'bold', color: 'var(--cyan)' }}>{ev.eventQualityScore}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="feature-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ font: '800 1.25rem Outfit, sans-serif', margin: '0 0 1rem 0', color: 'var(--muted)' }}>Lowest Performing Mixers</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'var(--muted)', textAlign: 'left' }}>
                    <th style={{ padding: '8px' }}>Mixer Name</th>
                    <th style={{ padding: '8px' }}>Views</th>
                    <th style={{ padding: '8px' }}>RSVPs</th>
                    <th style={{ padding: '8px' }}>Attendance</th>
                    <th style={{ padding: '8px' }}>No-Shows</th>
                    <th style={{ padding: '8px' }}>Quality Score</th>
                  </tr>
                </thead>
                <tbody>
                  {eventQuality.worst.map((ev, i) => (
                    <tr key={ev.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '10px 8px', fontWeight: 'bold' }}>
                        <span style={{ color: 'var(--muted)', marginRight: '6px' }}>#{i+1}</span>
                        {ev.title}
                      </td>
                      <td style={{ padding: '10px 8px' }}>{ev.views}</td>
                      <td style={{ padding: '10px 8px' }}>{ev.rsvps}</td>
                      <td style={{ padding: '10px 8px' }}>{ev.attendance} ({ev.attendanceRate}%)</td>
                      <td style={{ padding: '10px 8px', color: 'var(--pink)' }}>{ev.noShows}</td>
                      <td style={{ padding: '10px 8px', fontWeight: 'bold' }}>{ev.eventQualityScore}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5. Trust Tab */}
      {activeTab === 'trust' && (
        <div style={{ display: 'grid', gap: '2rem' }}>
          {/* Trust Score Distribution */}
          <div className="feature-card" style={{ padding: '2rem' }}>
            <h3 style={{ font: '800 1.25rem Outfit, sans-serif', margin: '0 0 1.5rem 0' }}>Trust Score Distribution</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div style={{ textAlign: 'center', background: 'rgba(37,211,102,0.05)', borderRadius: '16px', padding: '1rem' }}>
                <span style={{ color: 'var(--green)', fontWeight: 'bold', fontSize: '0.8rem' }}>Excellent (90-100)</span>
                <strong style={{ display: 'block', fontSize: '2rem', margin: '6px 0' }}>{trustAnalytics.trustScoreDistribution.excellent}</strong>
                <small style={{ color: 'var(--muted)' }}>Most Reliable</small>
              </div>
              <div style={{ textAlign: 'center', background: 'rgba(0,215,245,0.05)', borderRadius: '16px', padding: '1rem' }}>
                <span style={{ color: 'var(--cyan)', fontWeight: 'bold', fontSize: '0.8rem' }}>Good (70-89)</span>
                <strong style={{ display: 'block', fontSize: '2rem', margin: '6px 0' }}>{trustAnalytics.trustScoreDistribution.good}</strong>
                <small style={{ color: 'var(--muted)' }}>Highly Engaged</small>
              </div>
              <div style={{ textAlign: 'center', background: 'rgba(255,158,46,0.05)', borderRadius: '16px', padding: '1rem' }}>
                <span style={{ color: '#ff9e2e', fontWeight: 'bold', fontSize: '0.8rem' }}>Fair (50-69)</span>
                <strong style={{ display: 'block', fontSize: '2rem', margin: '6px 0' }}>{trustAnalytics.trustScoreDistribution.fair}</strong>
                <small style={{ color: 'var(--muted)' }}>In validation tier</small>
              </div>
              <div style={{ textAlign: 'center', background: 'rgba(255,46,147,0.05)', borderRadius: '16px', padding: '1rem' }}>
                <span style={{ color: 'var(--pink)', fontWeight: 'bold', fontSize: '0.8rem' }}>Poor (&lt;50)</span>
                <strong style={{ display: 'block', fontSize: '2rem', margin: '6px 0' }}>{trustAnalytics.trustScoreDistribution.poor}</strong>
                <small style={{ color: 'var(--muted)' }}>Under review / penalty</small>
              </div>
            </div>
          </div>

          {/* Top/Worst Reliable Members */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            <div className="feature-card" style={{ padding: '1.5rem' }}>
              <h4 style={{ margin: '0 0 1rem 0', font: '800 1rem Outfit, sans-serif', color: 'var(--green)' }}>Top Reliable Members</h4>
              <div style={{ display: 'grid', gap: '12px' }}>
                {trustAnalytics.topReliableMembers.map((m, idx) => (
                  <div key={m.user_id} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.84rem' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, #00d7f5, #9b30ff)', display: 'grid', placeItems: 'center', fontWeight: 'bold', color: '#fff' }}>
                      {m.full_name?.slice(0,1) || 'U'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong style={{ display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{m.full_name || 'Verified Member'}</strong>
                      <span style={{ color: 'var(--muted)', fontSize: '0.74rem' }}>Attended {m.attended_count} mixers</span>
                    </div>
                    <strong style={{ color: 'var(--green)' }}>{Math.round(m.trust_score)} pts</strong>
                  </div>
                ))}
              </div>
            </div>

            <div className="feature-card" style={{ padding: '1.5rem' }}>
              <h4 style={{ margin: '0 0 1rem 0', font: '800 1rem Outfit, sans-serif', color: 'var(--pink)' }}>Lowest Reliability Warnings</h4>
              <div style={{ display: 'grid', gap: '12px' }}>
                {trustAnalytics.lowestReliabilityMembers.map((m, idx) => (
                  <div key={m.user_id} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.84rem' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(255, 46, 147, 0.1)', display: 'grid', placeItems: 'center', fontWeight: 'bold', color: 'var(--pink)' }}>
                      {m.full_name?.slice(0,1) || 'U'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong style={{ display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{m.full_name || 'Flagged Member'}</strong>
                      <span style={{ color: 'var(--muted)', fontSize: '0.74rem' }}>No-shows: {m.no_show_count}</span>
                    </div>
                    <strong style={{ color: 'var(--pink)' }}>{Math.round(m.trust_score)} pts</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Cohorts Tab */}
      {activeTab === 'cohorts' && (
        <div style={{ display: 'grid', gap: '2rem' }}>
          <div className="feature-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ font: '800 1.25rem Outfit, sans-serif', margin: '0 0 1rem 0' }}>Weekly Signup Cohorts</h3>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem', textAlign: 'center' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'var(--muted)' }}>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Cohort Week</th>
                    <th style={{ padding: '10px' }}>Size</th>
                    <th style={{ padding: '10px' }}>Completed Profile %</th>
                    <th style={{ padding: '10px' }}>Match Requests</th>
                    <th style={{ padding: '10px' }}>Meetups Done</th>
                    <th style={{ padding: '10px' }}>Day 1 Retention</th>
                    <th style={{ padding: '10px' }}>Day 7 Retention</th>
                    <th style={{ padding: '10px' }}>Day 30 Retention</th>
                  </tr>
                </thead>
                <tbody>
                  {cohorts.map((c, i) => (
                    <tr key={c.cohortWeek} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '12px 10px', fontWeight: 'bold', textAlign: 'left' }}>{c.cohortWeek}</td>
                      <td style={{ padding: '12px 10px' }}>{c.cohortSize}</td>
                      <td style={{ padding: '12px 10px' }}>{c.profileCompletionRate}%</td>
                      <td style={{ padding: '12px 10px' }}>{c.matchRequestsCount}</td>
                      <td style={{ padding: '12px 10px' }}>{c.meetupsCount}</td>
                      <td style={{ padding: '12px 10px', background: getHeatmapColor(c.day1RetentionRate), fontWeight: 'bold' }}>{c.day1RetentionRate}%</td>
                      <td style={{ padding: '12px 10px', background: getHeatmapColor(c.day7RetentionRate), fontWeight: 'bold' }}>{c.day7RetentionRate}%</td>
                      <td style={{ padding: '12px 10px', background: getHeatmapColor(c.day30RetentionRate), fontWeight: 'bold' }}>{c.day30RetentionRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 7. Activity Feed Tab */}
      {activeTab === 'feed' && (
        <div style={{ display: 'grid', gap: '2rem' }}>
          <div className="feature-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ font: '800 1.25rem Outfit, sans-serif', margin: '0 0 1rem 0' }}>Real-Time Activity Telemetry</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '500px', overflowY: 'auto' }}>
              {recentActivity.map(act => (
                <div
                  key={act.id}
                  style={{
                    background: 'rgba(255,255,255,0.01)',
                    border: '1px solid rgba(255,255,255,0.03)',
                    borderRadius: '12px',
                    padding: '0.75rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    fontSize: '0.82rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: getEventColor(act.event_name) }} />
                    <div>
                      <strong style={{ color: '#fff' }}>
                        {act.user?.fullName || 'System User'}
                      </strong>{' '}
                      <span style={{ color: 'var(--muted)' }}>triggered</span>{' '}
                      <strong style={{ color: getEventColor(act.event_name), textTransform: 'uppercase', fontSize: '0.76rem' }}>
                        {act.event_name.replace(/_/g, ' ')}
                      </strong>
                    </div>
                  </div>
                  <small style={{ color: 'var(--muted)', fontSize: '0.7rem' }}>
                    {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </small>
                </div>
              ))}

              {recentActivity.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>
                  No recent activities recorded yet. Trigger some actions in the app!
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

// Helpers
function MetricCard({ title, value, sub, icon, gradient }) {
  const grad = gradient === 'cyan' ? 'linear-gradient(135deg, #00f2fe, #4facfe)' :
               gradient === 'purple' ? 'linear-gradient(135deg, #9b30ff, #ff2e93)' :
               gradient === 'pink' ? 'linear-gradient(135deg, #ff2e93, #ff8a00)' :
               'linear-gradient(135deg, #25d366, #14a347)';
  return (
    <div className="feature-card" style={{ padding: '1.25rem', position: 'relative', display: 'flex', gap: '12px', alignItems: 'center' }}>
      <div style={{
        background: grad,
        borderRadius: '12px',
        padding: '8px',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {icon}
      </div>
      <div>
        <span style={{ fontSize: '0.74rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>{title}</span>
        <strong style={{ display: 'block', fontSize: '1.6rem', color: '#fff', margin: '2px 0' }}>{value}</strong>
        <small style={{ color: 'var(--muted)', fontSize: '0.74rem' }}>{sub}</small>
      </div>
    </div>
  );
}

function FunnelBar({ label, count, percent, color }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px', fontWeight: 'bold' }}>
        <span>{label}</span>
        <span>{count} ({Math.round(percent)}%)</span>
      </div>
      <div style={{ height: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '99px', overflow: 'hidden' }}>
        <div style={{ width: `${percent}%`, height: '100%', background: color, borderRadius: '99px' }} />
      </div>
    </div>
  );
}

function getHeatmapColor(rate) {
  if (rate >= 80) return 'rgba(37, 211, 102, 0.25)'; // Excellent green
  if (rate >= 50) return 'rgba(0, 215, 245, 0.2)';   // Good cyan
  if (rate >= 20) return 'rgba(255, 158, 46, 0.15)'; // Fair orange
  if (rate > 0) return 'rgba(255, 46, 147, 0.1)';   // Poor pink
  return 'transparent';
}

function getEventColor(evt) {
  if (evt.includes('completed') || evt.includes('accepted')) return 'var(--green)';
  if (evt.includes('created') || evt.includes('rsvp')) return 'var(--cyan)';
  if (evt.includes('sent') || evt.includes('viewed')) return 'var(--pink)';
  if (evt.includes('no_show') || evt.includes('rejected')) return '#ff3333';
  return 'var(--purple)';
}
