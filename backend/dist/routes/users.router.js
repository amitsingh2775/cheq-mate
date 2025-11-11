import { Router } from 'express';
import { signup, verifyOtp, login, getMyProfile } from '../controllers/users.controllers.js';
import { checkAuth } from '../middleware/auth.middleware.js';
const router = Router();
router.post('/signup', signup);
router.post('/verify-otp', verifyOtp);
router.post('/login', login);
router.get('/profile', checkAuth, getMyProfile);
export default router;
