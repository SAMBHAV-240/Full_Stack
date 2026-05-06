import { Router } from 'express';
import {
  createList,
  updateList,
  deleteList,
  reorderLists,
} from '../controllers/listController';
import { authenticate } from '../middleware/auth';
import { handleValidationErrors } from '../middleware/errorHandler';
import {
  createListValidation,
  updateListValidation,
  idParamValidation,
} from '../middleware/validation';
import { asyncHandler } from '../utils/response';

const router = Router();

// All routes require authentication
router.use(authenticate);

// List CRUD
router.post('/', createListValidation, handleValidationErrors, asyncHandler(createList));
router.put('/:id', updateListValidation, handleValidationErrors, asyncHandler(updateList));
router.delete('/:id', idParamValidation, handleValidationErrors, asyncHandler(deleteList));

// Reorder lists in a board
router.put('/board/:boardId/reorder', asyncHandler(reorderLists));

export default router;
