import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, AlertTriangle, Users, Heart, Calendar, MessageCircle, ShieldCheck,
  TrendingUp, Award, Clock, RefreshCw, BarChart2, Star, CheckCircle, XCircle, Zap,
  TrendingDown, Check, UserCheck, Flame, Compass, Activity, ArrowRight, ShieldAlert,
  User
} from 'lucide-react';

function MemberAvatar({ avatarUrl, fullName, size = 28 }) {
  const [error, setError] = React.useState(false);

  if (avatarUrl && !error) {
    return (
      <img
        src={avatarUrl}
        onError={() => setError(true)}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '50%',
          objectFit: 'cover',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}
        alt={fullName || ''}
      />
    );
  }

  const initials = fullName
    ? fullName
        .split(' ')
        .map(n => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '';

  if (initials) {
    return (
      <div
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '50%',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          background: 'rgba(255, 255, 255, 0.1)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: `${size * 0.4}px`,
          fontWeight: 'bold',
          textTransform: 'uppercase'
        }}
      >
        {initials}
      </div>
    );
  }

  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        background: 'rgba(255, 255, 255, 0.1)',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <User style={{ width: `${size * 0.6}px`, height: `${size * 0.6}px`, opacity: 0.8 }} />
    </div>
  );
}

export default function AdminHealthPage({ navigate }) {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [activeSourceFilter, setActiveSourceFilter] = React.useState('All');

  const fetchHealthMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/health', {
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch company health metrics: ${response.statusText}`);
      }
      const json = await response.json();
      setData(json);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load company health metrics.');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchHealthMetrics();
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
            width: '44px',
            height: '44px',
            border: '3px solid rgba(255, 46, 147, 0.2)',
            borderTop: '3px solid #ff2e93',
            borderRadius: '50%'
          }}
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        />
        <span style={{ fontSize: '0.9rem', color: 'var(--muted)', fontWeight: 'bold', letterSpacing: '0.05em' }}>
          GATHERING SYSTEM TELEMETRY & FUNNEL INSIGHTS...
        </span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="page-shell" style={{ color: '#fff', textAlign: 'center', padding: '4rem 2rem' }}>
        <AlertTriangle style={{ width: '48px', height: '48px', color: 'var(--pink)', marginBottom: '1rem' }} />
        <h2>Health Dashboard Load Failed</h2>
        <p style={{ color: 'var(--muted)', margin: '0.5rem 0 1.5rem' }}>{error || 'Data is unavailable'}</p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button className="btn-main" onClick={fetchHealthMetrics}>Retry Sync</button>
          <button className="btn-quiet" onClick={() => navigate('/')}>Back to Home</button>
        </div>
      </div>
    );
  }

  const {
    funnel,
    acquisition,
    activation,
    matchFunnel,
    connections,
    trust,
    events,
    recommendationPerformance,
    alerts
  } = data;

  // Helper to format growth badge
  const renderGrowthBadge = (growth) => {
    const isPositive = growth > 0;
    const isNegative = growth < 0;
    const color = isPositive ? '#25d366' : isNegative ? '#ff2e93' : '#ffc107';
    const Icon = isPositive ? TrendingUp : isNegative ? TrendingDown : Activity;
    const sign = isPositive ? '+' : '';

    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        background: `rgba(${isPositive ? '37, 211, 102' : isNegative ? '255, 46, 147' : '255, 193, 7'}, 0.08)`,
        border: `1px solid rgba(${isPositive ? '37, 211, 102' : isNegative ? '255, 46, 147' : '255, 193, 7'}, 0.25)`,
        padding: '2px 8px',
        borderRadius: '8px',
        color,
        fontSize: '0.78rem',
        fontWeight: 'bold'
      }}>
        <Icon style={{ width: '12px', height: '12px' }} />
        {sign}{growth}%
      </span>
    );
  };

  // Helper for KPI color coding
  const getKpiColor = (growth) => {
    if (growth > 0) return '#25d366'; // Green = Improving
    if (growth < 0) return '#ff2e93'; // Red = Declining
    return '#ffc107'; // Yellow = Flat
  };

  return (
    <section className="page-shell admin-analytics-shell" style={{
      color: '#fff',
      paddingBottom: '6rem',
      maxWidth: '1280px',
      margin: '0 auto',
      height: '100%',
      overflowY: 'auto',
      width: '100%',
      boxSizing: 'border-box',
      display: 'block'
    }}>
      {/* Header bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2.5rem', gap: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn-quiet" style={{ minWidth: '40px', padding: '0 10px' }} onClick={() => navigate('/profile')}>
            <ArrowLeft style={{ width: '18px', height: '18px' }} />
          </button>
          <div>
            <span className="eyebrow" style={{ color: 'var(--pink)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }}>EXECUTIVE ROOM</span>
            <h1 style={{ margin: '0.1rem 0 0', font: '900 2.4rem Outfit, sans-serif', letterSpacing: '-0.02em', background: 'linear-gradient(135deg, #fff, var(--muted))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Instadate Health Dashboard 💓
            </h1>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn-quiet" style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => navigate('/admin/analytics')}>
            <BarChart2 style={{ width: '15px', height: '15px' }} /> Analytics
          </button>
          <button className="btn-main" style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={fetchHealthMetrics}>
            <RefreshCw style={{ width: '14px', height: '14px' }} /> Sync Health
          </button>
        </div>
      </div>

      {/* SECTION 8: ALERTS BOARD */}
      {alerts && alerts.length > 0 && (
        <div style={{ marginBottom: '2.5rem' }}>
          <h3 style={{ font: '800 1.1rem Outfit, sans-serif', color: '#ff2e93', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert style={{ width: '18px', height: '18px' }} /> ACTIVE OPERATIONAL ALERTS
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
            {alerts.map((alert, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  background: alert.type === 'danger' ? 'rgba(255, 46, 147, 0.06)' : alert.type === 'success' ? 'rgba(37, 211, 102, 0.06)' : 'rgba(255, 193, 7, 0.06)',
                  border: `1px solid ${alert.type === 'danger' ? 'rgba(255, 46, 147, 0.2)' : alert.type === 'success' ? 'rgba(37, 211, 102, 0.2)' : 'rgba(255, 193, 7, 0.2)'}`,
                  borderRadius: '16px',
                  padding: '1rem 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                {alert.type === 'danger' ? (
                  <XCircle style={{ width: '20px', height: '20px', color: '#ff2e93', flexShrink: 0 }} />
                ) : alert.type === 'success' ? (
                  <CheckCircle style={{ width: '20px', height: '20px', color: '#25d366', flexShrink: 0 }} />
                ) : (
                  <AlertTriangle style={{ width: '20px', height: '20px', color: '#ffc107', flexShrink: 0 }} />
                )}
                <span style={{
                  fontSize: '0.85rem',
                  fontWeight: '700',
                  color: alert.type === 'danger' ? '#ffa2d0' : alert.type === 'success' ? '#a5f7c3' : '#ffd877',
                  lineHeight: 1.4
                }}>
                  {alert.message}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* NORTH STAR METRIC PROMINENT BANNER */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(255, 46, 147, 0.08), rgba(155, 48, 255, 0.08))',
        border: '1px solid rgba(255, 46, 147, 0.2)',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(20px)',
        borderRadius: '24px',
        padding: '2rem',
        marginBottom: '2.5rem'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
              <Star style={{ width: '18px', height: '18px', color: '#ffc107', fill: '#ffc107' }} />
              <span style={{ fontSize: '0.9rem', fontWeight: '800', letterSpacing: '0.05em', color: 'var(--pink)', textTransform: 'uppercase' }}>
                Company North Star KPI
              </span>
            </div>
            <h2 style={{ font: '900 1.8rem Outfit, sans-serif', margin: 0 }}>
              Meetups Completed Per 100 Registered Users
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: '0.5rem 0 0 0', lineHeight: 1.4 }}>
              The definitive metric of real-world success: measuring how effectively we bring registered members offline to meet in person.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '20px', padding: '1rem' }}>
            {[
              { label: 'Today', key: 'daily' },
              { label: 'Weekly', key: 'weekly' },
              { label: 'Monthly', key: 'monthly' },
              { label: 'All Time', key: 'allTime' }
            ].map(item => {
              const val = connections.kpi[item.key];
              const kpiColor = getKpiColor(val.growth);
              return (
                <div key={item.key} style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ color: 'var(--muted)', fontSize: '0.75rem', fontWeight: 'bold' }}>{item.label}</span>
                  <span style={{ font: '900 1.4rem Outfit, sans-serif', color: kpiColor }}>{val.value}</span>
                  <div>{renderGrowthBadge(val.growth)}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* DYNAMIC FUNNEL CHART */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.01)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        borderRadius: '24px',
        padding: '2rem',
        marginBottom: '2.5rem'
      }}>
        <h3 style={{ font: '900 1.4rem Outfit, sans-serif', margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity style={{ width: '20px', height: '20px', color: 'var(--pink)' }} /> Behavioral Conversion Funnel
        </h3>
        
        {/* Funnel SVG Visualization */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {funnel.map((step, idx) => {
              const prevStep = idx > 0 ? funnel[idx - 1] : null;
              const widthPct = Math.max(20, 100 - idx * 8);
              return (
                <div key={step.name} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '180px', fontSize: '0.82rem', fontWeight: 'bold', color: 'var(--muted)', textAlign: 'right' }}>
                    {step.name}
                  </div>
                  <div style={{ flex: 1, background: 'rgba(255, 255, 255, 0.02)', borderRadius: '10px', overflow: 'hidden', height: '28px', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${widthPct}%` }}
                      style={{
                        height: '100%',
                        background: `linear-gradient(90deg, hsla(${330 - idx * 25}, 100%, 60%, 0.6), hsla(${280 - idx * 25}, 100%, 50%, 0.4))`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0 12px',
                        fontSize: '0.8rem',
                        fontWeight: '800'
                      }}
                    >
                      <span>{step.count.toLocaleString()}</span>
                      <span>{step.conversion}%</span>
                    </motion.div>
                  </div>
                  <div style={{ width: '80px', fontSize: '0.78rem', fontWeight: 'bold', color: step.dropoff > 20 ? '#ff2e93' : '#a5f7c3' }}>
                    {idx > 0 ? `-${step.dropoff}% drop` : 'Baseline'}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '20px',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: '1rem'
          }}>
            <h4 style={{ font: '800 1rem Outfit, sans-serif', margin: 0, color: 'var(--pink)' }}>Conversion Summary</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--muted)' }}>Registration to Profile Completion:</span>
                <span style={{ fontWeight: 'bold' }}>{funnel[1].conversion}%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--muted)' }}>Recommendations to Views:</span>
                <span style={{ fontWeight: 'bold' }}>{funnel[2].conversion}%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--muted)' }}>Match Request to Accepted:</span>
                <span style={{ fontWeight: 'bold' }}>{matchFunnel.acceptanceRate}%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--muted)' }}>Planned to Completed Meetups:</span>
                <span style={{ fontWeight: 'bold' }}>{connections.rate}%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--muted)' }}>Platform Would Meet Again:</span>
                <span style={{ fontWeight: 'bold' }}>{connections.wouldMeetAgain}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CORE SECTIONS GIRD */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', marginBottom: '2.5rem' }}>
        
        {/* SECTION 1: USER ACQUISITION & SECTION 2: PROFILE ACTIVATION */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.01)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: '24px',
          padding: '1.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem'
        }}>
          <div>
            <h3 style={{ font: '900 1.25rem Outfit, sans-serif', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users style={{ width: '18px', height: '18px', color: 'var(--cyan)' }} /> 1. USER ACQUISITION
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '10px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.03)' }}>
                <div style={{ fontSize: '0.74rem', color: 'var(--muted)', marginBottom: '4px' }}>Registered Today</div>
                <div style={{ font: '800 1.3rem Outfit, sans-serif' }}>{acquisition.today}</div>
                <div style={{ marginTop: '4px' }}>{renderGrowthBadge(acquisition.dailyGrowth)}</div>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '10px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.03)' }}>
                <div style={{ fontSize: '0.74rem', color: 'var(--muted)', marginBottom: '4px' }}>Registered Week</div>
                <div style={{ font: '800 1.3rem Outfit, sans-serif' }}>{acquisition.thisWeek}</div>
                <div style={{ marginTop: '4px' }}>{renderGrowthBadge(acquisition.weeklyGrowth)}</div>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '10px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.03)' }}>
                <div style={{ fontSize: '0.74rem', color: 'var(--muted)', marginBottom: '4px' }}>Registered Month</div>
                <div style={{ font: '800 1.3rem Outfit, sans-serif' }}>{acquisition.thisMonth}</div>
                <div style={{ marginTop: '4px' }}>{renderGrowthBadge(acquisition.monthlyGrowth)}</div>
              </div>
            </div>
          </div>

          <hr style={{ border: 'none', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', margin: 0 }} />

          <div>
            <h3 style={{ font: '900 1.25rem Outfit, sans-serif', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserCheck style={{ width: '18px', height: '18px', color: 'var(--pink)' }} /> 2. PROFILE ACTIVATION
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '10px', borderRadius: '12px' }}>
                <div style={{ fontSize: '0.74rem', color: 'var(--muted)' }}>Started</div>
                <div style={{ font: '800 1.25rem Outfit, sans-serif', marginTop: '4px' }}>{activation.started}</div>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '10px', borderRadius: '12px' }}>
                <div style={{ fontSize: '0.74rem', color: 'var(--muted)' }}>Completed</div>
                <div style={{ font: '800 1.25rem Outfit, sans-serif', marginTop: '4px' }}>{activation.completed}</div>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '10px', borderRadius: '12px' }}>
                <div style={{ fontSize: '0.74rem', color: 'var(--muted)' }}>Completion Time</div>
                <div style={{ font: '800 1.25rem Outfit, sans-serif', marginTop: '4px', color: '#ff2e93' }}>{activation.avgTime}</div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.04)', borderRadius: '12px', padding: '10px 16px' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--muted)', fontWeight: 'bold' }}>Global Activation Rate</span>
              <span style={{ fontSize: '1rem', fontWeight: '900', color: activation.rate >= 60 ? '#25d366' : '#ff2e93' }}>{activation.rate}%</span>
            </div>
          </div>
        </div>

        {/* SECTION 3: MATCH FUNNEL & SECTION 4: SUCCESS */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.01)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: '24px',
          padding: '1.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem'
        }}>
          <div>
            <h3 style={{ font: '900 1.25rem Outfit, sans-serif', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Flame style={{ width: '18px', height: '18px', color: '#ffc107' }} /> 3. MATCH FUNNEL INTEL
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '10px', borderRadius: '12px' }}>
                <div style={{ fontSize: '0.74rem', color: 'var(--muted)' }}>Recs Viewed</div>
                <div style={{ font: '800 1.25rem Outfit, sans-serif', marginTop: '4px' }}>{matchFunnel.recsViewed}</div>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '10px', borderRadius: '12px' }}>
                <div style={{ fontSize: '0.74rem', color: 'var(--muted)' }}>Requests Sent</div>
                <div style={{ font: '800 1.25rem Outfit, sans-serif', marginTop: '4px' }}>{matchFunnel.requestsSent}</div>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '10px', borderRadius: '12px' }}>
                <div style={{ fontSize: '0.74rem', color: 'var(--muted)' }}>Chats Started</div>
                <div style={{ font: '800 1.25rem Outfit, sans-serif', marginTop: '4px' }}>{matchFunnel.chatsStarted}</div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.04)', borderRadius: '12px', padding: '10px 16px' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--muted)', fontWeight: 'bold' }}>Match Acceptance Rate</span>
              <span style={{ fontSize: '1rem', fontWeight: '900', color: matchFunnel.acceptanceRate >= 20 ? '#25d366' : '#ff2e93' }}>{matchFunnel.acceptanceRate}%</span>
            </div>
          </div>

          <hr style={{ border: 'none', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', margin: 0 }} />

          <div>
            <h3 style={{ font: '900 1.25rem Outfit, sans-serif', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award style={{ width: '18px', height: '18px', color: '#25d366' }} /> 4. REAL WORLD CONNECTIONS
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '10px', borderRadius: '12px' }}>
                <div style={{ fontSize: '0.74rem', color: 'var(--muted)' }}>Meetups Planned</div>
                <div style={{ font: '800 1.25rem Outfit, sans-serif', marginTop: '4px' }}>{connections.planned}</div>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '10px', borderRadius: '12px' }}>
                <div style={{ fontSize: '0.74rem', color: 'var(--muted)' }}>Meetups Completed</div>
                <div style={{ font: '800 1.25rem Outfit, sans-serif', marginTop: '4px', color: '#25d366' }}>{connections.completed}</div>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '10px', borderRadius: '12px' }}>
                <div style={{ fontSize: '0.74rem', color: 'var(--muted)' }}>Would Meet Again</div>
                <div style={{ font: '800 1.25rem Outfit, sans-serif', marginTop: '4px', color: '#ff2e93' }}>{connections.wouldMeetAgain}%</div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(37, 211, 102, 0.04)', border: '1px solid rgba(37, 211, 102, 0.15)', borderRadius: '12px', padding: '10px 16px' }}>
              <span style={{ fontSize: '0.82rem', color: '#a5f7c3', fontWeight: 'bold' }}>Offline Meetup Completion Rate</span>
              <span style={{ fontSize: '1rem', fontWeight: '900', color: connections.rate >= 40 ? '#25d366' : '#ff2e93' }}>{connections.rate}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 5: TRUST HEALTH */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.01)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        borderRadius: '24px',
        padding: '2rem',
        marginBottom: '2.5rem'
      }}>
        <h3 style={{ font: '900 1.4rem Outfit, sans-serif', margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck style={{ width: '20px', height: '20px', color: 'var(--cyan)' }} /> 5. TRUST & SAFETY HEALTH
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1.25rem', borderRadius: '18px', border: '1px solid rgba(255, 255, 255, 0.03)' }}>
            <span style={{ color: 'var(--muted)', fontSize: '0.78rem', fontWeight: 'bold' }}>Average Reliability Score</span>
            <h4 style={{ font: '800 1.8rem Outfit, sans-serif', margin: '0.25rem 0 0 0', color: 'var(--cyan)' }}>{trust.attendanceRate}</h4>
          </div>
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1.25rem', borderRadius: '18px', border: '1px solid rgba(255, 255, 255, 0.03)' }}>
            <span style={{ color: 'var(--muted)', fontSize: '0.78rem', fontWeight: 'bold' }}>Platform No Show %</span>
            <h4 style={{ font: '800 1.8rem Outfit, sans-serif', margin: '0.25rem 0 0 0', color: trust.noShowRate > 20 ? '#ff2e93' : '#25d366' }}>{trust.noShowRate}%</h4>
          </div>
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1.25rem', borderRadius: '18px', border: '1px solid rgba(255, 255, 255, 0.03)' }}>
            <span style={{ color: 'var(--muted)', fontSize: '0.78rem', fontWeight: 'bold' }}>Aadhaar Verified Members</span>
            <h4 style={{ font: '800 1.8rem Outfit, sans-serif', margin: '0.25rem 0 0 0', color: 'var(--pink)' }}>{trust.verifiedRate}%</h4>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
          <div>
            <h4 style={{ font: '800 1rem Outfit, sans-serif', color: '#25d366', margin: '0 0 0.75rem 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle style={{ width: '16px', height: '16px' }} /> Top Elite Reliable Members
            </h4>
            <div style={{ background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.03)', borderRadius: '16px', overflow: 'hidden' }}>
              {trust.topReliable.length === 0 ? (
                <div style={{ padding: '1rem', color: 'var(--muted)', textAlign: 'center', fontSize: '0.8rem' }}>No telemetry data yet</div>
              ) : trust.topReliable.map((member, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: i < 4 ? '1px solid rgba(255, 255, 255, 0.03)' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <MemberAvatar avatarUrl={member.avatar_url} fullName={member.full_name} size={28} />
                    <span style={{ fontSize: '0.84rem', fontWeight: 'bold' }}>{member.full_name}</span>
                  </div>
                  <span style={{ fontSize: '0.82rem', fontWeight: '900', color: '#25d366' }}>{member.trust_score} Score</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 style={{ font: '800 1rem Outfit, sans-serif', color: '#ff2e93', margin: '0 0 0.75rem 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <XCircle style={{ width: '16px', height: '16px' }} /> Lowest Reliability Members
            </h4>
            <div style={{ background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.03)', borderRadius: '16px', overflow: 'hidden' }}>
              {trust.lowestReliable.length === 0 ? (
                <div style={{ padding: '1rem', color: 'var(--muted)', textAlign: 'center', fontSize: '0.8rem' }}>No telemetry data yet</div>
              ) : trust.lowestReliable.map((member, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: i < 4 ? '1px solid rgba(255, 255, 255, 0.03)' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <MemberAvatar avatarUrl={member.avatar_url} fullName={member.full_name} size={28} />
                    <span style={{ fontSize: '0.84rem', fontWeight: 'bold' }}>{member.full_name}</span>
                  </div>
                  <span style={{ fontSize: '0.82rem', fontWeight: '900', color: '#ff2e93' }}>{member.trust_score} Score</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 6: EVENT HEALTH */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.01)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        borderRadius: '24px',
        padding: '2rem',
        marginBottom: '2.5rem'
      }}>
        <h3 style={{ font: '900 1.4rem Outfit, sans-serif', margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar style={{ width: '20px', height: '20px', color: 'var(--pink)' }} /> 6. MIXERS & EVENTS HEALTH
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '14px' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Events Created</div>
            <div style={{ font: '800 1.5rem Outfit, sans-serif', marginTop: '4px' }}>{events.created}</div>
          </div>
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '14px' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Mixers RSVPs</div>
            <div style={{ font: '800 1.5rem Outfit, sans-serif', marginTop: '4px' }}>{events.rsvps}</div>
          </div>
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '14px' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Mixers Attendance %</div>
            <div style={{ font: '800 1.5rem Outfit, sans-serif', marginTop: '4px', color: '#25d366' }}>{events.rate}%</div>
          </div>
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '14px' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Average Event Rating</div>
            <div style={{ font: '800 1.5rem Outfit, sans-serif', marginTop: '4px', color: '#ffc107', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Star style={{ width: '18px', height: '18px', fill: '#ffc107' }} />
              {events.avgEventRating > 0 ? events.avgEventRating : 'N/A'}
            </div>
          </div>
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '14px' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Average Host Rating</div>
            <div style={{ font: '800 1.5rem Outfit, sans-serif', marginTop: '4px', color: '#ffc107', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Star style={{ width: '18px', height: '18px', fill: '#ffc107' }} />
              {events.avgHostRating > 0 ? events.avgHostRating : 'N/A'}
            </div>
          </div>
        </div>

        {/* Top/Worst tables */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <div>
            <h4 style={{ font: '800 0.94rem Outfit, sans-serif', color: '#25d366', marginBottom: '0.5rem' }}>Top Events</h4>
            <div style={{ background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.03)', borderRadius: '12px', padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {events.topEvents.length === 0 ? (
                <div style={{ color: 'var(--muted)', fontSize: '0.78rem', padding: '6px' }}>No mixer reviews yet</div>
              ) : events.topEvents.map((e, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                  <span style={{ color: '#fff', fontWeight: 'bold' }}>{e.title}</span>
                  <span style={{ color: '#ffc107', fontWeight: '900' }}>★ {e.avg_rating}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 style={{ font: '800 0.94rem Outfit, sans-serif', color: '#ff2e93', marginBottom: '0.5rem' }}>Worst Events</h4>
            <div style={{ background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.03)', borderRadius: '12px', padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {events.worstEvents.length === 0 ? (
                <div style={{ color: 'var(--muted)', fontSize: '0.78rem', padding: '6px' }}>No mixer reviews yet</div>
              ) : events.worstEvents.map((e, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                  <span style={{ color: '#fff', fontWeight: 'bold' }}>{e.title}</span>
                  <span style={{ color: '#ff2e93', fontWeight: '900' }}>★ {e.avg_rating}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 style={{ font: '800 0.94rem Outfit, sans-serif', color: '#25d366', marginBottom: '0.5rem' }}>Top Hosts</h4>
            <div style={{ background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.03)', borderRadius: '12px', padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {events.topHosts.length === 0 ? (
                <div style={{ color: 'var(--muted)', fontSize: '0.78rem', padding: '6px' }}>No host reviews yet</div>
              ) : events.topHosts.map((h, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                  <span style={{ color: '#fff', fontWeight: 'bold' }}>{h.full_name}</span>
                  <span style={{ color: '#ffc107', fontWeight: '900' }}>★ {h.avg_rating}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 style={{ font: '800 0.94rem Outfit, sans-serif', color: '#ff2e93', marginBottom: '0.5rem' }}>Worst Hosts</h4>
            <div style={{ background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.03)', borderRadius: '12px', padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {events.worstHosts.length === 0 ? (
                <div style={{ color: 'var(--muted)', fontSize: '0.78rem', padding: '6px' }}>No host reviews yet</div>
              ) : events.worstHosts.map((h, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                  <span style={{ color: '#fff', fontWeight: 'bold' }}>{h.full_name}</span>
                  <span style={{ color: '#ff2e93', fontWeight: '900' }}>★ {h.avg_rating}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 7: RECOMMENDATION SOURCE PERFORMANCE */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.01)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        borderRadius: '24px',
        padding: '2rem',
        marginBottom: '1rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ font: '900 1.4rem Outfit, sans-serif', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Compass style={{ width: '20px', height: '20px', color: 'var(--cyan)' }} /> 7. RECOMMENDATION ENGINE HEALTH
            </h3>
            <p style={{ color: 'var(--muted)', fontSize: '0.8rem', margin: '4px 0 0 0' }}>
              CTR, match conversions, and offline meetup rates across recommendation categories
            </p>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: 'var(--muted)', fontSize: '0.8rem', fontWeight: 'bold' }}>
                <th style={{ padding: '12px 8px' }}>Recommendation Category</th>
                <th style={{ padding: '12px 8px' }}>Impressions</th>
                <th style={{ padding: '12px 8px' }}>Clicks</th>
                <th style={{ padding: '12px 8px' }}>Click-Through Rate (CTR)</th>
                <th style={{ padding: '12px 8px' }}>Match Request Rate</th>
                <th style={{ padding: '12px 8px' }}>Acceptance Rate</th>
                <th style={{ padding: '12px 8px' }}>Meetup Completed Rate</th>
              </tr>
            </thead>
            <tbody>
              {recommendationPerformance.map((row) => (
                <tr key={row.source} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)', fontSize: '0.85rem' }}>
                  <td style={{ padding: '14px 8px', fontWeight: 'bold', color: 'var(--pink)' }}>{row.source}</td>
                  <td style={{ padding: '14px 8px' }}>{row.impressions.toLocaleString()}</td>
                  <td style={{ padding: '14px 8px' }}>{row.clicks.toLocaleString()}</td>
                  <td style={{ padding: '14px 8px', fontWeight: 'bold', color: row.ctr >= 15 ? '#25d366' : '#ffc107' }}>
                    {row.ctr}%
                  </td>
                  <td style={{ padding: '14px 8px' }}>{row.requestRate}%</td>
                  <td style={{ padding: '14px 8px' }}>{row.acceptRate}%</td>
                  <td style={{ padding: '14px 8px', fontWeight: 'bold', color: '#a5f7c3' }}>{row.meetupRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
