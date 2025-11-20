const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/authRoutes');
const childRoutes = require('./routes/childRoutes');
const vitalsRoutes = require('./routes/vitalsRoutes');
const alertRoutes = require('./routes/alertRoutes');
const sleepRoutes = require('./routes/sleepRoutes');

// Import MQTT service for Arduino communication
const mqttService = require('./services/mqttService');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Little Watch API Server',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/children', childRoutes);
app.use('/api/vitals', vitalsRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/sleep', sleepRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log('╔════════════════════════════════════════╗');
  console.log(`║  Little Watch API Server Running      ║`);
  console.log(`║  Port: ${PORT}                            ║`);
  console.log(`║  Environment: ${process.env.NODE_ENV || 'development'}         ║`);
  console.log('╚════════════════════════════════════════╝');

  // Initialize MQTT service for Arduino communication
  mqttService.initialize();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  mqttService.disconnect();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  mqttService.disconnect();
  process.exit(0);
});
