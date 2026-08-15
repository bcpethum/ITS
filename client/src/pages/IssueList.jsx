import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { issueAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import IssueBadge, { STATUS_CONFIG, PRIORITY_CONFIG, TYPE_CONFIG } from '../components/IssueBadge';
import IssueModal from '../components/IssueModal';
import {
  Plus, Search, SlidersHorizontal, X, Pencil, Trash2, Inbox,
  ChevronLeft, ChevronRight,
} from 'lucide-react';

export default function IssueList() {
  const { user } = useAuth();
  const [issues,     setIssues]     = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');

  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    status:   searchParams.get('status')   || '',
    priority: searchParams.get('priority') || '',
    type:     searchParams.get('type')     || '',
    search:   searchParams.get('search')   || '',
  });
  const [page, setPage] = useState(1);

  const [modalOpen,    setModalOpen]    = useState(false);
  const [editingIssue, setEditingIssue] = useState(null);
  const [deletingId,   setDeletingId]   = useState(null);

  const fetchIssues = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = { page, limit: 15 };
      if (filters.status)   params.status   = filters.status;
      if (filters.priority) params.priority = filters.priority;
      if (filters.type)     params.type     = filters.type;
      if (filters.search)   params.search   = filters.search;
      const res = await issueAPI.getAll(params);
      setIssues(res.data.data.issues);
      setPagination(res.data.data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load issues.');
    } finally { setLoading(false); }
  }, [filters, page]);

  useEffect(() => { fetchIssues(); }, [fetchIssues]);

  const handleFilterChange = (e) => {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setPage(1);
  };

  const openCreate = ()      => { setEditingIssue(null); setModalOpen(true); };
  const openEdit   = (issue) => { setEditingIssue(issue); setModalOpen(true); };

  const handleSaved = (saved) => {
    if (editingIssue) setIssues((prev) => prev.map((i) => (i._id === saved._id ? saved : i)));
    else { setIssues((prev) => [saved, ...prev]); setPagination((prev) => ({ ...prev, total: prev.total + 1 })); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this issue? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      await issueAPI.remove(id);
      setIssues((prev) => prev.filter((i) => i._id !== id));
      setPagination((prev) => ({ ...prev, total: Math.max(0, prev.total - 1) }));
    } catch (err) { alert(err.response?.data?.message || 'Failed to delete issue.'); }
    finally { setDeletingId(null); }
  };

  const canModify = (issue) => issue.reporter?._id === user?._id || user?.role === 'admin';
  const hasActiveFilter = filters.status || filters.priority || filters.type || filters.search;

  const selectCls = 'rounded-lg border border-edge bg-elevated px-3 py-2 text-sm text-ink outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer';

  const Avatar = ({ u }) => u ? (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ring-2 ring-edge"
      style={{ background: u.avatarColor }} title={u.name}>
      {u.name?.charAt(0).toUpperCase()}
    </div>
  ) : (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-dashed border-edge bg-elevated text-[10px] text-ink-3" title="Unassigned">?</div>
  );

  const SkeletonRow = () => (
    <div className="grid grid-cols-[1fr_120px_110px_110px_44px_80px_72px] gap-3 items-center px-5 py-3 border-b border-edge last:border-0">
      {[100, 80, 70, 70, 28, 60, 52].map((w, i) => (
        <div key={i} className="skeleton h-3 rounded" style={{ width: w }} />
      ))}
    </div>
  );

  const pageNumbers = Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
    .filter((p) => p === 1 || p === pagination.totalPages || Math.abs(p - page) <= 1)
    .reduce((acc, p, idx, arr) => {
      if (idx > 0 && arr[idx - 1] !== p - 1) acc.push('…');
      acc.push(p);
      return acc;
    }, []);

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-8 animate-fadeIn">

      {/* Header */}
      <div className="mb-7 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">Issues</h1>
          <p className="mt-0.5 text-sm text-ink-2">{pagination.total} issue{pagination.total !== 1 ? 's' : ''} total</p>
        </div>
        <button id="create-issue-btn" onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary-dark cursor-pointer">
          <Plus size={15} strokeWidth={2.5} /> New Issue
        </button>
      </div>

      {/* Filters Bar */}
      <div className="mb-5 flex flex-wrap items-center gap-3 rounded-xl border border-edge bg-surface px-5 py-3">
        <div className="relative min-w-[180px] flex-1">
          <Search size={13} strokeWidth={2} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
          <input id="issue-search" name="search" type="text" placeholder="Search issues…"
            value={filters.search} onChange={handleFilterChange}
            onKeyDown={(e) => e.key === 'Enter' && fetchIssues()}
            className="w-full rounded-lg border border-edge bg-elevated py-2 pl-8 pr-3 text-sm text-ink placeholder:text-ink-3 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <select id="filter-status"   name="status"   value={filters.status}   onChange={handleFilterChange} className={selectCls}>
          <option value="">All Statuses</option>
          {Object.entries(STATUS_CONFIG).map(([val, cfg]) => <option key={val} value={val}>{cfg.label}</option>)}
        </select>
        <select id="filter-priority" name="priority" value={filters.priority} onChange={handleFilterChange} className={selectCls}>
          <option value="">All Priorities</option>
          {Object.entries(PRIORITY_CONFIG).map(([val, cfg]) => <option key={val} value={val}>{cfg.label}</option>)}
        </select>
        <select id="filter-type"     name="type"     value={filters.type}     onChange={handleFilterChange} className={selectCls}>
          <option value="">All Types</option>
          {Object.entries(TYPE_CONFIG).map(([val, cfg]) => <option key={val} value={val}>{cfg.label}</option>)}
        </select>
        {hasActiveFilter && (
          <button onClick={() => { setFilters({ status: '', priority: '', type: '', search: '' }); setPage(1); }}
            className="flex items-center gap-1.5 rounded-lg border border-edge px-3 py-2 text-xs font-medium text-ink-2 transition-all hover:bg-subtle hover:text-ink cursor-pointer">
            <X size={12} strokeWidth={2.5} /> Clear
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-5 flex items-center justify-between gap-3 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          <span>{error}</span>
          <button onClick={fetchIssues} className="rounded px-2 py-1 text-xs font-medium hover:bg-danger/10 cursor-pointer">Retry</button>
        </div>
      )}

      {/* Table Card */}
      <div className="overflow-hidden rounded-xl border border-edge bg-surface shadow-md">
        <div className="grid grid-cols-[1fr_120px_110px_110px_44px_80px_72px] gap-3 items-center border-b border-edge bg-elevated/60 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-widest text-ink-3">
          <span>Issue</span><span>Status</span><span>Priority</span><span>Type</span><span>Assignee</span><span>Created</span><span>Actions</span>
        </div>

        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
        ) : issues.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Inbox size={40} strokeWidth={1} className="text-ink-3" />
            <h3 className="text-base font-semibold text-ink">No issues found</h3>
            <p className="text-sm text-ink-2">{hasActiveFilter ? 'Try adjusting your filters.' : 'Create your first issue to get started!'}</p>
            {!hasActiveFilter && (
              <button onClick={openCreate} className="mt-1 flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow shadow-primary/20 hover:bg-primary-dark cursor-pointer">
                <Plus size={14} strokeWidth={2.5} /> Create Issue
              </button>
            )}
          </div>
        ) : (
          issues.map((issue) => {
            const isOverdue = issue.dueDate && new Date(issue.dueDate) < new Date()
              && issue.status !== 'resolved' && issue.status !== 'closed';
            return (
              <div key={issue._id}
                className="grid grid-cols-[1fr_120px_110px_110px_44px_80px_72px] gap-3 items-center px-5 py-3 border-b border-edge last:border-0 transition-colors hover:bg-subtle/50 animate-fadeIn">

                <div className="flex min-w-0 flex-col gap-0.5">
                  <Link to={`/issues/${issue._id}`} className="truncate text-sm font-medium text-ink hover:text-primary transition-colors no-underline" title={issue.title}>
                    {issue.title}
                  </Link>
                  {issue.reporter && <span className="text-[11px] text-ink-3">by {issue.reporter.name}</span>}
                  {issue.dueDate && (
                    <span className={`text-[11px] font-medium ${isOverdue ? 'text-danger' : 'text-ink-3'}`}>
                      {new Date(issue.dueDate).toLocaleDateString()}{isOverdue && ' (overdue)'}
                    </span>
                  )}
                  {issue.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {issue.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="rounded-full border border-primary/20 bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">{tag}</span>
                      ))}
                      {issue.tags.length > 3 && <span className="rounded-full border border-edge bg-elevated px-1.5 py-0.5 text-[10px] text-ink-3">+{issue.tags.length - 3}</span>}
                    </div>
                  )}
                </div>

                <div><IssueBadge kind="status"   value={issue.status}   /></div>
                <div><IssueBadge kind="priority" value={issue.priority} /></div>
                <div><IssueBadge kind="type"     value={issue.type}     /></div>
                <div><Avatar u={issue.assignee} /></div>
                <div className="text-[11px] text-ink-3">{new Date(issue.createdAt).toLocaleDateString()}</div>

                <div className="flex items-center gap-1">
                  {canModify(issue) ? (
                    <>
                      <button onClick={() => openEdit(issue)} title="Edit"
                        className="flex h-7 w-7 items-center justify-center rounded-md text-ink-2 transition-all hover:bg-subtle hover:text-ink cursor-pointer">
                        <Pencil size={13} strokeWidth={2} />
                      </button>
                      <button onClick={() => handleDelete(issue._id)} disabled={deletingId === issue._id} title="Delete"
                        className="flex h-7 w-7 items-center justify-center rounded-md transition-all hover:bg-danger/10 hover:text-danger disabled:opacity-40 cursor-pointer text-ink-2">
                        {deletingId === issue._id
                          ? <span className="spinner" style={{ width: 12, height: 12, borderTopColor: '#FF4757', borderWidth: 1.5 }} />
                          : <Trash2 size={13} strokeWidth={2} />
                        }
                      </button>
                    </>
                  ) : <span className="text-[11px] text-ink-3">—</span>}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-1.5">
          <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}
            className="flex items-center gap-1 rounded-lg border border-edge px-3 py-1.5 text-sm text-ink-2 transition-all hover:bg-subtle hover:text-ink disabled:opacity-40 cursor-pointer">
            <ChevronLeft size={14} /> Prev
          </button>
          <div className="flex items-center gap-1">
            {pageNumbers.map((p, idx) =>
              p === '…' ? (
                <span key={`e-${idx}`} className="px-2 text-sm text-ink-3">…</span>
              ) : (
                <button key={p} onClick={() => setPage(p)}
                  className={`min-w-[34px] rounded-lg px-2 py-1.5 text-sm font-medium transition-all cursor-pointer ${
                    page === p ? 'bg-primary text-white shadow shadow-primary/20' : 'border border-edge text-ink-2 hover:bg-subtle hover:text-ink'
                  }`}>{p}</button>
              )
            )}
          </div>
          <button disabled={page === pagination.totalPages} onClick={() => setPage((p) => p + 1)}
            className="flex items-center gap-1 rounded-lg border border-edge px-3 py-1.5 text-sm text-ink-2 transition-all hover:bg-subtle hover:text-ink disabled:opacity-40 cursor-pointer">
            Next <ChevronRight size={14} />
          </button>
        </div>
      )}

      <IssueModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSaved={handleSaved} issue={editingIssue} />
    </div>
  );
}
