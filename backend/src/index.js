import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import habitRoutes from './routes/habits.js';
import userRoutes from './routes/users.js';
import leaderboardRoutes from './routes/leaderboard.js';
import challengeRoutes from './routes/challenges.js';
import rewardsRoutes from './routes/rewards.js';
import referralRoutes from './routes/referrals.js';
import settingsRoutes from './routes/settings.js';
import notesRoutes from './routes/notes.js';
import activityRoutes from './routes/activity.js';
import feedbackRoutes from './routes/feedback.js';
import { scheduleNotificationJobs } from './jobs/notifications.js';

dotenv.config();

const app = express();

// CORS configuration - allow your Netlify domain
const corsOptions = {
  origin: [
    'https://habit-tracker-001.netlify.app',
    'http://localhost:5173',
    'http://localhost:8080',
    process.env.FRONTEND_URL,
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));
app.use(express.json());

// Debug: Log CORS requests
app.use((req, res, next) => {
  console.log('CORS Debug:', {
    origin: req.headers.origin,
    method: req.method,
    path: req.path,
    headers: req.headers
  });
  next();
});

// Catch-all OPTIONS handler for CORS preflight
app.options('*', cors(corsOptions), (req, res) => {
  console.log('OPTIONS preflight hit for:', req.path, 'from origin:', req.headers.origin);
  res.sendStatus(200);
});

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Habit Tracker API is running',
    timestamp: new Date().toISOString(),
    endpoints: ['/api/habits', '/api/users', '/api/challenges', '/api/rewards', '/api/referrals']
  });
});


app.use('/api/habits', habitRoutes);
app.use('/api/users', userRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/rewards', rewardsRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/feedback', feedbackRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Connected to Supabase');
  scheduleNotificationJobs();
});
