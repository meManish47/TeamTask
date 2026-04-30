import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

const PRIORITY_CLASS = { LOW: 'badge-low', MEDIUM: 'badge-medium', HIGH: 'badge-high' };
const STATUS_LABEL = { TODO: 'To Do', IN_PROGRESS: 'In Progress', DONE: 'Done' };

export default function MyTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/tasks/my')
      .then(r => setTasks(r.data.tasks || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1>My Tasks</h1>
      </div>

      {tasks.length === 0 ? (
        <div className="empty-state">
          <p>You have no pending tasks assigned to you!</p>
        </div>
      ) : (
        <div className="task-list">
          {tasks.map(task => {
            const now = new Date();
            const overdue = task.dueDate && new Date(task.dueDate) < now && task.status !== 'DONE';
            
            return (
              <Link key={task.id} to={`/tasks/${task.id}`} className="task-row">
                <div className="task-row-left">
                  <span className={`badge ${PRIORITY_CLASS[task.priority]}`}>{task.priority}</span>
                  <strong>{task.title}</strong>
                  {task.project && (
                    <span className="task-project-tag">
                      {task.project.name}
                    </span>
                  )}
                </div>
                <div className="task-row-right">
                  <span>{STATUS_LABEL[task.status]}</span>
                  {task.dueDate && (
                    <span className={`task-due ${overdue ? 'overdue' : ''}`}>
                      {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
