import { Router } from 'express';
import { 
  signup, 
  verifyOtp, 
  login, 
  getMyProfile,
  resendOtp,
  requestResetPassword,
  verifyResetOtp,
  resetPassword

} from '../controllers/users.controllers.js';
import { checkAuth } from '../middleware/auth.middleware.js';

const router = Router();


router.post('/signup', signup);
router.post('/verify-otp', verifyOtp);
router.post('/login', login);
router.post('/resend-otp',resendOtp)
router.post('/request-reset-pass',requestResetPassword)
router.post('/verify-reset-otp',verifyResetOtp)
router.post('/reset-password',resetPassword)


router.get('/profile', checkAuth, getMyProfile);

export default router;