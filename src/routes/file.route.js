import express from 'express';
import {
  uploadFile,
  generateLink,
  getSharedFile,
  getUserFiles,
  downloadSharedFile,
  deleteFile,
} from '../controllers/file.controller.js';
import { upload } from '../middlewares/multer.middleware.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', verifyJWT, getUserFiles);
router.post('/upload', verifyJWT, upload.single('file'), uploadFile);
router.post('/:id/share', verifyJWT, generateLink);
router.get('/shared/:token', getSharedFile);
router.get('/download/:token', downloadSharedFile);
router.delete('/:id', verifyJWT, deleteFile);

export default router;
