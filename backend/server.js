const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const grievanceRoutes = require('./routes/grievances');
const usersRoutes = require('./routes/users');

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const uri = process.env.MONGO_URI;

if (!uri) {
  console.error('FATAL ERROR: MONGO_URI is not defined in the .env file.');
  process.exit(1);
}

// The mongoose.connect options are deprecated and no longer needed.
mongoose.connect(uri).then(() => {
  console.log('MongoDB database connection established successfully');
}).catch(err => {
  console.error('MongoDB connection error. Please ensure MongoDB is running and the MONGO_URI is correct.', err);
  process.exit(1);
});

const connection = mongoose.connection;

connection.on('error', err => {
  console.error('MongoDB runtime error:', err);
});

// Routes
app.use('/api/grievances', grievanceRoutes);
app.use('/api/users', usersRoutes);

// Centralized, more informative global error handler
app.use((err, req, res, next) => {
  console.error('An unhandled error occurred:', err.stack);
  // Send a structured JSON error response
  res.status(500).json({
    msg: 'A critical server error occurred. Please check server logs for details.',
    error: err.message, // Provide the actual error message for debugging
  });
});

// Start Server
app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
