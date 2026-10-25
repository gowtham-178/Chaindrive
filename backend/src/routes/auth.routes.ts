import { Router } from 'express';
import {
  register,
  login,
  refresh,
  logout,
  getMe,
  updateWallet,
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);
router.patch('/wallet', authenticate, updateWallet);

export default router;
