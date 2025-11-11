import { Router } from 'express';
import multer from 'multer';
import { 
  createEcho, 
  getFeed, 
  getPendingEchos ,
  deleteEcho,
  updateEchoCaption,
  getMyEchos
} from '../controllers/echos.controllers.js';
import { checkAuth } from '../middleware/auth.middleware.js';

const router = Router();


const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});


router.use(checkAuth);

router.route('/')
  .post(upload.single('audio'), createEcho); 

router.get('/feed', getFeed);
router.get('/pending', getPendingEchos);

router.delete('/:echoId', deleteEcho);           
router.patch('/:echoId/caption', updateEchoCaption);
router.get("/my-echos", checkAuth, getMyEchos);

export default router;