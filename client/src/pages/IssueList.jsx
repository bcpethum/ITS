import { useState, useEffect, useCallback } from 'react';
import { issueAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import IssueBadge, { STATUS_CONFIG, PRIORITY_CONFIG, TYPE_CONFIG } from '../components/IssueBadge';
import IssueModal from '../components/IssueModal';

/**
 * IssueList Page — Full issue list with filters, pagination, and CRUD actions.
 */
export default function IssueList() {
  const { user } = useAuth();

  // ── Data state ────────────────────────────────────────────────────────────
  const [issues,     setIssues]     = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');

  // ── Filter state ──────────────────────────────────────────────────────────
  const [filters, setFilters] = useState({ status: '', priority: '', type: '', search: '' });
  const [page, setPage] = useState(1);

  // ── Modal state ───────────────────────────────────────────────────────────
  const [modalOpen,    setModalOpen]    = useState(false);
  const [editingIssue, setEditingIssue] = useState(null);

  // ── Delete state ──────────────────────────────────────────────────────────
  const [deletingId, setDeletingId] = useState(null);

  // ── Fetch issues ──────────────────────────────────────────────────────────
  const fetchIssues = useCallback(async () => {
    setLoading(true);
    setError('');
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
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => { fetchIssues(); }, [fetchIssues]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleFilterChange = (e) => {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setPage(1);
  };

  const handleSearchKeyDown = (e) => { if (e.key === 'Enter') fetchIssues(); };

  const openCreateModal = () => { setEditingIssue(null); setModalOpen(true); };
  const openEditModal   = (issue) => { setEditingIssue(issue); setModalOpen(true); };

  const handleSaved = (savedIssue) => {
    if (editingIssue) {
      setIssues((prev) => prev.map((i) => (i._id === savedIssue._id ? savedIssue : i)));
    } else {
      setIssues((prev) => [savedIssue, ...prev]);
      setPagination((prev) => ({ ...prev, total: prev.total + 1 }));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this issue? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      await issueAPI.remove(id);
      setIssues((prev) => prev.filter((i) => i._id !== id));
      setPagination((prev) => ({ ...prev, total: Math.max(0, prev.total - 1) }));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete issue.');
    } finally {
      setDeletingId(null);
    }
  };

  const canModify = (issue) =>
    issue.reporter?._id === user?._id || user?.role === 'admin';

  // ── Avatar helper ─────────────────────────────────────────────────────────
  const Avatar = ({ u }) => u ? (
    <span className="avatar avatar-sm" style={{ background: u.avatarColor }} title={u.name}>
      {u.name?.charAt(0).toUpperCase()}
    </span>
  ) : (
    <span className="avatar avatar-sm avatar-empty" title="Unassigned">?</span>
  );

  // ── Skeleton rows ─────────────────────────────────────────────────────────
  const Skeleton = () => (
    <div className="issue-row skeleton-row">
      {[1,2,3,4,5,6,7].map((n) => <div key={n} className="issue-cell"><div className="skeleton-cell" style={{ width: '80%' }} /></div>)}
    </div>
  );

  const hasActiveFilter = filters.status || filters.priority || filters.type || filters.search;

  return (
    <div className="main-content animate-fadeIn">
      {/* ── Page Header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Issues</h1>
          <p className="page-subtitle">
            {pagination.total} issue{pagination.total !== 1 ? 's' : ''} total
          </p>
        </div>
        <button className="btn btn-primary" id="create-issue-btn" onClick={openCreateModal}>
          ＋ New Issue
        </button>
      </div>

      {/* ── Filters Bar ── */}
      <div className="filters-bar card">
        <div className="filter-search">
          <span className="filter-search-icon">🔍</span>
          <input
            id="issue-search" name="search" type="text"
            className="form-input filter-input"
            placeholder="Search by title…"
            value={filters.search}
            onChange={handleFilterChange}
            onKeyDown={handleSearchKeyDown}
          />
        </div>

        <select id="filter-status" name="status" className="form-select filter-select"
          value={filters.status} onChange={handleFilterChange}>
          <option value="">All Statuses</option>
          {Object.entries(STATUS_CONFIG).map(([val, cfg]) => (
            <option key={val} value={val}>{cfg.icon} {cfg.label}</option>
          ))}
        </select>

        <select id="filter-priority" name="priority" className="form-select filter-select"
          value={filters.priority} onChange={handleFilterChange}>
          <option value="">All Priorities</option>
          {Object.entries(PRIORITY_CONFIG).map(([val, cfg]) => (
            <option key={val} value={val}>{cfg.icon} {cfg.label}</option>
          ))}
        </select>

        <select id="filter-type" name="type" className="form-select filter-select"
          value={filters.type} onChange={handleFilterChange}>
          <option value="">All Types</option>
          {Object.entries(TYPE_CONFIG).map(([val, cfg]) => (
            <option key={val} value={val}>{cfg.icon} {cfg.label}</option>
          ))}
        </select>

        {hasActiveFilter && (
          <button className="btn btn-ghost btn-sm"
            onClick={() => { setFilters({ status: '', priority: '', type: '', search: '' }); setPage(1); }}>
            ✕ Clear
          </button>
        )}
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div className="alert alert-error" role="alert" style={{ marginBottom: '16px' }}>
          <span>{error}</span>
          <button className="btn btn-ghost btn-sm" onClick={fetchIssues}>Retry</button>
        </div>
      )}

      {/* ── Issue Table ── */}
      <div className="card issue-table-card">
        <div className="issue-table-header">
          <span>Issue</span>
          <span>Status</span>
          <span>Priority</span>
          <span>Type</span>
          <span>Assignee</span>
          <span>Created</span>
          <span>Actions</span>
        </div>

        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} />)
        ) : issues.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <h3>No issues found</h3>
            <p>
              {hasActiveFilter
                ? 'Try adjusting your filters.'
                : 'Create your first issue to get started!'}
            </p>
            {!hasActiveFilter && (
              <button className="btn btn-primary" onClick={openCreateModal}>＋ Create Issue</button>
            )}
          </div>
        ) : (
          issues.map((issue) => (
            <div key={issue._id} className="issue-row animate-fadeIn">
              {/* Title cell */}
              <div className="issue-cell issue-title-cell">
                <span className="issue-title">{issue.title}</span>
                {issue.reporter && (
                  <span className="issue-reporter">by {issue.reporter.name}</span>
                )}
                {issue.dueDate && (
                  <span className={`issue-due ${new Date(issue.dueDate) < new Date() && issue.status !== 'resolved' && issue.status !== 'closed' ? 'overdue' : ''}`}>
                    📅 {new Date(issue.dueDate).toLocaleDateString()}
                  </span>
                )}
                {issue.tags?.length > 0 && (
                  <div className="issue-tags">
                    {issue.tags.slice(0, 3).map((tag) => <span key={tag} className="tag">{tag}</span>)}
                    {issue.tags.length > 3 && <span className="tag">+{issue.tags.length - 3}</span>}
                  </div>
                )}
              </div>

              {/* Status */}
              <div className="issue-cell">
                <IssueBadge kind="status" value={issue.status} />
              </div>

              {/* Priority */}
              <div className="issue-cell">
                <IssueBadge kind="priority" value={issue.priority} />
              </div>

              {/* Type */}
              <div className="issue-cell">
                <IssueBadge kind="type" value={issue.type} />
              </div>

              {/* Assignee */}
              <div className="issue-cell">
                <Avatar u={issue.assignee} />
              </div>

              {/* Date */}
              <div className="issue-cell issue-date">
                {new Date(issue.createdAt).toLocaleDateString()}
              </div>

              {/* Actions */}
              <div className="issue-cell issue-actions">
                {canModify(issue) ? (
                  <>
                    <button className="btn btn-ghost btn-xs" title="Edit" onClick={() => openEditModal(issue)}>✏️</button>
                    <button
                      className="btn btn-danger btn-xs" title="Delete"
                      onClick={() => handleDelete(issue._id)}
                      disabled={deletingId === issue._id}
                    >
                      {deletingId === issue._id ? '…' : '🗑️'}
                    </button>
                  </>
                ) : (
                  <span className="issue-view-only" title="Only the reporter or admin can edit">—</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Pagination ── */}
      {pagination.totalPages > 1 && (
        <div className="pagination">
          <button className="btn btn-ghost btn-sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            ← Prev
          </button>
          <div className="pagination-pages">
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === pagination.totalPages || Math.abs(p - page) <= 2)
              .reduce((acc, p, idx, arr) => {
                if (idx > 0 && arr[idx - 1] !== p - 1) acc.push('…');
                acc.push(p);
                return acc;
              }, [])
              .map((p, idx) =>
                p === '…' ? (
                  <span key={`e-${idx}`} className="pagination-ellipsis">…</span>
                ) : (
                  <button
                    key={p}
                    className={`btn btn-sm ${page === p ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                )
              )
            }
          </div>
          <button className="btn btn-ghost btn-sm" disabled={page === pagination.totalPages} onClick={() => setPage((p) => p + 1)}>
            Next →
          </button>
        </div>
      )}

      {/* ── Create / Edit Modal ── */}
      <IssueModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
        issue={editingIssue}
      />
    </div>
  );
}
