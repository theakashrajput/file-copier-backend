import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';
import AppResponse from '../utils/AppResponse.js';

export const uploadFile = catchAsync(async (req, res) => {
  const file = req.file;

  if (!file) throw new AppError('File not found', 400);

  console.log(file);

  return res
    .status(200)
    .json(new AppResponse('File uploaded successfully', file));
});
