import {
  Circle, Clock, CheckCircle2, XCircle,
  Flame, ChevronsUp, Minus, ChevronsDown,
  Bug, Sparkles, CheckSquare, Zap,
} from 'lucide-react';

/**
 * IssueBadge — Reusable status / priority / type chip with Lucide icons.
 */

const BASE = 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-wide whitespace-nowrap border leading-none';

const STATUS_CONFIG = {
  'open':        { label: 'Open',        Icon: Circle,       color: '#6C63FF', bg: 'rgba(108,99,255,0.15)',  border: 'rgba(108,99,255,0.3)'  },
  'in-progress': { label: 'In Progress', Icon: Clock,        color: '#F7B731', bg: 'rgba(247,183,49,0.15)',  border: 'rgba(247,183,49,0.3)'  },
  'resolved':    { label: 'Resolved',    Icon: CheckCircle2, color: '#00D9C0', bg: 'rgba(0,217,192,0.12)',   border: 'rgba(0,217,192,0.3)'   },
  'closed':      { label: 'Closed',      Icon: XCircle,      color: '#636E86', bg: 'rgba(99,110,134,0.15)',  border: 'rgba(99,110,134,0.25)' },
};

const PRIORITY_CONFIG = {
  'low':      { label: 'Low',      Icon: ChevronsDown, color: '#26de81', bg: 'rgba(38,222,129,0.12)',  border: 'rgba(38,222,129,0.25)'  },
  'medium':   { label: 'Medium',   Icon: Minus,        color: '#F7B731', bg: 'rgba(247,183,49,0.12)',  border: 'rgba(247,183,49,0.25)'  },
  'high':     { label: 'High',     Icon: ChevronsUp,   color: '#FF6B6B', bg: 'rgba(255,107,107,0.12)', border: 'rgba(255,107,107,0.25)' },
  'critical': { label: 'Critical', Icon: Flame,        color: '#FF4757', bg: 'rgba(255,71,87,0.12)',   border: 'rgba(255,71,87,0.3)'    },
};

const TYPE_CONFIG = {
  'bug':         { label: 'Bug',         Icon: Bug,         color: '#FF6B6B', bg: 'rgba(255,107,107,0.10)', border: 'rgba(255,107,107,0.22)' },
  'feature':     { label: 'Feature',     Icon: Sparkles,    color: '#00D9C0', bg: 'rgba(0,217,192,0.10)',   border: 'rgba(0,217,192,0.22)'   },
  'task':        { label: 'Task',        Icon: CheckSquare, color: '#6C63FF', bg: 'rgba(108,99,255,0.10)',  border: 'rgba(108,99,255,0.22)'  },
  'improvement': { label: 'Improvement', Icon: Zap,         color: '#a29bfe', bg: 'rgba(162,155,254,0.12)', border: 'rgba(162,155,254,0.25)' },
};

const CONFIGS = { status: STATUS_CONFIG, priority: PRIORITY_CONFIG, type: TYPE_CONFIG };

export default function IssueBadge({ kind, value }) {
  const cfg = CONFIGS[kind]?.[value];
  if (!cfg) {
    return (
      <span className={BASE} style={{ color: '#636E86', background: 'rgba(99,110,134,0.10)', borderColor: 'rgba(99,110,134,0.2)' }}>
        {value || '—'}
      </span>
    );
  }
  const { Icon } = cfg;
  return (
    <span className={BASE} style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}>
      <Icon size={10} strokeWidth={2.5} />
      {cfg.label}
    </span>
  );
}

export { STATUS_CONFIG, PRIORITY_CONFIG, TYPE_CONFIG };
