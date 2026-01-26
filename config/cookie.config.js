import envData from './envData.config.js';

export const accessTokenCookieOptions = {
  httpOnly: true,
  secure: envData.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 15 * 60 * 60 * 1000,
};

export const refreshTokenCookieOptions = {
  httpOnly: true,
  secure: envData.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};
