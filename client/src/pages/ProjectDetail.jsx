import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import Modal from '../components/Modal';
import './project-detail.css';

const STATUSES = ['TODO', 'IN_PROGRESS', 'DONE'];
const STATUS_LABEL = { TODO: 'To Do', IN_PROGRESS: 'In Progress', DONE: 'Done' };
const STATUS_DOT = { TODO: 'dot-todo', IN_PROGRESS: 'dot-progress', DONE: 'dot-done' };
const PRIORITY_CLASS = { LOW: 'badge-low', MEDIUM: 'badge-medium', HIGH: 'badge-high' };

// ─── Invite Member Modal ────────────────────────────────────────────────────
function InviteMemberModal({ open, onClose, projectId, onInvited }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('MEMBER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const r = await api.post(`/projects/${projectId}/members`, { email, role });
      onInvited(r.data.member);
      onClose(); setEmail('');
    } catch (err) { setError(err.response?.data?.error || 'Failed'); }
    finally { setLoading(false); }
  };
  return (
    <Modal open={open} onClose={onClose} title="Invite Member">
      <form onSubmit={submit}>
        {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}
        <div className="form-group">
          <label>Email address</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="team@example.com" required autoFocus />
        </div>
        <div className="form-group">
          <label>Role</label>
          <select value={role} onChange={e => setRole(e.target.value)}>
            <option value="MEMBER">Member</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Inviting…' : 'Invite'}</button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Create Task Modal ──────────────────────────────────────────────────────
function CreateTaskModal({ open, onClose, projectId, members, onCreated }) {
  const [form, setForm] = useState({ title: '', description: '', priority: 'MEDIUM', dueDate: '', assigneeId: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const r = await api.post(`/tasks/project/${projectId}`, form);
      onCreated(r.data.task);
      onClose();
      setForm({ title: '', description: '', priority: 'MEDIUM', dueDate: '', assigneeId: '' });
    } catch (err) { setError(err.response?.data?.error || 'Failed'); }
    finally { setLoading(false); }
  };
  return (
    <Modal open={open} onClose={onClose} title="Create Task" width={520}>
      <form onSubmit={submit}>
        {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}
        <div className="form-group">
          <label>Title</label>
          <input name="title" value={form.title} onChange={handle} placeholder="What needs to be done?" required autoFocus />
        </div>
        <div className="form-group">
          <label>Description (optional)</label>
          <textarea name="description" value={form.description} onChange={handle} placeholder="Add details…" rows={3} style={{ resize: 'vertical' }} />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Priority</label>
            <select name="priority" value={form.priority} onChange={handle}>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>
          <div className="form-group">
            <label>Due Date</label>
            <input type="date" name="dueDate" value={form.dueDate} onChange={handle} />
          </div>
        </div>
        <div className="form-group">
          <label>Assign to</label>
          <select name="assigneeId" value={form.assigneeId} onChange={handle}>
            <option value="">Unassigned</option>
            {members.map(m => <option key={m.userId} value={m.userId}>{m.user.name}</option>)}
          </select>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Creating…' : 'Create task'}</button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Kanban Card ────────────────────────────────────────────────────────────
function TaskCard({ task, onDragStart, myRole, currentUser }) {
  const now = new Date();
  const overdue = task.dueDate && new Date(task.dueDate) < now && task.status !== 'DONE';
  const fmtDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const canDrag = myRole === 'ADMIN' || (task.assignee && (task.assignee.id === currentUser?.id || task.assignee._id === currentUser?.id));

  return (
    <Link
      to={`/tasks/${task.id}`}
      className={`kanban-card ${canDrag ? '' : 'no-drag'}`}
      draggable={canDrag}
      onDragStart={(e) => { 
        if (!canDrag) { e.preventDefault(); return; }
        e.dataTransfer.setData('taskId', task.id); 
        onDragStart(task); 
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="kcard-top">
        <span className={`badge ${PRIORITY_CLASS[task.priority]}`}>{task.priority}</span>
        {task._count?.comments > 0 && (
          <span className="kcard-comments">
            <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
            </svg>
            {task._count.comments}
          </span>
        )}
      </div>
      <p className="kcard-title">{task.title}</p>
      <div className="kcard-bottom">
        {task.dueDate && (
          <span className={`kcard-due ${overdue ? 'overdue' : ''}`}>{fmtDate(task.dueDate)}</span>
        )}
        {task.assignee && (
          <div className="avatar" style={{ marginLeft: 'auto' }} title={task.assignee.name}>
            {task.assignee.name.slice(0, 2).toUpperCase()}
          </div>
        )}
      </div>
    </Link>
  );
}

// ─── Kanban Column ──────────────────────────────────────────────────────────
function KanbanColumn({ status, tasks, onDrop, myRole, onDragStart, currentUser }) {
  const [dragOver, setDragOver] = useState(false);

  return (
    <div
      className={`kanban-col${dragOver ? ' drag-over' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const taskId = e.dataTransfer.getData('taskId');
        if (taskId) onDrop(taskId, status);
      }}
    >
      <div className="col-header">
        <div className="col-title">
          <span className={`dot ${STATUS_DOT[status]}`} />
          <span>{STATUS_LABEL[status]}</span>
        </div>
        <span className="col-count">{tasks.length}</span>
      </div>
      <div className="col-cards">
        {tasks.map(t => <TaskCard key={t.id} task={t} onDragStart={onDragStart} myRole={myRole} currentUser={currentUser} />)}
        {tasks.length === 0 && (
          <div className="col-empty">Drop tasks here</div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────
export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState('board'); // 'board' | 'members'
  const [taskModal, setTaskModal]     = useState(false);
  const [inviteModal, setInviteModal] = useState(false);

  const load = useCallback(async () => {
    const [pRes, tRes] = await Promise.all([
      api.get(`/projects/${id}`),
      api.get(`/tasks/project/${id}`),
    ]);
    setProject(pRes.data.project);
    setTasks(tRes.data.tasks);
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleDrop = async (taskId, newStatus) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.status === newStatus) return;
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    try { await api.put(`/tasks/${taskId}`, { status: newStatus }); }
    catch { setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: task.status } : t)); }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${project.name}"? This cannot be undone.`)) return;
    await api.delete(`/projects/${id}`);
    navigate('/projects');
  };

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>;
  if (!project) return <div className="empty-state"><p>Project not found.</p></div>;

  const isAdmin = project.myRole === 'ADMIN';
  const tasksByStatus = STATUSES.reduce((acc, s) => ({ ...acc, [s]: tasks.filter(t => t.status === s) }), {});

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="proj-color-badge" style={{ background: project.color }} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Link to="/projects" style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Projects</Link>
              <span style={{ color: 'var(--text-muted)' }}>/</span>
              <h1 style={{ fontSize: '1.1rem' }}>{project.name}</h1>
            </div>
            {project.description && <p style={{ fontSize: '0.8rem', marginTop: 2 }}>{project.description}</p>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {isAdmin && (
            <>
              <button className="btn btn-ghost btn-sm" onClick={() => setInviteModal(true)}>Invite</button>
              <button className="btn btn-primary btn-sm" onClick={() => setTaskModal(true)}>
                + New Task
              </button>
              <button className="btn btn-danger btn-sm" onClick={handleDelete}>Delete</button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="detail-tabs">
        <button className={`tab-btn${tab === 'board' ? ' active' : ''}`} onClick={() => setTab('board')}>Board</button>
        <button className={`tab-btn${tab === 'members' ? ' active' : ''}`} onClick={() => setTab('members')}>
          Members <span className="tab-count">{project.members?.length}</span>
        </button>
      </div>

      {/* Board */}
      {tab === 'board' && (
        <div className="kanban-board">
          {STATUSES.map(s => (
            <KanbanColumn
              key={s}
              status={s}
              tasks={tasksByStatus[s]}
              onDrop={handleDrop}
              myRole={project.myRole}
              onDragStart={() => {}}
              currentUser={user}
            />
          ))}
        </div>
      )}

      {/* Members */}
      {tab === 'members' && (
        <div className="members-list">
          {project.members.map(m => (
            <div key={m.id} className="member-row">
              <div className="avatar avatar-lg">{m.user.name.slice(0, 2).toUpperCase()}</div>
              <div className="member-info">
                <span className="member-name">{m.user.name}</span>
                <span className="member-email">{m.user.email}</span>
              </div>
              <span className={`member-role ${m.role === 'ADMIN' ? 'role-admin' : 'role-member'}`}>{m.role}</span>
              {isAdmin && m.userId !== project.ownerId && (
                <button className="btn btn-danger btn-sm" onClick={async () => {
                  await api.delete(`/projects/${id}/members/${m.userId}`);
                  setProject(p => ({ ...p, members: p.members.filter(x => x.id !== m.id) }));
                }}>Remove</button>
              )}
            </div>
          ))}
        </div>
      )}

      <CreateTaskModal open={taskModal} onClose={() => setTaskModal(false)} projectId={id} members={project.members}
        onCreated={(t) => { setTasks(prev => [t, ...prev]); }} />
      <InviteMemberModal open={inviteModal} onClose={() => setInviteModal(false)} projectId={id}
        onInvited={(m) => setProject(p => ({ ...p, members: [...p.members, m] }))} />
    </div>
  );
}
