import { Router } from 'express';
import { getAuditLogs, getDashboardStats } from '../controllers/audit.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

// Admin only
router.get('/logs', authorize('admin'), getAuditLogs);
router.get('/stats', authorize('admin', 'officer'), getDashboardStats);

export default router;
