import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import './task-detail.css';

const PRIORITY_CLASS = { LOW: 'badge-low', MEDIUM: 'badge-medium', HIGH: 'badge-high' };
const STATUS_OPTIONS = ['TODO', 'IN_PROGRESS', 'DONE'];
const STATUS_LABEL   = { TODO: 'To Do', IN_PROGRESS: 'In Progress', DONE: 'Done' };

export default function TaskDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate  = useNavigate();
  const [task, setTask]       = useState(null);
  const [myRole, setMyRole]   = useState('MEMBER');
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [saving, setSaving]   = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    api.get(`/tasks/${id}`)
      .then(r => {
        setTask(r.data.task);
        setMyRole(r.data.myRole);
        setEditForm({
          title: r.data.task.title,
          description: r.data.task.description || '',
          priority: r.data.task.priority,
          status: r.data.task.status,
          dueDate: r.data.task.dueDate ? r.data.task.dueDate.slice(0, 10) : '',
          assigneeId: r.data.task.assigneeId || '',
        });
      })
      .finally(() => setLoading(false));
  }, [id]);

  const saveStatus = async (status) => {
    setTask(t => ({ ...t, status }));
    await api.put(`/tasks/${id}`, { status });
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      const r = await api.put(`/tasks/${id}`, editForm);
      setTask(r.data.task);
      setEditing(false);
    } finally { setSaving(false); }
  };

  const deleteTask = async () => {
    if (!window.confirm('Delete this task?')) return;
    await api.delete(`/tasks/${id}`);
    navigate(`/projects/${task.projectId}`);
  };

  const postComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setSaving(true);
    try {
      const r = await api.post(`/tasks/${id}/comments`, { content: comment });
      setTask(t => ({ ...t, comments: [...(t.comments || []), r.data.comment] }));
      setComment('');
    } finally { setSaving(false); }
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—';
  const isAdmin = myRole === 'ADMIN';
  const now = new Date();
  const overdue = task?.dueDate && new Date(task.dueDate) < now && task.status !== 'DONE';

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>;
  if (!task) return <div className="empty-state"><p>Task not found.</p></div>;

  return (
    <div className="task-detail">
      <div className="td-breadcrumb">
        <Link to="/projects">Projects</Link>
        <span>/</span>
        <Link to={`/projects/${task.project?.id}`}>{task.project?.name}</Link>
        <span>/</span>
        <span>Task</span>
      </div>

      <div className="td-layout">
        {/* Left — Main content */}
        <div className="td-main">
          {editing ? (
            <div className="td-edit-form">
              <div className="form-group">
                <label>Title</label>
                <input value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea rows={5} value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} style={{ resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary btn-sm" onClick={saveEdit} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <>
              <div className="td-title-row">
                <h1 className="td-title">{task.title}</h1>
                {isAdmin && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={deleteTask}>Delete</button>
                  </div>
                )}
              </div>
              <p className="td-description">{task.description || <em style={{ color: 'var(--text-muted)' }}>No description provided.</em>}</p>
            </>
          )}

          <hr className="divider" />

          {/* Comments */}
          <div className="td-comments">
            <h3 style={{ marginBottom: 16, fontSize: '0.875rem' }}>Comments <span className="col-count">{task.comments?.length ?? 0}</span></h3>

            {task.comments?.map(c => (
              <div key={c.id} className="comment-item">
                <div className="avatar">{c.author.name.slice(0, 2).toUpperCase()}</div>
                <div className="comment-body">
                  <div className="comment-meta">
                    <span className="comment-author">{c.author.name}</span>
                    <span className="comment-time">{new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </div>
                  <p className="comment-content">{c.content}</p>
                </div>
              </div>
            ))}

            <form onSubmit={postComment} className="comment-form">
              <div className="avatar">{user?.name?.slice(0, 2).toUpperCase()}</div>
              <div style={{ flex: 1, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Add a comment…"
                  rows={2}
                  style={{ resize: 'none', flex: 1 }}
                />
                <button type="submit" className="btn btn-primary btn-sm" disabled={saving || !comment.trim()}>Post</button>
              </div>
            </form>
          </div>
        </div>

        {/* Right — Sidebar metadata */}
        <div className="td-sidebar">
          <div className="td-meta-section">
            <div className="td-meta-label">Status</div>
            <select 
              className="td-meta-select" 
              value={task.status} 
              onChange={e => saveStatus(e.target.value)}
              disabled={!isAdmin && task.assignee?.id !== user?.id && task.assignee?._id !== user?.id}
            >
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
            </select>
          </div>

          <div className="td-meta-section">
            <div className="td-meta-label">Priority</div>
            <span className={`badge ${PRIORITY_CLASS[task.priority]}`}>{task.priority}</span>
          </div>

          <div className="td-meta-section">
            <div className="td-meta-label">Due Date</div>
            <span className={`td-meta-value ${overdue ? 'overdue' : ''}`}>{fmtDate(task.dueDate)}</span>
          </div>

          <div className="td-meta-section">
            <div className="td-meta-label">Assignee</div>
            {task.assignee ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className="avatar">{task.assignee.name.slice(0, 2).toUpperCase()}</div>
                <span className="td-meta-value">{task.assignee.name}</span>
              </div>
            ) : <span className="td-meta-value" style={{ color: 'var(--text-muted)' }}>Unassigned</span>}
          </div>

          <div className="td-meta-section">
            <div className="td-meta-label">Created by</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="avatar">{task.createdBy?.name.slice(0, 2).toUpperCase()}</div>
              <span className="td-meta-value">{task.createdBy?.name}</span>
            </div>
          </div>

          <div className="td-meta-section">
            <div className="td-meta-label">Created</div>
            <span className="td-meta-value">{fmtDate(task.createdAt)}</span>
          </div>

          <div className="td-meta-section">
            <div className="td-meta-label">Project</div>
            <Link to={`/projects/${task.project?.id}`} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div className="project-color-dot" style={{ background: task.project?.color, width: 8, height: 8, borderRadius: '50%', display: 'inline-block' }} />
              <span style={{ fontSize: '0.85rem' }}>{task.project?.name}</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
