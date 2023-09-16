import { Router } from 'express';
import * as paycontroller from '../../controllers/client/paymentcontroller.js'
import * as authMiddleware from '../../middlewares/auth.js';
const router=Router();

router.get('/pay',authMiddleware.cookieChecker,paycontroller)
router.post('/paycustomer',authMiddleware.cookieChecker,paycontroller)

export default router;