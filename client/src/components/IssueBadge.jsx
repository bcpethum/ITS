/**
 * IssueBadge — Colored pill chip for status, priority, or type values.
 * Tailwind v4: layout via utilities, colors via inline style vars.
 */

// Base pill classes shared by every badge
const BASE = 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-wide whitespace-nowrap border leading-none';

const STATUS_CONFIG = {
  'open':        { label: 'Open',        icon: '🔵', color: '#6C63FF',  bg: 'rgba(108,99,255,0.15)',  border: 'rgba(108,99,255,0.3)'  },
  'in-progress': { label: 'In Progress', icon: '🟡', color: '#F7B731',  bg: 'rgba(247,183,49,0.15)',  border: 'rgba(247,183,49,0.3)'  },
  'resolved':    { label: 'Resolved',    icon: '🟢', color: '#00D9C0',  bg: 'rgba(0,217,192,0.12)',   border: 'rgba(0,217,192,0.3)'   },
  'closed':      { label: 'Closed',      icon: '⚫', color: '#636E86',  bg: 'rgba(99,110,134,0.15)',  border: 'rgba(99,110,134,0.25)' },
};

const PRIORITY_CONFIG = {
  'low':      { label: 'Low',      icon: '↓',  color: '#26de81', bg: 'rgba(38,222,129,0.12)',  border: 'rgba(38,222,129,0.25)'  },
  'medium':   { label: 'Medium',   icon: '→',  color: '#F7B731', bg: 'rgba(247,183,49,0.12)',  border: 'rgba(247,183,49,0.25)'  },
  'high':     { label: 'High',     icon: '↑',  color: '#FF6B6B', bg: 'rgba(255,107,107,0.12)', border: 'rgba(255,107,107,0.25)' },
  'critical': { label: 'Critical', icon: '🔥', color: '#FF4757', bg: 'rgba(255,71,87,0.12)',   border: 'rgba(255,71,87,0.3)'    },
};

const TYPE_CONFIG = {
  'bug':         { label: 'Bug',         icon: '🐛', color: '#FF6B6B', bg: 'rgba(255,107,107,0.10)', border: 'rgba(255,107,107,0.22)' },
  'feature':     { label: 'Feature',     icon: '✨', color: '#00D9C0', bg: 'rgba(0,217,192,0.10)',   border: 'rgba(0,217,192,0.22)'   },
  'task':        { label: 'Task',        icon: '✅', color: '#6C63FF', bg: 'rgba(108,99,255,0.10)',  border: 'rgba(108,99,255,0.22)'  },
  'improvement': { label: 'Improvement', icon: '⚡', color: '#a29bfe', bg: 'rgba(162,155,254,0.12)', border: 'rgba(162,155,254,0.25)' },
};

const CONFIGS = { status: STATUS_CONFIG, priority: PRIORITY_CONFIG, type: TYPE_CONFIG };

export default function IssueBadge({ kind, value }) {
  const cfg = CONFIGS[kind]?.[value];
  if (!cfg) {
    return (
      <span
        className={BASE}
        style={{ color: '#636E86', background: 'rgba(99,110,134,0.10)', borderColor: 'rgba(99,110,134,0.2)' }}
      >
        {value || '—'}
      </span>
    );
  }
  return (
    <span
      className={BASE}
      style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}
    >
      <span className="text-[10px] leading-none">{cfg.icon}</span>
      {cfg.label}
    </span>
  );
}

export { STATUS_CONFIG, PRIORITY_CONFIG, TYPE_CONFIG };
