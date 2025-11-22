import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI as string);
 
  } catch (error: any) {
   
    process.exit(1);
  }
};

export default connectDB;