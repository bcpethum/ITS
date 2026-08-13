import { useState, useEffect, useCallback } from 'react';
import { issueAPI, authAPI } from '../services/api';

/**
 * IssueModal — Slide-in modal for creating or editing an issue.
 *
 * Props:
 *   isOpen   — whether the modal is visible
 *   onClose  — called when the modal should close
 *   onSaved  — called with the created/updated issue after successful save
 *   issue    — if provided, the modal is in "edit" mode; otherwise "create" mode
 */
export default function IssueModal({ isOpen, onClose, onSaved, issue = null }) {
  const isEditMode = Boolean(issue);

  const [form, setForm] = useState({
    title: '', description: '', status: 'open', priority: 'medium',
    type: 'task', assignee: '', dueDate: '', tags: '',
  });
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors,  setErrors]  = useState({});
  const [apiErr,  setApiErr]  = useState('');

  // Populate form when editing an existing issue
  useEffect(() => {
    if (isOpen && issue) {
      setForm({
        title:       issue.title        || '',
        description: issue.description  || '',
        status:      issue.status       || 'open',
        priority:    issue.priority     || 'medium',
        type:        issue.type         || 'task',
        assignee:    issue.assignee?._id || '',
        dueDate:     issue.dueDate
          ? new Date(issue.dueDate).toISOString().split('T')[0]
          : '',
        tags: (issue.tags || []).join(', '),
      });
    } else if (isOpen && !issue) {
      setForm({ title: '', description: '', status: 'open', priority: 'medium', type: 'task', assignee: '', dueDate: '', tags: '' });
    }
    setErrors({});
    setApiErr('');
  }, [isOpen, issue]);

  // Fetch user list for assignee dropdown
  useEffect(() => {
    if (!isOpen) return;
    authAPI.getAllUsers()
      .then((r) => setUsers(r.data.data))
      .catch(() => setUsers([]));
  }, [isOpen]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  }, []);

  const validate = () => {
    const errs = {};
    if (!form.title.trim())                              errs.title = 'Title is required';
    else if (form.title.trim().length < 3)               errs.title = 'Title must be at least 3 characters';
    else if (form.title.trim().length > 200)             errs.title = 'Title cannot exceed 200 characters';
    if (form.description.length > 5000)                  errs.description = 'Description cannot exceed 5000 characters';
    if (form.dueDate && isNaN(Date.parse(form.dueDate))) errs.dueDate = 'Invalid date';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    setApiErr('');

    const payload = {
      title:       form.title.trim(),
      description: form.description.trim(),
      status:      form.status,
      priority:    form.priority,
      type:        form.type,
      assignee:    form.assignee || null,
      dueDate:     form.dueDate  || null,
      tags:        form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
    };

    try {
      let res;
      if (isEditMode) {
        res = await issueAPI.update(issue._id, payload);
      } else {
        res = await issueAPI.create(payload);
      }
      onSaved(res.data.data);
      onClose();
    } catch (err) {
      const serverErr = err.response?.data;
      if (serverErr?.errors) {
        const fieldErrors = {};
        serverErr.errors.forEach(({ field, message }) => { fieldErrors[field] = message; });
        setErrors(fieldErrors);
      } else {
        setApiErr(serverErr?.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay animate-fadeIn"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="issue-modal-title"
    >
      <div className="modal animate-slideUp">
        {/* ── Header ── */}
        <div className="modal-header">
          <h2 id="issue-modal-title" className="modal-title">
            {isEditMode ? '✏️ Edit Issue' : '➕ Create Issue'}
          </h2>
          <button className="modal-close" onClick={onClose} aria-label="Close modal" type="button">✕</button>
        </div>

        {/* ── Body (form) ── */}
        <form className="modal-body" onSubmit={handleSubmit} noValidate>
          {apiErr && <div className="alert alert-error" role="alert">{apiErr}</div>}

          {/* Title */}
          <div className="form-group">
            <label className="form-label" htmlFor="issue-title">
              Title <span className="required">*</span>
            </label>
            <input
              id="issue-title" name="title" type="text"
              className={`form-input ${errors.title ? 'input-error' : ''}`}
              placeholder="Brief, descriptive title…"
              value={form.title} onChange={handleChange} maxLength={200} autoFocus
            />
            {errors.title && <p className="form-error">{errors.title}</p>}
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label" htmlFor="issue-description">Description</label>
            <textarea
              id="issue-description" name="description"
              className={`form-input form-textarea ${errors.description ? 'input-error' : ''}`}
              placeholder="Steps to reproduce, acceptance criteria…"
              value={form.description} onChange={handleChange} rows={4} maxLength={5000}
            />
            <p className="form-hint">{form.description.length} / 5000</p>
            {errors.description && <p className="form-error">{errors.description}</p>}
          </div>

          {/* Status + Priority */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="issue-status">Status</label>
              <select id="issue-status" name="status" className="form-select" value={form.status} onChange={handleChange}>
                <option value="open">🔵 Open</option>
                <option value="in-progress">🟡 In Progress</option>
                <option value="resolved">🟢 Resolved</option>
                <option value="closed">⚫ Closed</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="issue-priority">Priority</label>
              <select id="issue-priority" name="priority" className="form-select" value={form.priority} onChange={handleChange}>
                <option value="low">↓ Low</option>
                <option value="medium">→ Medium</option>
                <option value="high">↑ High</option>
                <option value="critical">🔥 Critical</option>
              </select>
            </div>
          </div>

          {/* Type + Assignee */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="issue-type">Type</label>
              <select id="issue-type" name="type" className="form-select" value={form.type} onChange={handleChange}>
                <option value="bug">🐛 Bug</option>
                <option value="feature">✨ Feature</option>
                <option value="task">✅ Task</option>
                <option value="improvement">⚡ Improvement</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="issue-assignee">Assignee</label>
              <select id="issue-assignee" name="assignee" className="form-select" value={form.assignee} onChange={handleChange}>
                <option value="">— Unassigned —</option>
                {users.map((u) => (
                  <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Due Date + Tags */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="issue-dueDate">Due Date</label>
              <input
                id="issue-dueDate" name="dueDate" type="date"
                className={`form-input ${errors.dueDate ? 'input-error' : ''}`}
                value={form.dueDate} onChange={handleChange}
              />
              {errors.dueDate && <p className="form-error">{errors.dueDate}</p>}
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="issue-tags">Tags</label>
              <input
                id="issue-tags" name="tags" type="text" className="form-input"
                placeholder="ui, backend, auth (comma-separated)"
                value={form.tags} onChange={handleChange}
              />
              <p className="form-hint">Separate with commas</p>
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" className="btn btn-primary" id="issue-modal-submit" disabled={loading}>
              {loading
                ? <><span className="spinner spinner-sm" style={{ borderTopColor: '#fff' }} /> Saving…</>
                : isEditMode ? 'Save Changes' : 'Create Issue'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
