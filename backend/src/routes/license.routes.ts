import { Router } from 'express';
import {
  applyLicense,
  getApplications,
  reviewApplication,
  issueLicense,
  suspendLicense,
  revokeLicense,
  getMyLicense,
  getLicenseByNumber,
  verifyLicensePublic,
} from '../controllers/license.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// Public verification
router.get('/verify', verifyLicensePublic);
router.get('/verify/:licenseNumber', verifyLicensePublic);

// Authenticated routes
router.use(authenticate);

// Driver routes
router.post('/apply', authorize('driver'), applyLicense);
router.get('/me', authorize('driver'), getMyLicense);

// Admin routes
router.get('/applications', authorize('admin'), getApplications);
router.patch('/applications/:id/review', authorize('admin'), reviewApplication);
router.post('/applications/:id/issue', authorize('admin'), issueLicense);
router.patch('/:id/suspend', authorize('admin'), suspendLicense);
router.patch('/:id/revoke', authorize('admin'), revokeLicense);

// Admin & Officer lookup
router.get('/:licenseNumber', authorize('admin', 'officer'), getLicenseByNumber);

export default router;
