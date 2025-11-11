import { Router } from 'express';
import multer from 'multer';
import { createEcho, getFeed, getPendingEchos } from '../controllers/echos.controllers.js';
import { checkAuth } from '../middleware/auth.middleware.js';
const router = Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});
router.use(checkAuth);
router.route('/')
    .post(upload.single('audio'), createEcho); // 'audio' must match FormData key
router.get('/feed', getFeed);
router.get('/pending', getPendingEchos);
export default router;
