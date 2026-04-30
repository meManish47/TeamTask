const ProjectMember = require('../models/ProjectMember');
const Task = require('../models/Task');

exports.getDashboard = async (req, res) => {
  const userId = req.user.id;
  const now = new Date();

  const memberships = await ProjectMember.find({ userId });
  const projectIds = memberships.map(m => m.projectId);

  const [totalTasks, todo, inProgress, done, overdue, myTasks, recentTasks] = await Promise.all([
    Task.countDocuments({ projectId: { $in: projectIds } }),
    Task.countDocuments({ projectId: { $in: projectIds }, status: 'TODO' }),
    Task.countDocuments({ projectId: { $in: projectIds }, status: 'IN_PROGRESS' }),
    Task.countDocuments({ projectId: { $in: projectIds }, status: 'DONE' }),
    Task.countDocuments({ projectId: { $in: projectIds }, status: { $ne: 'DONE' }, dueDate: { $lt: now } }),
    Task.countDocuments({ assigneeId: userId, status: { $ne: 'DONE' } }),
    Task.find({ projectId: { $in: projectIds } })
      .populate('projectId', 'id name color')
      .populate('assigneeId', 'id name')
      .sort({ updatedAt: -1 })
      .limit(8),
  ]);

  res.json({
    stats: { totalTasks, todo, inProgress, done, overdue, myTasks },
    recentTasks: recentTasks.map(t => ({
      ...t.toJSON(),
      project: t.projectId,
      assignee: t.assigneeId,
    })),
    projectCount: projectIds.length,
  });
};
