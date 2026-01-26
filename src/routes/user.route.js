import express from 'express';
import {
  deleteUser,
  getAllUsers,
  getMe,
  getUser,
  loginUser,
  logoutUser,
  refreshTokens,
  registerUser,
  updateUser,
} from '../controllers/user.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/refresh-token', refreshTokens);

router.get('/all', getAllUsers);

router.get('/me', verifyJWT, getMe);
router.post('/logout', verifyJWT, logoutUser);
// router.post('/forgot-password', forgotPassword);
// router.post('/reset-password', resetPassword);
// router.post('/change-password', changePassword);
router.put('/:id', verifyJWT, updateUser);
router.get('/:id', verifyJWT, getUser);
router.delete('/:id', verifyJWT, deleteUser);

export default router;
