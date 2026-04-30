const Task = require('../models/Task');
const Comment = require('../models/Comment');
const ProjectMember = require('../models/ProjectMember');

const getMembership = (projectId, userId) =>
  ProjectMember.findOne({ projectId, userId });

const populateTask = (query) =>
  query
    .populate('assigneeId', 'id name email')
    .populate('createdById', 'id name');

exports.getProjectTasks = async (req, res) => {
  const membership = await getMembership(req.params.projectId, req.user.id);
  if (!membership) return res.status(403).json({ error: 'Access denied' });

  const tasks = await populateTask(Task.find({ projectId: req.params.projectId }))
    .sort({ createdAt: -1 });

  // Attach comment counts
  const taskIds = tasks.map(t => t._id);
  const commentCounts = await Comment.aggregate([
    { $match: { taskId: { $in: taskIds } } },
    { $group: { _id: '$taskId', count: { $sum: 1 } } },
  ]);
  const countMap = Object.fromEntries(commentCounts.map(c => [c._id.toString(), c.count]));

  const result = tasks.map(t => ({
    ...t.toJSON(),
    assignee: t.assigneeId,
    createdBy: t.createdById,
    _count: { comments: countMap[t._id.toString()] || 0 },
  }));

  res.json({ tasks: result });
};

exports.createTask = async (req, res) => {
  const membership = await getMembership(req.params.projectId, req.user.id);
  if (!membership || membership.role !== 'ADMIN')
    return res.status(403).json({ error: 'Only admins can create tasks' });

  const { title, description, priority, dueDate, assigneeId } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: 'Title is required' });

  const task = await Task.create({
    title: title.trim(),
    description: description?.trim(),
    priority: priority || 'MEDIUM',
    dueDate: dueDate ? new Date(dueDate) : null,
    projectId: req.params.projectId,
    assigneeId: assigneeId || null,
    createdById: req.user.id,
  });

  const populated = await populateTask(Task.findById(task._id));
  res.status(201).json({
    task: {
      ...populated.toJSON(),
      assignee: populated.assigneeId,
      createdBy: populated.createdById,
      _count: { comments: 0 },
    },
  });
};

exports.updateTask = async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const membership = await getMembership(task.projectId, req.user.id);
  if (!membership) return res.status(403).json({ error: 'Access denied' });

  let updates;
  if (membership.role === 'ADMIN') {
    const { title, description, status, priority, dueDate, assigneeId } = req.body;
    updates = {
      ...(title && { title: title.trim() }),
      ...(description !== undefined && { description: description?.trim() }),
      ...(status    && { status }),
      ...(priority  && { priority }),
      ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
      ...(assigneeId !== undefined && { assigneeId: assigneeId || null }),
    };
  } else {
    const { status } = req.body;
    if (!status) return res.status(403).json({ error: 'Members can only update task status' });
    if (task.assigneeId?.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Members can only update tasks assigned to them' });
    }
    updates = { status };
  }

  const updated = await populateTask(
    Task.findByIdAndUpdate(req.params.id, updates, { new: true })
  );
  const commentCount = await Comment.countDocuments({ taskId: req.params.id });

  res.json({
    task: {
      ...updated.toJSON(),
      assignee: updated.assigneeId,
      createdBy: updated.createdById,
      _count: { comments: commentCount },
    },
  });
};

exports.deleteTask = async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const membership = await getMembership(task.projectId, req.user.id);
  if (!membership || membership.role !== 'ADMIN')
    return res.status(403).json({ error: 'Only admins can delete tasks' });

  await Promise.all([
    Task.findByIdAndDelete(req.params.id),
    Comment.deleteMany({ taskId: req.params.id }),
  ]);
  res.json({ message: 'Task deleted' });
};

exports.getMyTasks = async (req, res) => {
  const tasks = await Task.find({ assigneeId: req.user.id })
    .populate('projectId', 'id name color')
    .sort({ dueDate: 1 });

  const taskIds = tasks.map(t => t._id);
  const counts = await Comment.aggregate([
    { $match: { taskId: { $in: taskIds } } },
    { $group: { _id: '$taskId', count: { $sum: 1 } } },
  ]);
  const countMap = Object.fromEntries(counts.map(c => [c._id.toString(), c.count]));

  res.json({
    tasks: tasks.map(t => ({
      ...t.toJSON(),
      project: t.projectId,
      _count: { comments: countMap[t._id.toString()] || 0 },
    })),
  });
};

exports.getTask = async (req, res) => {
  const task = await Task.findById(req.params.id)
    .populate('assigneeId', 'id name email')
    .populate('createdById', 'id name email')
    .populate('projectId', 'id name color');

  if (!task) return res.status(404).json({ error: 'Task not found' });

  const membership = await getMembership(task.projectId, req.user.id);
  if (!membership) return res.status(403).json({ error: 'Access denied' });

  const comments = await Comment.find({ taskId: task._id })
    .populate('authorId', 'id name')
    .sort({ createdAt: 1 });

  res.json({
    task: {
      ...task.toJSON(),
      assignee: task.assigneeId,
      createdBy: task.createdById,
      project: task.projectId,
      comments: comments.map(c => ({ ...c.toJSON(), author: c.authorId })),
    },
    myRole: membership.role,
  });
};

exports.addComment = async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const membership = await getMembership(task.projectId, req.user.id);
  if (!membership) return res.status(403).json({ error: 'Access denied' });

  const { content } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: 'Comment cannot be empty' });

  const comment = await Comment.create({ content: content.trim(), taskId: task._id, authorId: req.user.id });
  const populated = await Comment.findById(comment._id).populate('authorId', 'id name');

  res.status(201).json({
    comment: { ...populated.toJSON(), author: populated.authorId },
  });
};
