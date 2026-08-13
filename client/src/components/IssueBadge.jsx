/**
 * IssueBadge — Reusable colored chip for status, priority, or type values.
 *
 * Usage:
 *   <IssueBadge kind="status"   value="open"     />
 *   <IssueBadge kind="priority" value="critical"  />
 *   <IssueBadge kind="type"     value="bug"       />
 */

const STATUS_CONFIG = {
  'open':        { label: 'Open',        icon: '🔵', className: 'badge-status-open'        },
  'in-progress': { label: 'In Progress', icon: '🟡', className: 'badge-status-in-progress' },
  'resolved':    { label: 'Resolved',    icon: '🟢', className: 'badge-status-resolved'    },
  'closed':      { label: 'Closed',      icon: '⚫', className: 'badge-status-closed'      },
};

const PRIORITY_CONFIG = {
  'low':      { label: 'Low',      icon: '↓',  className: 'badge-priority-low'      },
  'medium':   { label: 'Medium',   icon: '→',  className: 'badge-priority-medium'   },
  'high':     { label: 'High',     icon: '↑',  className: 'badge-priority-high'     },
  'critical': { label: 'Critical', icon: '🔥', className: 'badge-priority-critical' },
};

const TYPE_CONFIG = {
  'bug':         { label: 'Bug',         icon: '🐛', className: 'badge-type-bug'         },
  'feature':     { label: 'Feature',     icon: '✨', className: 'badge-type-feature'     },
  'task':        { label: 'Task',        icon: '✅', className: 'badge-type-task'        },
  'improvement': { label: 'Improvement', icon: '⚡', className: 'badge-type-improvement' },
};

const CONFIGS = { status: STATUS_CONFIG, priority: PRIORITY_CONFIG, type: TYPE_CONFIG };

export default function IssueBadge({ kind, value }) {
  const config = CONFIGS[kind]?.[value];
  if (!config) {
    return <span className="badge-ghost">{value || '—'}</span>;
  }
  return (
    <span className={config.className}>
      <span className="badge-icon">{config.icon}</span>
      {config.label}
    </span>
  );
}

// Export configs for use in filter dropdowns
export { STATUS_CONFIG, PRIORITY_CONFIG, TYPE_CONFIG };
