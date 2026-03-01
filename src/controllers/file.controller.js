import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';
import AppResponse from '../utils/AppResponse.js';
import cloudinary from '../services/cloudinary.service.js';
import fs from 'fs/promises';
import logger from '../../config/logger.config.js';
import fileModel from '../models/file.model.js';
import { v4 as uuid } from 'uuid';
import axios from 'axios';

export const uploadFile = catchAsync(async (req, res) => {
  const file = req.file;

  if (!file) throw new AppError('No file provided', 400);

  try {
    const result = await cloudinary.uploader.upload(file.path, {
      resource_type: 'raw',
      folder: 'file_copier_uploads',
    });

    const createdFile = await fileModel.create({
      fileName: `${req.file.originalname}`,
      filePath: result.secure_url,
      fileSize: req.file.size,
      fileType: req.file.mimetype,
      owner: req.user._id,
    });

    await fs.unlink(file.path);

    logger.info('File uploaded successfully', {
      fileUrl: result.secure_url,
      user: req.user.username,
    });
    res
      .status(201)
      .json(new AppResponse(201, 'File uploaded successfully', createdFile));
  } catch (error) {
    if (file.path) {
      await fs.unlink(file.path);
    }
    logger.error('Failed to upload file', { error, user: req.user.username });
    throw new AppError('Failed to upload file', 500);
  }
});

export const generateLink = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { expiresIn = '24h' } = req.body;
  const userId = req.user._id;

  const file = await fileModel.findOne({ _id: id, owner: userId });

  if (!file) {
    throw new AppError('No file found or unauthorized', 404);
  }

  const uniqueToken = uuid();

  // Calculate expiration date
  const now = new Date();
  let expiresAt = new Date(now);

  switch (expiresIn) {
    case '1m':
      expiresAt.setMinutes(now.getMinutes() + 1);
      break;
    case '5m':
      expiresAt.setMinutes(now.getMinutes() + 5);
      break;
    case '1h':
      expiresAt.setHours(now.getHours() + 1);
      break;
    case '24h':
      expiresAt.setHours(now.getHours() + 24);
      break;
    default:
      expiresAt.setHours(now.getHours() + 24);
      break;
  }

  file.sharedToken = uniqueToken;
  file.sharedTokenExpiresAt = expiresAt;
  await file.save();

  logger.info('Generated shareable link', { fileId: file._id, expiresIn });

  res.status(200).json(
    new AppResponse(200, 'Link generated successfully', {
      token: uniqueToken,
      expiresAt,
    })
  );
});

export const getSharedFile = catchAsync(async (req, res) => {
  const { token } = req.params;

  if (!token) throw new AppError('No token provided', 400);

  const file = await fileModel.findOne({ sharedToken: token }).select('-owner');

  if (!file) {
    throw new AppError('Invalid or expired link', 404);
  }

  // Check expiration
  if (file.sharedTokenExpiresAt && new Date() > file.sharedTokenExpiresAt) {
    // Optionally: clear the token since it's expired
    file.sharedToken = undefined;
    file.sharedTokenExpiresAt = undefined;
    await file.save();

    throw new AppError('This link has expired', 410); // 410 Gone
  }

  res.status(200).json(
    new AppResponse(200, 'File metadata fetched successfully', {
      fileName: file.fileName,
      fileSize: file.fileSize,
      fileType: file.fileType,
      filePath: file.filePath,
      id: file._id,
      expiresAt: file.sharedTokenExpiresAt,
    })
  );
});

export const getUserFiles = catchAsync(async (req, res) => {
  const userId = req.user._id;

  const files = await fileModel.find({ owner: userId }).sort({ createdAt: -1 });

  res
    .status(200)
    .json(new AppResponse(200, 'Files fetched successfully', files));
});

export const downloadSharedFile = catchAsync(async (req, res) => {
  const { token } = req.params;

  const file = await fileModel.findOne({ sharedToken: token });

  if (!file) {
    throw new AppError('The link is invalid or has expired', 404);
  }

  if (file.sharedTokenExpiresAt && file.sharedTokenExpiresAt < new Date()) {
    throw new AppError('This shared link has expired', 410);
  }

  try {
    // 1. Extract the publicId and resource_type from the Cloudinary URL
    let publicId = '';
    let resourceType = 'auto';
    const match = file.filePath.match(
      /\/(image|video|raw)\/upload\/(?:v\d+\/)?(.+)$/
    );
    if (match) {
      resourceType = match[1];
      publicId = match[2];
    } else {
      // Fallback to legacy extraction
      const fallbackMatch = file.filePath.match(/\/upload\/(?:v\d+\/)?(.+)$/);
      if (fallbackMatch) {
        publicId = fallbackMatch[1];
      } else {
        throw new Error('Invalid Cloudinary URL format');
      }
    }

    // 2. Safely generate a Cloudinary authenticated Signed URL
    const signedUrl = cloudinary.url(publicId, {
      resource_type: resourceType,
      type: 'upload',
      sign_url: true,
    });

    // 3. Stream the signed URL content via Axios
    const response = await axios({
      method: 'GET',
      url: signedUrl,
      responseType: 'stream',
    });

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(file.fileName).replace(/%20/g, '+')}"`
    );
    res.setHeader('Content-Type', file.fileType || 'application/octet-stream');

    response.data.pipe(res);
  } catch (err) {
    logger.error('Error fetching file from Cloudinary', {
      error: err.message,
      fileId: file._id,
    });
    res.status(500).json(new AppResponse(500, 'Failed to download file'));
  }
});

export const deleteFile = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const file = await fileModel.findOne({ _id: id, owner: userId });

  if (!file) {
    throw new AppError('File not found or unauthorized', 404);
  }

  if (file.filePath) {
    const match = file.filePath.match(
      /\/(image|video|raw)\/upload\/(?:v\d+\/)?(.+)$/
    );
    if (match) {
      const resourceType = match[1];
      const publicId = match[2];
      try {
        await cloudinary.uploader.destroy(publicId, {
          resource_type: resourceType,
        });
      } catch (err) {
        logger.error('Failed to delete from Cloudinary', {
          error: err.message,
          publicId,
        });
      }
    } else {
      // Fallback for legacy generic urls
      const fallbackMatch = file.filePath.match(/\/upload\/(?:v\d+\/)?(.+)$/);
      if (fallbackMatch) {
        try {
          await cloudinary.uploader.destroy(fallbackMatch[1], {
            resource_type: 'raw',
          });
        } catch (err) {
          logger.error('Failed to delete from Cloudinary (fallback module)', {
            error: err.message,
          });
        }
      }
    }
  }

  await fileModel.deleteOne({ _id: id });

  res.status(200).json(new AppResponse(200, 'File deleted successfully', {}));
});
