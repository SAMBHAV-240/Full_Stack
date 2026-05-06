import { Router } from 'express';
import {
  createBoard,
  getBoards,
  getBoard,
  updateBoard,
  deleteBoard,
  addBoardMember,
  removeBoardMember,
  getBoardActivities,
} from '../controllers/boardController';
import { authenticate } from '../middleware/auth';
import { handleValidationErrors } from '../middleware/errorHandler';
import {
  createBoardValidation,
  updateBoardValidation,
  idParamValidation,
  paginationValidation,
} from '../middleware/validation';
import { asyncHandler } from '../utils/response';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Board CRUD
router.post('/', createBoardValidation, handleValidationErrors, asyncHandler(createBoard));
router.get('/', paginationValidation, handleValidationErrors, asyncHandler(getBoards));
router.get('/:id', idParamValidation, handleValidationErrors, asyncHandler(getBoard));
router.put('/:id', updateBoardValidation, handleValidationErrors, asyncHandler(updateBoard));
router.delete('/:id', idParamValidation, handleValidationErrors, asyncHandler(deleteBoard));

// Board members
router.post('/:id/members', idParamValidation, handleValidationErrors, asyncHandler(addBoardMember));
router.delete(
  '/:id/members/:memberId',
  idParamValidation,
  handleValidationErrors,
  asyncHandler(removeBoardMember)
);

// Board activities
router.get(
  '/:id/activities',
  idParamValidation,
  paginationValidation,
  handleValidationErrors,
  asyncHandler(getBoardActivities)
);

export default router;
