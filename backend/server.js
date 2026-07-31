import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

import analyzeRoutes from './routes/analyzeRoutes.js';
import journalRoutes from './routes/journalRoutes.js';
import predictionRoutes from './routes/predictionRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json({ limit: '10mb' })); // For base64 images
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Routes

app.use('/api/analyze', analyzeRoutes);
app.use('/api/journal', journalRoutes);
app.use('/api/predictions', predictionRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Backend is running' });
});

// Database Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/tradevision')
  .then(() => {
    console.log('✅ Connected to MongoDB');
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
  });

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
