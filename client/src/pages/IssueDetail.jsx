import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { issueAPI, commentAPI, activityAPI, attachmentAPI } from '../services/api';
import IssueBadge from '../components/IssueBadge';
import IssueModal from '../components/IssueModal';
import {
  Pencil, Trash2, MessageSquare, Activity, Paperclip,
  ChevronRight, AlertTriangle, Inbox, Download, Upload,
  Target, RefreshCw, Zap, Tag, UserCheck, PlusCircle,
  Image as ImageIcon, FileText, File, X, Calendar, User,
} from 'lucide-react';

/* ── Helpers ──────────────────────────────────────────────────────────────── */

const timeAgo = (date) => {
  const secs = Math.floor((Date.now() - new Date(date)) / 1000);
  if (secs < 60)   return 'just now';
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return new Date(date).toLocaleDateString();
};

const formatBytes = (bytes) => {
  if (bytes < 1024)       return `${bytes} B`;
  if (bytes < 1024 ** 2)  return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
};

const getInitials = (name = '') => {
  const p = name.trim().split(' ');
  return p.length === 1 ? p[0].slice(0, 2).toUpperCase()
    : (p[0][0] + p[p.length - 1][0]).toUpperCase();
};

const ACTION_META = {
  created:            { Icon: PlusCircle,  color: '#00D9C0', label: (a) => 'created this issue' },
  status_changed:     { Icon: RefreshCw,   color: '#F7B731', label: (a) => `changed status: ${a.oldValue} → ${a.newValue}` },
  priority_changed:   { Icon: Zap,         color: '#6C63FF', label: (a) => `changed priority: ${a.oldValue} → ${a.newValue}` },
  type_changed:       { Icon: Tag,         color: '#8B949E', label: (a) => `changed type: ${a.oldValue} → ${a.newValue}` },
  assignee_changed:   { Icon: UserCheck,   color: '#8B949E', label: (a) => 'changed assignee' },
  commented:          { Icon: MessageSquare, color: '#00D9C0', label: (a) => 'added a comment' },
  attachment_added:   { Icon: Paperclip,   color: '#26de81', label: (a) => `attached "${a.newValue}"` },
  attachment_removed: { Icon: Trash2,      color: '#FF4757', label: (a) => 'removed an attachment' },
};

const Avatar = ({ u, size = 'sm' }) => {
  const sz = size === 'sm' ? 'h-7 w-7 text-[10px]' : 'h-9 w-9 text-xs';
  return u ? (
    <div className={`flex shrink-0 items-center justify-center rounded-full font-bold text-white ring-2 ring-edge ${sz}`}
      style={{ background: u.avatarColor }} title={u.name}>
      {getInitials(u.name)}
    </div>
  ) : (
    <div className={`flex shrink-0 items-center justify-center rounded-full border border-dashed border-edge bg-elevated text-ink-3 ${sz}`}>
      ?
    </div>
  );
};

/* ── IssueDetail ──────────────────────────────────────────────────────────── */
export default function IssueDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  // ── Issue state ──────────────────────────────────────────────────────────
  const [issue,   setIssue]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleting,  setDeleting]  = useState(false);

  // Quick-status inline update
  const [statusSaving, setStatusSaving] = useState(false);

  // ── Tab state ────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('comments');

  // ── Comments ─────────────────────────────────────────────────────────────
  const [comments,    setComments]    = useState([]);
  const [commLoading, setCommLoading] = useState(false);
  const [newComment,  setNewComment]  = useState('');
  const [submitting,  setSubmitting]  = useState(false);
  const [delCommId,   setDelCommId]   = useState(null);

  // ── Activity ──────────────────────────────────────────────────────────────
  const [activities,   setActivities]   = useState([]);
  const [actLoading,   setActLoading]   = useState(false);

  // ── Attachments ───────────────────────────────────────────────────────────
  const [uploading,   setUploading]   = useState(false);
  const [delAttId,    setDelAttId]    = useState(null);

  // ── Fetch issue ───────────────────────────────────────────────────────────
  const fetchIssue = async () => {
    setLoading(true); setError('');
    try {
      const res = await issueAPI.getOne(id);
      setIssue(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load issue.');
    } finally { setLoading(false); }
  };

  // ── Fetch comments ────────────────────────────────────────────────────────
  const fetchComments = async () => {
    setCommLoading(true);
    try { setComments((await commentAPI.getAll(id)).data.data); }
    catch { setComments([]); }
    finally { setCommLoading(false); }
  };

  // ── Fetch activity ────────────────────────────────────────────────────────
  const fetchActivity = async () => {
    setActLoading(true);
    try { setActivities((await activityAPI.getAll(id)).data.data); }
    catch { setActivities([]); }
    finally { setActLoading(false); }
  };

  useEffect(() => {
    fetchIssue();
    fetchComments();
    fetchActivity();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!window.confirm('Delete this issue? This cannot be undone.')) return;
    setDeleting(true);
    try { await issueAPI.remove(id); navigate('/issues'); }
    catch (err) { alert(err.response?.data?.message || 'Failed to delete.'); setDeleting(false); }
  };

  const handleIssueSaved = (saved) => { setIssue(saved); fetchActivity(); };

  const handleQuickStatus = async (newStatus) => {
    setStatusSaving(true);
    try {
      const res = await issueAPI.update(id, { status: newStatus });
      setIssue(res.data.data);
      fetchActivity();
    } catch { /* ignore */ }
    finally { setStatusSaving(false); }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      const res = await commentAPI.add(id, newComment.trim());
      setComments((prev) => [...prev, res.data.data]);
      setNewComment('');
      fetchActivity();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add comment.');
    } finally { setSubmitting(false); }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    setDelCommId(commentId);
    try {
      await commentAPI.remove(id, commentId);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
    } catch { /* ignore */ }
    finally { setDelCommId(null); }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await attachmentAPI.upload(id, file);
      setIssue((prev) => ({
        ...prev,
        attachments: [...(prev.attachments || []), res.data.data],
      }));
      fetchActivity();
    } catch (err) {
      alert(err.response?.data?.message || 'Upload failed. Max 5 MB allowed.');
    } finally { setUploading(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
  };

  const handleDeleteAttachment = async (attId) => {
    if (!window.confirm('Delete this attachment?')) return;
    setDelAttId(attId);
    try {
      await attachmentAPI.remove(id, attId);
      setIssue((prev) => ({
        ...prev,
        attachments: prev.attachments.filter((a) => a._id !== attId),
      }));
    } catch { /* ignore */ }
    finally { setDelAttId(null); }
  };

  const canModify = issue &&
    (issue.reporter?._id === user?._id || user?.role === 'admin');

  // ── Loading / Error states ─────────────────────────────────────────────
  if (loading) {
    return (
      <div className="mx-auto max-w-[1200px] px-6 py-8 animate-fadeIn">
        <div className="skeleton mb-6 h-8 w-40 rounded-lg" />
        <div className="skeleton mb-4 h-10 w-3/4 rounded-lg" />
        <div className="skeleton h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="mx-auto max-w-[1200px] px-6 py-16 text-center">
        <AlertTriangle size={40} strokeWidth={1.5} className="mx-auto mb-4 text-warning" />
        <h2 className="text-xl font-bold text-ink mb-2">{error || 'Issue not found'}</h2>
        <Link to="/issues" className="text-primary hover:text-primary-dark text-sm font-medium">
          ← Back to Issues
        </Link>
      </div>
    );
  }

  const isOverdue = issue.dueDate && new Date(issue.dueDate) < new Date()
    && issue.status !== 'resolved' && issue.status !== 'closed';

  const tabs = [
    { key: 'comments',    label: 'Comments',    Icon: MessageSquare, count: comments.length },
    { key: 'activity',    label: 'Activity',    Icon: Activity,      count: activities.length },
    { key: 'attachments', label: 'Attachments', Icon: Paperclip,     count: issue.attachments?.length || 0 },
  ];

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-[1200px] px-6 py-8 animate-fadeIn">

      {/* ── Breadcrumb / Back ── */}
      <div className="mb-5 flex items-center gap-2 text-sm text-ink-3">
        <Link to="/issues" className="hover:text-primary transition-colors no-underline">Issues</Link>
        <ChevronRight size={14} strokeWidth={2} />
        <span className="text-ink-2 truncate max-w-[300px]">{issue.title}</span>
      </div>

      {/* ── Issue Title Bar ── */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-extrabold tracking-tight text-ink leading-snug mb-3">
            {issue.title}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <IssueBadge kind="status"   value={issue.status}   />
            <IssueBadge kind="priority" value={issue.priority} />
            <IssueBadge kind="type"     value={issue.type}     />
            {issue.tags?.map((tag) => (
              <span key={tag} className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {canModify && (
            <>
              <button onClick={() => setModalOpen(true)}
                className="flex items-center gap-1.5 rounded-lg border border-edge px-3 py-2 text-sm font-medium text-ink-2 transition-all hover:bg-subtle hover:text-ink cursor-pointer">
                <Pencil size={13} strokeWidth={2} /> Edit
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex items-center gap-1.5 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm font-medium text-danger transition-all hover:bg-danger/20 disabled:opacity-50 cursor-pointer">
                {deleting ? <span className="spinner" style={{ width: 14, height: 14, borderTopColor: '#FF4757' }} /> : <Trash2 size={13} strokeWidth={2} />}
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Main 2-col grid ── */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_280px]">

        {/* ── LEFT: Description + Tabs ── */}
        <div className="flex flex-col gap-5 min-w-0">

          {/* Description */}
          <div className="rounded-xl border border-edge bg-surface p-5 shadow-md">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-ink-3">Description</h2>
            {issue.description ? (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-2">{issue.description}</p>
            ) : (
              <p className="text-sm italic text-ink-3">No description provided.</p>
            )}
          </div>

          {/* Tabs */}
          <div className="rounded-xl border border-edge bg-surface shadow-md overflow-hidden">
            {/* Tab bar */}
            <div className="flex border-b border-edge">
              {tabs.map((tab) => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 px-5 py-3 text-sm font-medium transition-all cursor-pointer ${
                    activeTab === tab.key
                      ? 'border-b-2 border-primary text-primary'
                      : 'text-ink-3 hover:text-ink hover:bg-subtle'
                  }`}>
                  <tab.Icon size={13} strokeWidth={2} />
                  {tab.label}
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    activeTab === tab.key ? 'bg-primary/15 text-primary' : 'bg-elevated text-ink-3'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* ── COMMENTS TAB ── */}
            {activeTab === 'comments' && (
              <div className="p-5">
                {/* Comment list */}
                {commLoading ? (
                  <div className="flex flex-col gap-4">
                    {[1, 2].map((i) => (
                      <div key={i} className="flex gap-3">
                        <div className="skeleton h-8 w-8 rounded-full shrink-0" />
                        <div className="flex-1 flex flex-col gap-2">
                          <div className="skeleton h-3 w-24 rounded" />
                          <div className="skeleton h-12 w-full rounded-lg" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : comments.length === 0 ? (
                  <div className="py-10 text-center">
                    <MessageSquare size={32} strokeWidth={1} className="mx-auto mb-2 text-ink-3" />
                    <p className="text-sm text-ink-2">No comments yet. Be the first to comment!</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 mb-6">
                    {comments.map((c) => (
                      <div key={c._id} className="flex gap-3 group">
                        <Avatar u={c.author} size="sm" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-sm font-semibold text-ink">{c.author?.name}</span>
                            <span className="text-[11px] text-ink-3 capitalize">{c.author?.role}</span>
                            <span className="text-[11px] text-ink-3">{timeAgo(c.createdAt)}</span>
                            {(c.author?._id === user?._id || user?.role === 'admin') && (
                              <button onClick={() => handleDeleteComment(c._id)}
                                disabled={delCommId === c._id}
                                className="ml-auto hidden group-hover:flex items-center text-xs text-ink-3 hover:text-danger transition-colors cursor-pointer">
                                {delCommId === c._id ? '…' : <X size={12} strokeWidth={2.5} />}
                              </button>
                            )}
                          </div>
                          <div className="rounded-lg border border-edge bg-elevated px-4 py-3 text-sm text-ink-2 leading-relaxed whitespace-pre-wrap">
                            {c.content}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add comment form */}
                <form onSubmit={handleAddComment} className="flex flex-col gap-3 pt-4 border-t border-edge">
                  <div className="flex gap-3">
                    <Avatar u={user} size="sm" />
                    <textarea
                      placeholder="Add a comment…"
                      value={newComment} onChange={(e) => setNewComment(e.target.value)}
                      rows={3} maxLength={2000}
                      className="flex-1 rounded-lg border border-edge bg-elevated px-4 py-2.5 text-sm text-ink placeholder:text-ink-3 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
                    />
                  </div>
                  <div className="flex items-center justify-between pl-10">
                    <span className="text-[11px] text-ink-3">{newComment.length} / 2000</span>
                    <button type="submit" disabled={!newComment.trim() || submitting}
                      className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow shadow-primary/20 transition-all hover:bg-primary-dark disabled:opacity-50 cursor-pointer">
                      {submitting ? <span className="spinner" style={{ width: 14, height: 14, borderTopColor: '#fff' }} /> : null}
                      Comment
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ── ACTIVITY TAB ── */}
            {activeTab === 'activity' && (
              <div className="p-5">
                {actLoading ? (
                  <div className="flex flex-col gap-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex gap-3 items-center">
                        <div className="skeleton h-7 w-7 rounded-full shrink-0" />
                        <div className="skeleton h-3 flex-1 rounded" />
                        <div className="skeleton h-3 w-16 rounded" />
                      </div>
                    ))}
                  </div>
                ) : activities.length === 0 ? (
                  <div className="py-10 text-center">
                    <Activity size={32} strokeWidth={1} className="mx-auto mb-2 text-ink-3" />
                    <p className="text-sm text-ink-2">No activity recorded yet.</p>
                  </div>
                ) : (
                  <div className="relative flex flex-col gap-0">
                    {/* Timeline line */}
                    <div className="absolute left-[13px] top-0 bottom-0 w-px bg-edge" />
                    {activities.map((a, idx) => {
                      const meta = ACTION_META[a.action] || { Icon: Activity, color: '#8B949E', label: () => a.action };
                      const { Icon: AIcon } = meta;
                      return (
                        <div key={a._id} className="relative flex items-start gap-3 pb-4">
                          {/* Icon bubble */}
                          <div className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border bg-surface" style={{ borderColor: `${meta.color}40` }}>
                            <AIcon size={13} strokeWidth={2} style={{ color: meta.color }} />
                          </div>
                          <div className="flex flex-1 flex-wrap items-center gap-1.5 pt-0.5">
                            {a.user && (
                              <span className="text-sm font-semibold text-ink">{a.user.name}</span>
                            )}
                            <span className="text-sm" style={{ color: meta.color }}>{meta.label(a)}</span>
                            <span className="ml-auto text-[11px] text-ink-3 shrink-0">{timeAgo(a.createdAt)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── ATTACHMENTS TAB ── */}
            {activeTab === 'attachments' && (
              <div className="p-5">
                {/* File list */}
                {issue.attachments?.length === 0 ? (
                  <div className="py-8 text-center">
                    <Paperclip size={32} strokeWidth={1} className="mx-auto mb-2 text-ink-3" />
                    <p className="text-sm text-ink-2">No files attached yet.</p>
                  </div>
                ) : (
                  <div className="mb-5 flex flex-col gap-2">
                    {issue.attachments.map((att) => {
                      const isImage = att.mimetype?.startsWith('image/');
                      return (
                        <div key={att._id}
                          className="flex items-center gap-3 rounded-lg border border-edge bg-elevated px-4 py-3 transition-all hover:border-edge-hover">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-elevated border border-edge">
                            {isImage
                              ? <ImageIcon size={15} strokeWidth={1.75} className="text-ink-2" />
                              : att.mimetype === 'application/pdf'
                                ? <FileText size={15} strokeWidth={1.75} className="text-ink-2" />
                                : <File size={15} strokeWidth={1.75} className="text-ink-2" />
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="truncate text-sm font-medium text-ink">{att.originalName}</p>
                            <p className="text-[11px] text-ink-3">{formatBytes(att.size)}</p>
                          </div>
                          <a href={`/uploads/${att.filename}`} target="_blank" rel="noreferrer"
                            className="flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium text-primary border border-primary/20 bg-primary/10 hover:bg-primary/20 transition-all no-underline">
                            <Download size={11} strokeWidth={2} /> Download
                          </a>
                          {(att.uploadedBy === user?._id || user?.role === 'admin' || canModify) && (
                            <button onClick={() => handleDeleteAttachment(att._id)}
                              disabled={delAttId === att._id}
                              className="flex h-7 w-7 items-center justify-center rounded-md text-danger border border-danger/20 bg-danger/10 hover:bg-danger/20 transition-all cursor-pointer disabled:opacity-40">
                              {delAttId === att._id ? '…' : <X size={12} strokeWidth={2.5} />}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Upload */}
                <div className="border-t border-edge pt-4">
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden"
                    accept="image/*,.pdf,.txt,.doc,.docx" />
                  <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                    className="flex items-center gap-2 rounded-lg border border-dashed border-edge px-4 py-2.5 text-sm font-medium text-ink-2 transition-all hover:border-primary hover:text-primary w-full justify-center cursor-pointer disabled:opacity-50">
                    {uploading
                      ? <><span className="spinner" style={{ width: 14, height: 14, borderTopColor: '#6C63FF' }} />Uploading…</>
                      : <><Upload size={14} strokeWidth={2} /><Paperclip size={13} strokeWidth={2} /> Attach File (images, PDF, Word, TXT — max 5 MB)</>
                    }
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Metadata Sidebar ── */}
        <div className="flex flex-col gap-4">

          {/* Quick status update */}
          <div className="rounded-xl border border-edge bg-surface p-4 shadow-md">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-ink-3">Quick Status Update</h3>
            <div className="grid grid-cols-2 gap-2">
              {['open', 'in-progress', 'resolved', 'closed'].map((s) => (
                <button key={s} onClick={() => handleQuickStatus(s)} disabled={statusSaving || issue.status === s}
                  className={`rounded-lg border px-3 py-2 text-xs font-semibold capitalize transition-all cursor-pointer ${
                    issue.status === s
                      ? 'border-primary/40 bg-primary/15 text-primary'
                      : 'border-edge text-ink-2 hover:border-edge-hover hover:bg-subtle'
                  } disabled:opacity-60`}>
                  {s.replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Metadata */}
          <div className="rounded-xl border border-edge bg-surface p-4 shadow-md">
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-ink-3">Details</h3>
            <div className="flex flex-col gap-3.5">

              {/* Reporter */}
              <MetaRow label="Reporter">
                {issue.reporter ? (
                  <div className="flex items-center gap-2">
                    <Avatar u={issue.reporter} size="sm" />
                    <span className="text-sm font-medium text-ink">{issue.reporter.name}</span>
                  </div>
                ) : <span className="text-sm text-ink-3">—</span>}
              </MetaRow>

              {/* Assignee */}
              <MetaRow label="Assignee">
                {issue.assignee ? (
                  <div className="flex items-center gap-2">
                    <Avatar u={issue.assignee} size="sm" />
                    <span className="text-sm font-medium text-ink">{issue.assignee.name}</span>
                  </div>
                ) : <span className="text-sm text-ink-3">Unassigned</span>}
              </MetaRow>

              {/* Priority */}
              <MetaRow label="Priority"><IssueBadge kind="priority" value={issue.priority} /></MetaRow>
              {/* Type */}
              <MetaRow label="Type"><IssueBadge kind="type" value={issue.type} /></MetaRow>

              {/* Due Date */}
              <MetaRow label="Due Date">
                {issue.dueDate ? (
                  <span className={`text-sm font-medium ${isOverdue ? 'text-danger' : 'text-ink'}`}>
                    {new Date(issue.dueDate).toLocaleDateString()}
                    {isOverdue && <span className="ml-1 text-[10px] text-danger">(overdue)</span>}
                  </span>
                ) : <span className="text-sm text-ink-3">No due date</span>}
              </MetaRow>

              {/* Created */}
              <MetaRow label="Created">
                <span className="text-sm text-ink-2">{new Date(issue.createdAt).toLocaleString()}</span>
              </MetaRow>

              {/* Updated */}
              <MetaRow label="Updated">
                <span className="text-sm text-ink-2">{timeAgo(issue.updatedAt)}</span>
              </MetaRow>

            </div>
          </div>
        </div>
      </div>

      {/* Edit modal */}
      <IssueModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSaved={handleIssueSaved} issue={issue} />
    </div>
  );
}

/* Metadata row helper */
function MetaRow({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="text-xs font-medium text-ink-3 shrink-0 mt-0.5 w-20">{label}</span>
      <div className="flex-1 text-right flex justify-end">{children}</div>
    </div>
  );
}
