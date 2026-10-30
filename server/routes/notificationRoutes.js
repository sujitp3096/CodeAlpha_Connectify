import { Router } from 'express';
import { listNotifications, markRead } from '../controllers/notificationController.js';
import { protect } from '../middleware/auth.js';
const router = Router();
router.use(protect);
router.get('/', listNotifications);
router.patch('/read', markRead);
export default router;
