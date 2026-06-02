require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const { initializeSocket } = require('./socket');

// Import routes
const authRoutes = require('./routes/auth');
const memberRoutes = require('./routes/members');
const transactionRoutes = require('./routes/transactions');
const reportRoutes = require('./routes/reports');
const frontendRoutes = require('./routes/frontend');

const app = express();
const server = http.createServer(app);

// CORS configuration supporting dynamic environment CORS_ORIGIN and automatic subdomains
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
  : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5174'];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, postman, or direct server calls)
    if (!origin) return callback(null, true);
    
    const isAllowed = process.env.CORS_ORIGIN === '*' || 
                      allowedOrigins.includes('*') || 
                      allowedOrigins.includes(origin) ||
                      origin.endsWith('.vercel.app') ||
                      origin.endsWith('.onrender.com');

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

// Socket.io setup with CORS
const io = new Server(server, {
  cors: corsOptions
});

// Make io accessible in routes
app.set('io', io);

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files (for serving images if needed)
app.use('/images', express.static(path.join(__dirname, '../frontend/public/images')));

// API Routes
// Mount existing API modules
app.use('/api/auth', authRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/reports', reportRoutes);

// Frontend-friendly API (shims endpoints used by new web UI)
app.use('/api', frontendRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'MitraM Backend Running',
    timestamp: new Date().toISOString()
  });
});

// Initialize Socket.io
initializeSocket(io);

// Start server
const PORT = process.env.PORT || 5000;

async function startServer() {
  // Connect to MongoDB
  await connectDB();

  server.listen(PORT, () => {
    console.log('');
    console.log('╔══════════════════════════════════════════════════╗');
    console.log('║                                                  ║');
    console.log('║   🙏 MitraM - ગુજરાતી હિસાબ વ્યવસ્થાપન સિસ્ટમ   ║');
    console.log('║                                                  ║');
    console.log(`║   🚀 Server running on port ${PORT}                 ║`);
    console.log('║   📡 Socket.io ready for connections             ║');
    console.log('║                                                  ║');
    console.log('╚══════════════════════════════════════════════════╝');
    console.log('');
  });
}

startServer();

module.exports = { app, server, io };
