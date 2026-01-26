import { config } from 'dotenv';

config();

const envData = {
  PORT: process.env.PORT,
  MONGOOSE_URI: process.env.MONGOOSE_URI,
  NODE_ENV: process.env.NODE_ENV,
};

export default envData;
