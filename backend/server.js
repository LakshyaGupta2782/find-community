// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); // Allow cross-origin requests from your frontend
app.use(express.json({ limit: '50mb' })); // To parse JSON bodies (important for large file uploads like Aadhaar data)

// Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// Basic Route
app.get('/', (req, res) => {
  res.send('Community Connect Platform Backend API');
});

// TODO: Include all your routes here
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
// app.use('/api/community', require('./routes/communityRoutes'));

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});