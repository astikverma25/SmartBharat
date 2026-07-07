import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

// Import routes
import chatRouter from './routes/chat.js';
import complaintsRouter from './routes/complaints.js';
import documentsRouter from './routes/documents.js';
import schemesRouter from './routes/schemes.js';

// Initialize dotenv
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Setup directories
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());

// Serve static uploads directory for local mock storage
app.use('/uploads', express.static(dirname(fileURLToPath(import.meta.url)) + '/uploads'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
    supabaseConnected: !!(process.env.SUPABASE_URL && process.env.SUPABASE_KEY && process.env.SUPABASE_URL !== 'dummy_supabase_url_replace_me'),
    geminiConnected: !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'dummy_gemini_api_key_replace_me')
  });
});

// Register routes
app.use('/api/chat', chatRouter);
app.use('/api/complaints', complaintsRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/schemes', schemesRouter);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message || 'Something went wrong on the server'
  });
});

// Start listening
app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`Smart Bharat Backend Server running on port ${PORT}`);
  console.log(`Mode: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Supabase config: ${process.env.SUPABASE_URL && process.env.SUPABASE_URL !== 'dummy_supabase_url_replace_me' ? 'Provided' : 'Missing (using Mock fallback)'}`);
  console.log(`Gemini API config: ${process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'dummy_gemini_api_key_replace_me' ? 'Provided' : 'Missing (using Mock fallback)'}`);
  console.log(`==================================================`);
});
