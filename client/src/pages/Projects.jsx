import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import Modal from '../components/Modal';
import './projects.css';

const COLORS = ['#7c5cf6', '#38bdf8', '#34d399', '#fb7185', '#fbbf24', '#a78bfa', '#f97316'];

function CreateProjectModal({ open, onClose, onCreate }) {
  const [form, setForm] = useState({ name: '', description: '', color: COLORS[0] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const r = await api.post('/projects', form);
      onCreate(r.data.project);
      onClose();
      setForm({ name: '', description: '', color: COLORS[0] });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="New Project">
      <form onSubmit={submit}>
        {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}
        <div className="form-group">
          <label htmlFor="proj-name">Project Name</label>
          <input id="proj-name" name="name" value={form.name} onChange={handle} placeholder="e.g. Website Redesign" required autoFocus />
        </div>
        <div className="form-group">
          <label htmlFor="proj-desc">Description (optional)</label>
          <textarea id="proj-desc" name="description" value={form.description} onChange={handle} placeholder="What's this project about?" rows={3} style={{ resize: 'vertical' }} />
        </div>
        <div className="form-group">
          <label>Accent Color</label>
          <div className="color-picker">
            {COLORS.map(c => (
              <button key={c} type="button" className={`color-dot${form.color === c ? ' selected' : ''}`}
                style={{ background: c }} onClick={() => setForm(f => ({ ...f, color: c }))} />
            ))}
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Creating…' : 'Create project'}</button>
        </div>
      </form>
    </Modal>
  );
}

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    api.get('/projects')
      .then(r => setProjects(r.data.projects))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1>Projects</h1>
        <button className="btn btn-primary" id="new-project-btn" onClick={() => setModalOpen(true)}>
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Project
        </button>
      </div>

      {!projects.length ? (
        <div className="empty-state">
          <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path d="M3 7h18M3 12h18M3 17h18"/>
          </svg>
          <h3>No projects yet</h3>
          <p>Create your first project and start assigning tasks.</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setModalOpen(true)}>Create a project</button>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map(p => (
            <Link key={p.id} to={`/projects/${p.id}`} className="project-card">
              <div className="project-card-top">
                <div className="project-color-dot" style={{ background: p.color }} />
                <div className="project-role-badge">{p.myRole}</div>
              </div>
              <h3 className="project-name">{p.name}</h3>
              {p.description && <p className="project-desc">{p.description}</p>}
              <div className="project-meta">
                <span className="meta-item">
                  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
                  {p._count?.tasks ?? 0} tasks
                </span>
                <span className="meta-item">
                  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
                  {p._count?.members ?? 0} members
                </span>
              </div>
              <div className="project-owner">by {p.owner?.name}</div>
            </Link>
          ))}
        </div>
      )}

      <CreateProjectModal open={modalOpen} onClose={() => setModalOpen(false)} onCreate={(p) => setProjects(prev => [p, ...prev])} />
    </div>
  );
}
