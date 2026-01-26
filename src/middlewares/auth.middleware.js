import jwt from 'jsonwebtoken';
import envData from '../../config/envData.config.js';
import AppError from '../utils/AppError.js';
import userModel from '../models/user.model.js';

export const verifyJWT = async (req, res, next) => {
  const accessToken =
    req.cookies.accessToken || req.headers.authorization?.split(' ')[1];

  if (!accessToken) throw new AppError('Unauthorized request', 401);

  try {
    const decodedToken = jwt.verify(accessToken, envData.ACCESS_TOKEN_SECRET);

    const user = await userModel.findById(decodedToken.id);

    if (!user) throw new AppError('User not found', 404);

    req.user = user.toSafeObject();
    next();
  } catch (error) {
    throw new AppError('Invalid token Error: ' + error.message, 401);
  }
};
