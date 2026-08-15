import { useState, useEffect, useCallback } from 'react';
import { issueAPI, authAPI } from '../services/api';
import { X, Plus, Pencil } from 'lucide-react';

const inputCls = (hasError) =>
  `w-full rounded-lg border px-3 py-2 text-sm bg-elevated text-ink placeholder:text-ink-3 outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 ${hasError ? 'border-danger ring-2 ring-danger/20' : 'border-edge'
  }`;

export default function IssueModal({ isOpen, onClose, onSaved, issue = null }) {
  const isEditMode = Boolean(issue);

  const [form, setForm] = useState({
    title: '', description: '', status: 'open', priority: 'medium',
    type: 'task', assignee: '', dueDate: '', tags: '',
  });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiErr, setApiErr] = useState('');

  useEffect(() => {
    if (isOpen && issue) {
      setForm({
        title: issue.title || '',
        description: issue.description || '',
        status: issue.status || 'open',
        priority: issue.priority || 'medium',
        type: issue.type || 'task',
        assignee: issue.assignee?._id || '',
        dueDate: issue.dueDate ? new Date(issue.dueDate).toISOString().split('T')[0] : '',
        tags: (issue.tags || []).join(', '),
      });
    } else if (isOpen && !issue) {
      setForm({ title: '', description: '', status: 'open', priority: 'medium', type: 'task', assignee: '', dueDate: '', tags: '' });
    }
    setErrors({}); setApiErr('');
  }, [isOpen, issue]);

  useEffect(() => {
    if (!isOpen) return;
    authAPI.getAllUsers().then((r) => setUsers(r.data.data)).catch(() => setUsers([]));
  }, [isOpen]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  }, []);

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    else if (form.title.trim().length < 3) errs.title = 'At least 3 characters';
    else if (form.title.trim().length > 200) errs.title = 'Max 200 characters';
    if (form.description.length > 5000) errs.description = 'Max 5000 characters';
    if (form.dueDate && isNaN(Date.parse(form.dueDate))) errs.dueDate = 'Invalid date';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true); setApiErr('');
    const payload = {
      title: form.title.trim(), description: form.description.trim(),
      status: form.status, priority: form.priority, type: form.type,
      assignee: form.assignee || null, dueDate: form.dueDate || null,
      tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
    };
    try {
      const res = isEditMode ? await issueAPI.update(issue._id, payload) : await issueAPI.create(payload);
      onSaved(res.data.data);
      onClose();
    } catch (err) {
      const serverErr = err.response?.data;
      if (serverErr?.errors) {
        const fe = {};
        serverErr.errors.forEach(({ field, message }) => { fe[field] = message; });
        setErrors(fe);
      } else {
        setApiErr(serverErr?.message || 'Something went wrong. Please try again.');
      }
    } finally { setLoading(false); }
  };

  if (!isOpen) return null;

  const selectCls = 'w-full rounded-lg border border-edge bg-elevated px-3 py-2 text-sm text-ink outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer';

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 animate-fadeIn"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog" aria-modal="true" aria-labelledby="issue-modal-title"
    >
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-edge bg-surface shadow-2xl shadow-black/60 animate-slideUp">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-edge px-6 py-4">
          <h2 id="issue-modal-title" className="flex items-center gap-2 text-base font-bold text-ink">
            {isEditMode
              ? <><Pencil size={15} strokeWidth={2} className="text-ink-3" /> Edit Issue</>
              : <><Plus size={15} strokeWidth={2.5} className="text-ink-3" /> Create Issue</>
            }
          </h2>
          <button type="button" onClick={onClose} aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-2 transition-all hover:bg-subtle hover:text-ink cursor-pointer">
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        {/* Form */}
        <form className="flex flex-col gap-4 p-6" onSubmit={handleSubmit} noValidate>
          {apiErr && (
            <div className="flex items-center gap-2 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">{apiErr}</div>
          )}

          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="issue-title" className="text-sm font-medium text-ink-2">Title <span className="text-danger">*</span></label>
            <input id="issue-title" name="title" type="text" autoFocus
              placeholder="Brief, descriptive title…" maxLength={200}
              value={form.title} onChange={handleChange} className={inputCls(errors.title)} />
            {errors.title && <p className="text-xs text-danger">{errors.title}</p>}
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="issue-description" className="text-sm font-medium text-ink-2">Description</label>
            <textarea id="issue-description" name="description" rows={3} maxLength={5000}
              placeholder="Steps to reproduce, acceptance criteria…"
              value={form.description} onChange={handleChange}
              className={`${inputCls(errors.description)} resize-none`} />
            <p className="text-xs text-ink-3">{form.description.length} / 5000</p>
            {errors.description && <p className="text-xs text-danger">{errors.description}</p>}
          </div>

          {/* Status + Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="issue-status" className="text-sm font-medium text-ink-2">Status</label>
              <select id="issue-status" name="status" value={form.status} onChange={handleChange} className={selectCls}>
                <option value="open">Open</option>
                <option value="in-progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="issue-priority" className="text-sm font-medium text-ink-2">Priority</label>
              <select id="issue-priority" name="priority" value={form.priority} onChange={handleChange} className={selectCls}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          {/* Type + Assignee */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="issue-type" className="text-sm font-medium text-ink-2">Type</label>
              <select id="issue-type" name="type" value={form.type} onChange={handleChange} className={selectCls}>
                <option value="bug">Bug</option>
                <option value="feature">Feature</option>
                <option value="task">Task</option>
                <option value="improvement">Improvement</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="issue-assignee" className="text-sm font-medium text-ink-2">Assignee</label>
              <select id="issue-assignee" name="assignee" value={form.assignee} onChange={handleChange} className={selectCls}>
                <option value="">— Unassigned —</option>
                {users.map((u) => <option key={u._id} value={u._id}>{u.name} ({u.role})</option>)}
              </select>
            </div>
          </div>

          {/* Due Date + Tags */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="issue-dueDate" className="text-sm font-medium text-ink-2">Due Date</label>
              <input id="issue-dueDate" name="dueDate" type="date" value={form.dueDate} onChange={handleChange} className={inputCls(errors.dueDate)} />
              {errors.dueDate && <p className="text-xs text-danger">{errors.dueDate}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="issue-tags" className="text-sm font-medium text-ink-2">Tags</label>
              <input id="issue-tags" name="tags" type="text" placeholder="ui, backend, auth" value={form.tags} onChange={handleChange} className={inputCls(false)} />
              <p className="text-xs text-ink-3">Comma-separated</p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-2 border-t border-edge mt-1">
            <button type="button" onClick={onClose} disabled={loading}
              className="rounded-lg border border-edge px-4 py-2 text-sm font-medium text-ink-2 transition-all hover:bg-subtle hover:text-ink cursor-pointer">
              Cancel
            </button>
            <button type="submit" id="issue-modal-submit" disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary-dark disabled:opacity-60 cursor-pointer">
              {loading
                ? <><span className="spinner" style={{ borderTopColor: '#fff' }} />Saving…</>
                : isEditMode ? <><Pencil size={13} strokeWidth={2} />Save Changes</> : <><Plus size={13} strokeWidth={2.5} />Create Issue</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
