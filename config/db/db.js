import envData from '../envData.config.js';
import mongoose from 'mongoose';

const connectToDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${envData.MONGOOSE_URI}`
    );
    console.log(
      `MongoDB connected! DB Host: ${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.log('Error in connecting to MongoDB', error);
    process.exit(1);
  }
};

export default connectToDB;
