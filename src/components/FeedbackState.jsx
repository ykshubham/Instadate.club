import React from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles, Heart, MessageSquare, Calendar, Bell, Users, RefreshCw, AlertTriangle
} from 'lucide-react';

/**
 * Modern glassmorphic Empty State component with targeted illustrations & actions
 */
export function EmptyState({ type, title, description, actionText, onAction }) {
  const containerVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.45, ease: 'easeOut' }
    }
  };

  const getIllustration = () => {
    switch (type) {
      case 'discovery':
        return (
          <div className="empty-illustration-wrapper" style={{ background: 'rgba(255, 46, 147, 0.08)' }}>
            <Sparkles style={{ width: 28, height: 28, color: '#ff2e93' }} />
          </div>
        );
      case 'chat':
        return (
          <div className="empty-illustration-wrapper" style={{ background: 'rgba(0, 224, 255, 0.08)' }}>
            <MessageSquare style={{ width: 28, height: 28, color: '#00e0ff' }} />
          </div>
        );
      case 'events':
        return (
          <div className="empty-illustration-wrapper" style={{ background: 'rgba(251, 191, 36, 0.08)' }}>
            <Calendar style={{ width: 28, height: 28, color: '#fbbf24' }} />
          </div>
        );
      case 'notifications':
        return (
          <div className="empty-illustration-wrapper" style={{ background: 'rgba(168, 85, 247, 0.08)' }}>
            <Bell style={{ width: 28, height: 28, color: '#a855f7' }} />
          </div>
        );
      case 'connections':
      default:
        return (
          <div className="empty-illustration-wrapper" style={{ background: 'rgba(34, 211, 238, 0.08)' }}>
            <Users style={{ width: 28, height: 28, color: '#22d3ee' }} />
          </div>
        );
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{
        textAlign: 'center',
        padding: '3.5rem 1.5rem',
        background: 'rgba(14, 14, 20, 0.45)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: '24px',
        boxShadow: '0 12px 40px rgba(0,0,0,0.3)',
        maxWidth: '500px',
        margin: '1.5rem auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem',
        boxSizing: 'border-box'
      }}
    >
      {getIllustration()}
      
      <div style={{ marginTop: '0.25rem' }}>
        <h3 style={{
          margin: '0 0 0.4rem',
          color: '#fff',
          font: '800 1.25rem Outfit, sans-serif',
          letterSpacing: '-0.01em'
        }}>
          {title}
        </h3>
        <p style={{
          margin: 0,
          color: 'var(--muted)',
          fontSize: '0.86rem',
          lineHeight: '1.45',
          maxWidth: '380px'
        }}>
          {description}
        </p>
      </div>

      {actionText && onAction && (
        <button
          onClick={onAction}
          className="btn-main"
          style={{
            marginTop: '0.5rem',
            minHeight: '42px',
            fontSize: '0.84rem',
            fontWeight: 700,
            padding: '0 1.5rem',
            background: 'linear-gradient(135deg, #ff2e93, #ff758f)',
            border: 0,
            borderRadius: '14px',
            color: '#fff',
            cursor: 'pointer',
            boxShadow: '0 6px 20px rgba(255, 46, 147, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease'
          }}
        >
          {actionText}
        </button>
      )}
    </motion.div>
  );
}

/**
 * Reusable loading skeletons for premium layouts
 */
export function Skeleton({ type, count = 4 }) {
  const renderGridShimmer = (idx) => (
    <div
      key={`shimmer-grid-${idx}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.6rem',
        padding: '1.25rem',
        background: 'rgba(14, 14, 20, 0.72)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '24px',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div className="shimmer-effect-bar" />
      <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', margin: '0 auto' }} />
      <div style={{ height: '18px', width: '60%', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', margin: '0.5rem auto' }} />
      <div style={{ height: '14px', width: '40%', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', margin: '0 auto' }} />
      <div style={{ height: '12px', width: '90%', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', marginTop: '0.5rem' }} />
      <div style={{ height: '40px', width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', marginTop: 'auto' }} />
    </div>
  );

  const renderListShimmer = (idx) => (
    <div
      key={`shimmer-list-${idx}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        padding: '1rem',
        background: 'rgba(14, 14, 20, 0.5)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: '16px',
        marginBottom: '0.75rem',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div className="shimmer-effect-bar" />
      <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(255,255,255,0.05)' }} />
      <div style={{ flex: 1 }}>
        <div style={{ height: '16px', width: '45%', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', marginBottom: '6px' }} />
        <div style={{ height: '12px', width: '70%', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }} />
      </div>
      <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
    </div>
  );

  const renderChatShimmer = (idx) => (
    <div
      key={`shimmer-chat-${idx}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        padding: '1rem 1.25rem',
        background: 'rgba(14, 14, 20, 0.5)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: '20px',
        marginBottom: '0.75rem',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div className="shimmer-effect-bar" />
      <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
      <div style={{ flex: 1 }}>
        <div style={{ height: '18px', width: '35%', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', marginBottom: '8px' }} />
        <div style={{ height: '14px', width: '60%', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }} />
      </div>
      <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
    </div>
  );

  return (
    <>
      {Array.from({ length: count }).map((_, idx) => {
        if (type === 'grid') return renderGridShimmer(idx);
        if (type === 'chat') return renderChatShimmer(idx);
        return renderListShimmer(idx);
      })}
    </>
  );
}

/**
 * Standardized premium error state with recovery retry actions
 */
export function ErrorState({ message, onRetry }) {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '3rem 1.5rem',
        background: 'rgba(255, 46, 147, 0.03)',
        border: '1px solid rgba(255, 46, 147, 0.15)',
        borderRadius: '24px',
        maxWidth: '480px',
        margin: '2rem auto',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.85rem'
      }}
    >
      <div style={{
        width: '50px',
        height: '50px',
        borderRadius: '50%',
        background: 'rgba(255, 46, 147, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#ff2e93',
        marginBottom: '0.25rem'
      }}>
        <AlertTriangle style={{ width: 24, height: 24 }} />
      </div>
      
      <div>
        <h3 style={{ margin: '0 0 0.25rem', color: '#fff', font: '800 1.2rem Outfit, sans-serif' }}>
          Something went wrong
        </h3>
        <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.84rem', lineHeight: '1.4' }}>
          {message || 'A transient connection problem occurred. Please check your connection and retry.'}
        </p>
      </div>

      {onRetry && (
        <button
          onClick={onRetry}
          className="btn-quiet"
          style={{
            marginTop: '0.4rem',
            minHeight: '38px',
            fontSize: '0.82rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '0 1.25rem'
          }}
        >
          <RefreshCw style={{ width: 14, height: 14 }} /> Retry Request
        </button>
      )}
    </div>
  );
}
