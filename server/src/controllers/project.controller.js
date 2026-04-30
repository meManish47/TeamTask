const Project = require('../models/Project');
const ProjectMember = require('../models/ProjectMember');
const Task = require('../models/Task');
const User = require('../models/User');

const getMembership = (projectId, userId) =>
  ProjectMember.findOne({ projectId, userId });

const withCounts = async (project, myRole) => {
  const [taskCount, memberCount] = await Promise.all([
    Task.countDocuments({ projectId: project._id }),
    ProjectMember.countDocuments({ projectId: project._id }),
  ]);
  return {
    ...project.toJSON(),
    _count: { tasks: taskCount, members: memberCount },
    myRole,
    owner: project.ownerId, // populated
  };
};

exports.getProjects = async (req, res) => {
  const memberships = await ProjectMember.find({ userId: req.user.id })
    .populate({ path: 'projectId', populate: { path: 'ownerId', select: 'id name email' } })
    .sort({ joinedAt: -1 });

  const projects = await Promise.all(
    memberships
      .filter(m => m.projectId) // guard against orphans
      .map(m => withCounts(m.projectId, m.role))
  );
  res.json({ projects });
};

exports.createProject = async (req, res) => {
  const { name, description, color } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Project name is required' });

  const project = await Project.create({
    name: name.trim(),
    description: description?.trim(),
    color: color || '#7c5cf6',
    ownerId: req.user.id,
  });

  await ProjectMember.create({ projectId: project._id, userId: req.user.id, role: 'ADMIN' });

  res.status(201).json({
    project: { ...project.toJSON(), _count: { tasks: 0, members: 1 }, myRole: 'ADMIN' },
  });
};

exports.getProject = async (req, res) => {
  const membership = await getMembership(req.params.id, req.user.id);
  if (!membership) return res.status(403).json({ error: 'Access denied' });

  const project = await Project.findById(req.params.id)
    .populate('ownerId', 'id name email');
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const members = await ProjectMember.find({ projectId: req.params.id })
    .populate('userId', 'id name email')
    .sort({ joinedAt: 1 });

  const membersFormatted = members.map(m => ({
    id: m.id,
    userId: m.userId?._id?.toString() || m.userId?.toString(),
    role: m.role,
    joinedAt: m.joinedAt,
    user: m.userId,
  }));

  res.json({
    project: {
      ...project.toJSON(),
      owner: project.ownerId,
      members: membersFormatted,
      myRole: membership.role,
    },
  });
};

exports.updateProject = async (req, res) => {
  const membership = await getMembership(req.params.id, req.user.id);
  if (!membership || membership.role !== 'ADMIN')
    return res.status(403).json({ error: 'Only admins can update projects' });

  const { name, description, color } = req.body;
  const project = await Project.findByIdAndUpdate(
    req.params.id,
    { name: name?.trim(), description: description?.trim(), color },
    { new: true }
  );
  res.json({ project });
};

exports.deleteProject = async (req, res) => {
  const membership = await getMembership(req.params.id, req.user.id);
  if (!membership || membership.role !== 'ADMIN')
    return res.status(403).json({ error: 'Only admins can delete projects' });

  await Promise.all([
    Project.findByIdAndDelete(req.params.id),
    ProjectMember.deleteMany({ projectId: req.params.id }),
    Task.deleteMany({ projectId: req.params.id }),
  ]);
  res.json({ message: 'Project deleted' });
};

exports.inviteMember = async (req, res) => {
  const membership = await getMembership(req.params.id, req.user.id);
  if (!membership || membership.role !== 'ADMIN')
    return res.status(403).json({ error: 'Only admins can invite members' });

  const { email, role } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ error: 'No user found with that email' });

  const existing = await getMembership(req.params.id, user._id);
  if (existing) return res.status(409).json({ error: 'User is already a member' });

  const member = await ProjectMember.create({
    projectId: req.params.id,
    userId: user._id,
    role: role || 'MEMBER',
  });

  res.status(201).json({
    member: {
      id: member.id,
      userId: user.id,
      role: member.role,
      joinedAt: member.joinedAt,
      user: { id: user.id, name: user.name, email: user.email },
    },
  });
};

exports.removeMember = async (req, res) => {
  const membership = await getMembership(req.params.id, req.user.id);
  if (!membership || membership.role !== 'ADMIN')
    return res.status(403).json({ error: 'Only admins can remove members' });

  const project = await Project.findById(req.params.id);
  if (project.ownerId.toString() === req.params.userId)
    return res.status(400).json({ error: 'Cannot remove the project owner' });

  await ProjectMember.findOneAndDelete({ projectId: req.params.id, userId: req.params.userId });
  res.json({ message: 'Member removed' });
};
