import { Router } from 'express';
import {
  createTask,
  getTask,
  updateTask,
  deleteTask,
  moveTask,
  assignTask,
  unassignTask,
  addComment,
  searchTasks,
} from '../controllers/taskController';
import { authenticate } from '../middleware/auth';
import { handleValidationErrors } from '../middleware/errorHandler';
import {
  createTaskValidation,
  updateTaskValidation,
  moveTaskValidation,
  idParamValidation,
  searchValidation,
} from '../middleware/validation';
import { asyncHandler } from '../utils/response';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Search tasks
router.get('/search', searchValidation, handleValidationErrors, asyncHandler(searchTasks));

// Task CRUD
router.post('/', createTaskValidation, handleValidationErrors, asyncHandler(createTask));
router.get('/:id', idParamValidation, handleValidationErrors, asyncHandler(getTask));
router.put('/:id', updateTaskValidation, handleValidationErrors, asyncHandler(updateTask));
router.delete('/:id', idParamValidation, handleValidationErrors, asyncHandler(deleteTask));

// Move task
router.put('/:id/move', moveTaskValidation, handleValidationErrors, asyncHandler(moveTask));

// Assignees
router.post('/:id/assignees', idParamValidation, handleValidationErrors, asyncHandler(assignTask));
router.delete(
  '/:id/assignees/:assigneeId',
  idParamValidation,
  handleValidationErrors,
  asyncHandler(unassignTask)
);

// Comments
router.post('/:id/comments', idParamValidation, handleValidationErrors, asyncHandler(addComment));

export default router;
