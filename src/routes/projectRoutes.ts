import express, { RequestHandler } from 'express';
import {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
} from '../controllers/projectController';
import { auth } from '../middleware/auth';

const router = express.Router();

// Public routes
router.get('/', getProjects as RequestHandler);
router.get('/:id', getProject as RequestHandler);

// Protected routes
router.post('/', auth, createProject as RequestHandler);
router.patch('/:id', auth, updateProject as RequestHandler);
router.delete('/:id', auth, deleteProject as RequestHandler);

export default router; 