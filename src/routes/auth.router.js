import express from 'express'
import { getme, loginUser, logout, registerUser } from '../controllers/auth.controller.js';
import isUserSigned from '../middlewares/isuserSigned.middleware.js'

const router = express.Router();

/**
 * @route POST /api/auth/register
 * @description gester new user
 * @access Public
 */
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', isUserSigned, logout);
router.get('/getme', isUserSigned, getme);

export default router;