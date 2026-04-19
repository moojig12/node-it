import { Router } from 'express';
import {
  listNodes,
  getNode,
  createNode,
  updateNode,
  deleteNode,
} from '../controllers/nodeController.js';
import { validate } from '../middleware/validate.js';
import { createNodeSchema, updateNodeSchema } from '../validators/nodeSchemas.js';

const router = Router();

router.get('/', listNodes);
router.get('/:id', getNode);
router.post('/', validate(createNodeSchema), createNode);
router.patch('/:id', validate(updateNodeSchema), updateNode);
router.delete('/:id', deleteNode);

export default router;
