const { Router } = require('express');
const {
  getProjects, createProject, getProject,
  updateProject, deleteProject, inviteMember, removeMember,
} = require('../controllers/project.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = Router();

router.use(authenticate);

router.get('/', getProjects);
router.post('/', createProject);
router.get('/:id', getProject);
router.put('/:id', updateProject);
router.delete('/:id', deleteProject);
router.post('/:id/members', inviteMember);
router.delete('/:id/members/:userId', removeMember);

module.exports = router;
