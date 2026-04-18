import mongoose from 'mongoose';

export async function connectDatabase(uri) {
  if (!uri) {
    throw new Error(
      'MONGODB_URI environment variable is required. Set it in your .env file or environment.',
    );
  }

  await mongoose.connect(uri);
  console.log('MongoDB connected');
}
