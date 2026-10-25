import { Router } from 'express';
import {
  recordViolation,
  getViolations,
  getViolationById,
  payViolation,
  disputeViolation,
  resolveDispute,
  getDisputes,
  verifyViolationIntegrity,
} from '../controllers/violation.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

// Violations list & detail
router.get('/', getViolations);
router.get('/disputes', getDisputes);
router.get('/:id', getViolationById);
router.get('/:id/verify-integrity', verifyViolationIntegrity);

// Officer records violation
router.post('/', authorize('officer'), recordViolation);

// Driver actions
router.post('/:id/pay', authorize('driver'), payViolation);
router.post('/:id/dispute', authorize('driver'), disputeViolation);

// Admin resolves dispute
router.patch('/disputes/:disputeId/resolve', authorize('admin'), resolveDispute);

export default router;
