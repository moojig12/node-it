import { Router } from 'express';
import {
  listNodes,
  getNode,
  getNodeSubtree,
  getNodeAggregate,
  createNode,
  updateNode,
  reorderNodes,
  deleteNode,
} from '../controllers/nodeController.js';
import { validate } from '../middleware/validate.js';
import {
  createNodeSchema,
  updateNodeSchema,
  reorderNodesSchema,
} from '../validators/nodeSchemas.js';

const router = Router();

router.get('/', listNodes);
router.get('/:id', getNode);
router.get('/:id/subtree', getNodeSubtree);
router.get('/:id/aggregate', getNodeAggregate);
router.post('/', validate(createNodeSchema), createNode);
router.post('/reorder', validate(reorderNodesSchema), reorderNodes);
router.patch('/:id', validate(updateNodeSchema), updateNode);
router.delete('/:id', deleteNode);

export default router;
