import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import habitRoutes from './routes/habits.js';
import userRoutes from './routes/users.js';

dotenv.config();
// console.log('SENDGRID_API_KEY:', process.env.SENDGRID_API_KEY);

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/habits', habitRoutes);
app.use('/api/users', userRoutes);

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => console.error('MongoDB connection error:', err));
