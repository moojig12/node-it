import dotenv from 'dotenv';
import app from './app.js';
import { connectDatabase } from './config/database.js';

dotenv.config();

const port = Number(process.env.PORT) || 5000;

async function startServer() {
  try {
    await connectDatabase(process.env.MONGODB_URI);
    app.listen(port, () => {
      console.log(`Backend listening on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start backend:', error);
    process.exit(1);
  }
}

startServer();
