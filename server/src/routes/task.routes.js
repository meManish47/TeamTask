const { Router } = require('express');
const {
  getProjectTasks, createTask, updateTask,
  deleteTask, getMyTasks, getTask, addComment,
} = require('../controllers/task.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = Router();

router.use(authenticate);

router.get('/my', getMyTasks);
router.get('/project/:projectId', getProjectTasks);
router.post('/project/:projectId', createTask);
router.get('/:id', getTask);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);
router.post('/:id/comments', addComment);

module.exports = router;
