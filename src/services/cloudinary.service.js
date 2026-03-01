// Require the cloudinary library
import { v2 as cloudinary } from 'cloudinary';
import envData from '../../config/envData.config.js';

// Return "https" URLs by setting secure: true
cloudinary.config({
  secure: true,
  cloud_name: envData.CLOUDINARY_CLOUD_NAME,
  api_key: envData.CLOUDINARY_API_KEY,
  api_secret: envData.CLOUDINARY_API_SECRET,
});

export default cloudinary;
