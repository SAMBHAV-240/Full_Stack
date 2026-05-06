import { body, param, query, ValidationChain } from 'express-validator';

// Auth validation
export const signupValidation: ValidationChain[] = [
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .matches(/\d/)
    .withMessage('Password must contain a number'),
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be 2-100 characters'),
];

export const loginValidation: ValidationChain[] = [
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

// Board validation
export const createBoardValidation: ValidationChain[] = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Board name must be 1-100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be under 500 characters'),
  body('background')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('Background must be a valid hex color'),
];

export const updateBoardValidation: ValidationChain[] = [
  param('id').isUUID().withMessage('Invalid board ID'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Board name must be 1-100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be under 500 characters'),
  body('background')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('Background must be a valid hex color'),
];

// List validation
export const createListValidation: ValidationChain[] = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('List name must be 1-100 characters'),
  body('boardId')
    .isUUID()
    .withMessage('Valid board ID is required'),
];

export const updateListValidation: ValidationChain[] = [
  param('id').isUUID().withMessage('Invalid list ID'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('List name must be 1-100 characters'),
  body('position')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Position must be a non-negative integer'),
];

// Task validation
export const createTaskValidation: ValidationChain[] = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Task title must be 1-200 characters'),
  body('listId')
    .isUUID()
    .withMessage('Valid list ID is required'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description must be under 2000 characters'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Priority must be low, medium, high, or urgent'),
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Due date must be a valid date'),
  body('labels')
    .optional()
    .isArray()
    .withMessage('Labels must be an array'),
  body('assigneeIds')
    .optional()
    .isArray()
    .withMessage('Assignee IDs must be an array'),
];

export const updateTaskValidation: ValidationChain[] = [
  param('id').isUUID().withMessage('Invalid task ID'),
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Task title must be 1-200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description must be under 2000 characters'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Priority must be low, medium, high, or urgent'),
];

export const moveTaskValidation: ValidationChain[] = [
  param('id').isUUID().withMessage('Invalid task ID'),
  body('listId')
    .isUUID()
    .withMessage('Valid list ID is required'),
  body('position')
    .isInt({ min: 0 })
    .withMessage('Position must be a non-negative integer'),
];

// Common validations
export const idParamValidation: ValidationChain[] = [
  param('id').isUUID().withMessage('Invalid ID'),
];

export const paginationValidation: ValidationChain[] = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be 1-100'),
];

export const searchValidation: ValidationChain[] = [
  ...paginationValidation,
  query('query')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Search query must be under 200 characters'),
];
