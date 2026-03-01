import userModel from '../models/user.model.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';
import AppResponse from '../utils/AppResponse.js';
import {
  accessTokenCookieOptions,
  refreshTokenCookieOptions,
} from '../../config/cookie.config.js';
import jwt from 'jsonwebtoken';
import envData from '../../config/envData.config.js';
import logger from '../../config/logger.config.js';

const generateTokens = async (user) => {
  try {
    const accessToken = user.createAccessToken();
    const refreshToken = user.createRefreshToken();

    user.refreshToken = refreshToken;
    await user.save();

    return { accessToken, refreshToken };
  } catch (tokenError) {
    logger.error('Token generation failed', {
      error: tokenError,
      userId: user._id,
    });
    throw new AppError(
      'Token generation failed Error: ' + tokenError.message,
      500
    );
  }
};

export const registerUser = catchAsync(async (req, res) => {
  const { username, email, password } = req.body || {};

  if (!username || !email || !password) {
    logger.warn('Registration failed: Missing fields', { body: req.body });
    throw new AppError('All fields are required', 400);
  }

  const isUserExist = await userModel.findOne({ email });

  if (isUserExist) {
    logger.warn('Registration failed: User already exists with this email', {
      email,
    });
    throw new AppError('User already exists with this credentials', 400);
  }

  const user = await userModel.create({ username, email, password });

  const { accessToken, refreshToken } = await generateTokens(user);

  logger.info('User registered successfully', { userId: user._id, email });

  res
    .status(201)
    .cookie('accessToken', accessToken, accessTokenCookieOptions)
    .cookie('refreshToken', refreshToken, refreshTokenCookieOptions)
    .json(
      new AppResponse(201, 'User registered successfully', user.toSafeObject())
    );
});

export const loginUser = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    logger.warn('Login failed: Missing fields', { email });
    throw new AppError('All fields are required', 400);
  }

  const user = await userModel.findOne({ email });

  if (!user) {
    logger.warn('Login failed: User not found', { email });
    throw new AppError('User not found', 404);
  }

  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    logger.warn('Login failed: Invalid password', { email });
    throw new AppError('Invalid password', 401);
  }

  const { accessToken, refreshToken } = await generateTokens(user);

  logger.info('User logged in successfully', { userId: user._id, email });

  res
    .status(200)
    .cookie('accessToken', accessToken, accessTokenCookieOptions)
    .cookie('refreshToken', refreshToken, refreshTokenCookieOptions)
    .json(
      new AppResponse(200, 'User logged in successfully', user.toSafeObject())
    );
});

export const logoutUser = catchAsync(async (req, res) => {
  const user = req.user;

  await userModel.findByIdAndUpdate(user._id, { $unset: { refreshToken: 1 } });

  logger.info('User logged out successfully', { userId: user._id });

  res
    .status(200)
    .clearCookie('accessToken', accessTokenCookieOptions)
    .clearCookie('refreshToken', refreshTokenCookieOptions)
    .json(new AppResponse(200, 'User logged out successfully', {}));
});

export const refreshTokens = catchAsync(async (req, res) => {
  const { refreshToken } = req.cookies;

  if (!refreshToken) {
    logger.warn('Token refresh failed: No refresh token provided');
    throw new AppError('Refresh token not found', 401);
  }

  const isRefreshTokenValid = jwt.verify(
    refreshToken,
    envData.REFRESH_TOKEN_SECRET
  );

  if (!isRefreshTokenValid) {
    logger.warn('Token refresh failed: Invalid refresh token');
    throw new AppError('Invalid refresh token', 401);
  }

  const user = await userModel.findOne({ refreshToken });

  if (!user) {
    logger.warn('Token refresh failed: User not found for token');
    throw new AppError('User not found', 404);
  }

  const { accessToken, refreshToken: newRefreshToken } =
    await generateTokens(user);

  logger.info('User token refreshed successfully', { userId: user._id });

  res
    .status(200)
    .cookie('accessToken', accessToken, accessTokenCookieOptions)
    .cookie('refreshToken', newRefreshToken, refreshTokenCookieOptions)
    .json(
      new AppResponse(200, 'User logged in successfully', user.toSafeObject())
    );
});

// export const forgotPassword = catchAsync(async (req, res) => {});

// export const resetPassword = catchAsync(async (req, res) => {});

// export const changePassword = catchAsync(async (req, res) => {});

export const getAllUsers = catchAsync(async (req, res) => {
  const users = await userModel.find();

  res
    .status(200)
    .json(new AppResponse(200, 'Users fetched successfully', users));
});

export const getMe = catchAsync(async (req, res) => {
  const user = req.user;

  res.status(200).json(new AppResponse(200, 'User fetched successfully', user));
});

export const getUser = catchAsync(async (req, res) => {
  const id = req.params.id;

  const user = await userModel.findById(id).select('-password');

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res
    .status(200)
    .json(
      new AppResponse(200, 'User fetched successfully', user.toSafeObject())
    );
});

export const updateUser = catchAsync(async (req, res) => {
  const user = req.user;
  const { username } = req.body;

  if (!username) {
    throw new AppError('Username is required', 400);
  }

  const updatedUser = await userModel.findByIdAndUpdate(
    user._id,
    { username },
    { new: true }
  );

  res
    .status(200)
    .json(
      new AppResponse(
        200,
        'User updated successfully',
        updatedUser.toSafeObject()
      )
    );
});

export const deleteUser = catchAsync(async (req, res) => {
  const user = req.user;

  await userModel.findByIdAndDelete(user._id);

  res
    .status(200)
    .clearCookie('accessToken', accessTokenCookieOptions)
    .clearCookie('refreshToken', refreshTokenCookieOptions)
    .json(new AppResponse(200, 'User deleted successfully', {}));
});
