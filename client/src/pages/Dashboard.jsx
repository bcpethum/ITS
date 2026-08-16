import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { issueAPI } from '../services/api';
import IssueBadge from '../components/IssueBadge';
import IssueModal from '../components/IssueModal';
import {
  Plus, Clock, CheckCircle2, Flame, Bug,
  LayoutList, CircleDot, ChevronsUp, Minus, ChevronsDown, Sparkles, CheckSquare, Zap,
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate  = useNavigate();

  const [stats,        setStats]        = useState(null);
  const [recentIssues, setRecentIssues] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [modalOpen,    setModalOpen]    = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, issuesRes] = await Promise.all([
        issueAPI.getStats(),
        issueAPI.getAll({ limit: 6, page: 1 }),
      ]);
      setStats(statsRes.data.data);
      setRecentIssues(issuesRes.data.data.issues);
    } catch { /* non-critical */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const statCards = stats ? [
    { id: 'stat-total',       label: 'Total Issues', value: stats.total,                          Icon: LayoutList,   color: '#6C63FF' },
    { id: 'stat-open',        label: 'Open',         value: stats.byStatus?.open || 0,             Icon: CircleDot,    color: '#6C63FF' },
    { id: 'stat-in-progress', label: 'In Progress',  value: stats.byStatus?.['in-progress'] || 0, Icon: Clock,        color: '#F7B731' },
    { id: 'stat-resolved',    label: 'Resolved',     value: stats.byStatus?.resolved || 0,         Icon: CheckCircle2, color: '#00D9C0' },
    { id: 'stat-critical',    label: 'Critical',     value: stats.byPriority?.critical || 0,       Icon: Flame,        color: '#FF4757' },
    { id: 'stat-bugs',        label: 'Bugs',         value: stats.byType?.bug || 0,                Icon: Bug,          color: '#FF6B6B' },
  ] : [];

  const priorityRows = [
    { key: 'critical', label: 'Critical', Icon: Flame,        color: '#FF4757' },
    { key: 'high',     label: 'High',     Icon: ChevronsUp,   color: '#FF6B6B' },
    { key: 'medium',   label: 'Medium',   Icon: Minus,        color: '#F7B731' },
    { key: 'low',      label: 'Low',      Icon: ChevronsDown, color: '#26de81' },
  ];

  const typeChips = [
    { key: 'bug',         label: 'Bugs',         Icon: Bug         },
    { key: 'feature',     label: 'Features',     Icon: Sparkles    },
    { key: 'task',        label: 'Tasks',         Icon: CheckSquare },
    { key: 'improvement', label: 'Improvements', Icon: Zap         },
  ];

  const quickActions = [
    { id: 'qa-create',   label: 'New Issue',   Icon: Plus,         to: null,                        onClick: () => setModalOpen(true) },
    { id: 'qa-open',     label: 'Open',        Icon: CircleDot,    to: '/issues?status=open',       onClick: null },
    { id: 'qa-critical', label: 'Critical',    Icon: Flame,        to: '/issues?priority=critical', onClick: null },
    { id: 'qa-bugs',     label: 'All Bugs',    Icon: Bug,          to: '/issues?type=bug',          onClick: null },
    { id: 'qa-progress', label: 'In Progress', Icon: Clock,        to: '/issues?status=in-progress',onClick: null },
    { id: 'qa-resolved', label: 'Resolved',    Icon: CheckCircle2, to: '/issues?status=resolved',   onClick: null },
  ];

  const StatSkeleton = () => (
    <div className="rounded-xl border border-edge bg-surface p-5">
      <div className="skeleton mb-3 h-8 w-8 rounded-lg" />
      <div className="skeleton mb-2 h-3 w-3/5 rounded" />
      <div className="skeleton h-7 w-2/5 rounded" />
    </div>
  );

  const RecentSkeleton = () => (
    <div className="flex items-center justify-between gap-4 border-b border-edge py-3 last:border-0">
      <div className="flex flex-1 flex-col gap-1.5">
        <div className="skeleton h-3 w-3/4 rounded" />
        <div className="flex gap-1.5"><div className="skeleton h-4 w-14 rounded-full" /><div className="skeleton h-4 w-12 rounded-full" /></div>
      </div>
      <div className="skeleton h-3 w-16 rounded" />
    </div>
  );

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-8 animate-fadeIn">

      {/* Header */}
      <div className="mb-7">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">
          Welcome back, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="mt-1 text-sm text-ink-2">Here&apos;s what&apos;s happening with your project today.</p>
      </div>

      {/* Stat Cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <StatSkeleton key={i} />)
          : statCards.map(({ id, label, value, Icon, color }) => (
              <div key={id} id={id}
                className="group relative overflow-hidden rounded-xl border border-edge bg-surface p-5 shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:border-edge-hover hover:shadow-lg cursor-default">
                <div className="absolute inset-x-0 top-0 h-[3px] opacity-70 transition-opacity group-hover:opacity-100 rounded-t-xl" style={{ background: color }} />
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: `${color}18` }}>
                  <Icon size={18} strokeWidth={1.75} style={{ color }} />
                </div>
                <div className="mb-0.5 text-[11px] font-semibold uppercase tracking-widest text-ink-3">{label}</div>
                <div className="text-2xl font-extrabold tracking-tight text-ink">{value}</div>
              </div>
            ))
        }
      </div>

      {/* Main 2-col row */}
      <div className="mb-5 grid grid-cols-1 gap-5 xl:grid-cols-[1fr_320px]">

        {/* Recent Issues */}
        <div className="rounded-xl border border-edge bg-surface p-5 shadow-md">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-bold text-ink">
              <Clock size={16} strokeWidth={2} className="text-ink-3" /> Recent Issues
            </h2>
            <Link to="/issues" className="text-xs font-medium text-ink-2 hover:text-primary transition-colors no-underline">
              View All →
            </Link>
          </div>

          {loading ? (
            Array.from({ length: 5 }).map((_, i) => <RecentSkeleton key={i} />)
          ) : recentIssues.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <LayoutList size={32} strokeWidth={1} className="text-ink-3" />
              <p className="text-sm text-ink-2">No issues yet. <button onClick={() => setModalOpen(true)} className="text-primary font-medium underline cursor-pointer">Create one!</button></p>
            </div>
          ) : (
            <div>
              {recentIssues.map((issue) => (
                <div key={issue._id} onClick={() => navigate(`/issues/${issue._id}`)}
                  className="flex cursor-pointer items-start justify-between gap-4 rounded-lg px-2 py-2.5 transition-all hover:bg-subtle border-b border-edge last:border-0">
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="truncate text-sm font-medium text-ink">{issue.title}</span>
                    <div className="flex flex-wrap gap-1.5">
                      <IssueBadge kind="status"   value={issue.status}   />
                      <IssueBadge kind="priority" value={issue.priority} />
                      <IssueBadge kind="type"     value={issue.type}     />
                    </div>
                  </div>
                  <span className="shrink-0 text-[11px] text-ink-3 mt-1">{new Date(issue.createdAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className="flex flex-col gap-5">

          {/* Priority Breakdown */}
          <div className="rounded-xl border border-edge bg-surface p-5 shadow-md">
            <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-ink">
              <ChevronsUp size={16} strokeWidth={2} className="text-ink-3" /> By Priority
            </h2>
            <div className="flex flex-col gap-3">
              {priorityRows.map(({ key, label, Icon, color }) => {
                const count   = stats?.byPriority?.[key] || 0;
                const percent = stats?.total ? Math.round((count / stats.total) * 100) : 0;
                return loading ? (
                  <div key={key} className="flex items-center gap-3">
                    <div className="skeleton h-3 w-16 rounded" />
                    <div className="skeleton flex-1 h-2 rounded-full" />
                    <div className="skeleton h-3 w-5 rounded" />
                  </div>
                ) : (
                  <div key={key} className="flex items-center gap-2">
                    <Icon size={13} strokeWidth={2} style={{ color }} className="shrink-0" />
                    <span className="w-14 shrink-0 text-xs font-semibold text-ink-2">{label}</span>
                    <div className="flex-1 h-2 overflow-hidden rounded-full bg-subtle">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${percent}%`, background: color, minWidth: count > 0 ? 4 : 0 }} />
                    </div>
                    <span className="w-6 text-right text-xs font-bold text-ink-2">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Type Breakdown */}
          <div className="rounded-xl border border-edge bg-surface p-5 shadow-md">
            <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-ink">
              <Bug size={16} strokeWidth={2} className="text-ink-3" /> By Type
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {typeChips.map(({ key, label, Icon }) => (
                loading ? (
                  <div key={key} className="skeleton h-16 rounded-lg" />
                ) : (
                  <div key={key} className="flex flex-col items-center gap-1.5 rounded-lg border border-edge bg-elevated/40 py-3 px-2 transition-all hover:border-edge-hover hover:bg-subtle cursor-default">
                    <Icon size={18} strokeWidth={1.75} className="text-ink-2" />
                    <span className="text-xl font-extrabold tracking-tight text-ink">{stats?.byType?.[key] || 0}</span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-3">{label}</span>
                  </div>
                )
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-ink-3">Quick Actions</h2>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {quickActions.map(({ id, label, Icon, to, onClick }) => {
            const cls = 'group flex flex-col items-center gap-2 rounded-xl border border-edge bg-surface px-3 py-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary hover:shadow-lg hover:shadow-primary/10 cursor-pointer no-underline';
            const inner = (
              <>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-elevated transition-all group-hover:bg-primary/10">
                  <Icon size={18} strokeWidth={1.75} className="text-ink-2 transition-colors group-hover:text-primary" />
                </div>
                <span className="text-center text-[11px] font-semibold text-ink-2 whitespace-nowrap transition-colors group-hover:text-ink">{label}</span>
              </>
            );
            return to
              ? <Link key={id} id={id} to={to} className={cls}>{inner}</Link>
              : <button key={id} id={id} onClick={onClick} className={cls}>{inner}</button>;
          })}
        </div>
      </div>

      <IssueModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSaved={() => fetchData()} />
    </div>
  );
}
