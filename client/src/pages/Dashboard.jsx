import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import './dashboard.css';

const statusLabel = { TODO: 'To do', IN_PROGRESS: 'In progress', DONE: 'Done' };
const priorityClass = { LOW: 'badge-low', MEDIUM: 'badge-medium', HIGH: 'badge-high' };

function StatCard({ label, value, accent, sub }) {
  return (
    <div className="stat-card" style={{ '--accent': accent }}>
      <div className="stat-label">{label}</div>
      <div className="stat-num">{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
      <div className="stat-bar" />
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard')
      .then(r => setData(r.data))
      .finally(() => setLoading(false));
  }, []);

  const now = new Date();
  const isOverdue = (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== 'DONE';
  const fmtDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>;

  const { stats, recentTasks, projectCount } = data || {};

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p style={{ marginTop: 4 }}>Good to see you, <strong style={{ color: 'var(--text-primary)' }}>{user?.name?.split(' ')[0]}</strong></p>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard label="Total Tasks"   value={stats?.totalTasks ?? 0}  accent="var(--violet)"  sub={`across ${projectCount} projects`} />
        <StatCard label="To Do"         value={stats?.todo ?? 0}         accent="var(--status-todo)" />
        <StatCard label="In Progress"   value={stats?.inProgress ?? 0}   accent="var(--sky)" />
        <StatCard label="Done"          value={stats?.done ?? 0}         accent="var(--emerald)" />
        <StatCard label="Overdue"       value={stats?.overdue ?? 0}      accent="var(--rose)" />
        <StatCard label="Assigned to Me" value={stats?.myTasks ?? 0}    accent="var(--amber)" />
      </div>

      <div className="dash-section">
        <div className="section-header">
          <h2>Recent Activity</h2>
        </div>

        {!recentTasks?.length ? (
          <div className="empty-state">
            <p>No tasks yet. <Link to="/projects">Create a project</Link> to get started.</p>
          </div>
        ) : (
          <div className="task-list">
            {recentTasks.map(task => (
              <Link key={task.id} to={`/tasks/${task.id}`} className="task-row">
                <div className="task-row-left">
                  <span className={`dot dot-${task.status === 'IN_PROGRESS' ? 'progress' : task.status === 'DONE' ? 'done' : 'todo'}`} />
                  <span className="task-row-title" style={task.status === 'DONE' ? { textDecoration: 'line-through', opacity: 0.5 } : {}}>
                    {task.title}
                  </span>
                  {isOverdue(task) && <span className="overdue-chip">Overdue</span>}
                </div>
                <div className="task-row-right">
                  <span className="task-project-tag" style={{ '--c': task.project?.color }}>
                    {task.project?.name}
                  </span>
                  <span className={`badge ${priorityClass[task.priority]}`}>{task.priority}</span>
                  {task.dueDate && (
                    <span className={`task-due ${isOverdue(task) ? 'overdue' : ''}`}>
                      {fmtDate(task.dueDate)}
                    </span>
                  )}
                  {task.assignee && (
                    <div className="avatar" data-tip={task.assignee.name}>
                      {task.assignee.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
