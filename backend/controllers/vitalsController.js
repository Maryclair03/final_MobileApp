const db = require('../config/database');

// Add new vital reading
const addVitalReading = async (req, res) => {
  try {
    const { childId, heartRate, temperature, oxygenSaturation, movementStatus, batteryLevel, deviceConnected } = req.body;

    if (!childId) {
      return res.status(400).json({ error: 'Child ID is required' });
    }

    // Verify child exists and belongs to user
    const [children] = await db.query(
      'SELECT c.id FROM children c WHERE c.id = ? AND c.user_id = ?',
      [childId, req.user.userId]
    );

    if (children.length === 0) {
      return res.status(404).json({ error: 'Child not found' });
    }

    const [result] = await db.query(
      `INSERT INTO vital_readings (child_id, heart_rate, temperature, oxygen_saturation, movement_status, battery_level, device_connected)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [childId, heartRate, temperature, oxygenSaturation, movementStatus, batteryLevel, deviceConnected]
    );

    // Check thresholds and create alerts if needed
    await checkThresholdsAndAlert(childId, heartRate, temperature, oxygenSaturation);

    res.status(201).json({
      success: true,
      message: 'Vital reading added successfully',
      readingId: result.insertId
    });
  } catch (error) {
    console.error('Add vital reading error:', error);
    res.status(500).json({ error: 'Failed to add vital reading' });
  }
};

// Get latest vital reading for a child
const getLatestVitals = async (req, res) => {
  try {
    const { childId } = req.params;

    // Verify child belongs to user
    const [children] = await db.query(
      'SELECT c.id FROM children c WHERE c.id = ? AND c.user_id = ?',
      [childId, req.user.userId]
    );

    if (children.length === 0) {
      return res.status(404).json({ error: 'Child not found' });
    }

    const [vitals] = await db.query(
      'SELECT * FROM vital_readings WHERE child_id = ? ORDER BY timestamp DESC LIMIT 1',
      [childId]
    );

    if (vitals.length === 0) {
      return res.status(404).json({ error: 'No vital readings found' });
    }

    res.json({ success: true, vitals: vitals[0] });
  } catch (error) {
    console.error('Get latest vitals error:', error);
    res.status(500).json({ error: 'Failed to fetch vital readings' });
  }
};

// Get vital readings history with time range
const getVitalsHistory = async (req, res) => {
  try {
    const { childId } = req.params;
    const { startDate, endDate, limit = 100 } = req.query;

    // Verify child belongs to user
    const [children] = await db.query(
      'SELECT c.id FROM children c WHERE c.id = ? AND c.user_id = ?',
      [childId, req.user.userId]
    );

    if (children.length === 0) {
      return res.status(404).json({ error: 'Child not found' });
    }

    let query = 'SELECT * FROM vital_readings WHERE child_id = ?';
    const params = [childId];

    if (startDate) {
      query += ' AND timestamp >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND timestamp <= ?';
      params.push(endDate);
    }

    query += ' ORDER BY timestamp DESC LIMIT ?';
    params.push(parseInt(limit));

    const [vitals] = await db.query(query, params);

    res.json({ success: true, count: vitals.length, vitals });
  } catch (error) {
    console.error('Get vitals history error:', error);
    res.status(500).json({ error: 'Failed to fetch vitals history' });
  }
};

// Get vital statistics (avg, min, max for a time period)
const getVitalStats = async (req, res) => {
  try {
    const { childId } = req.params;
    const { period = '24h' } = req.query; // 24h, 7d, 30d

    // Verify child belongs to user
    const [children] = await db.query(
      'SELECT c.id FROM children c WHERE c.id = ? AND c.user_id = ?',
      [childId, req.user.userId]
    );

    if (children.length === 0) {
      return res.status(404).json({ error: 'Child not found' });
    }

    // Calculate time range
    let hoursBack = 24;
    if (period === '7d') hoursBack = 168;
    if (period === '30d') hoursBack = 720;

    const [stats] = await db.query(
      `SELECT
        AVG(heart_rate) as avg_heart_rate,
        MIN(heart_rate) as min_heart_rate,
        MAX(heart_rate) as max_heart_rate,
        AVG(temperature) as avg_temperature,
        MIN(temperature) as min_temperature,
        MAX(temperature) as max_temperature,
        AVG(oxygen_saturation) as avg_oxygen,
        MIN(oxygen_saturation) as min_oxygen,
        MAX(oxygen_saturation) as max_oxygen,
        COUNT(*) as total_readings
       FROM vital_readings
       WHERE child_id = ? AND timestamp >= DATE_SUB(NOW(), INTERVAL ? HOUR)`,
      [childId, hoursBack]
    );

    res.json({ success: true, period, stats: stats[0] });
  } catch (error) {
    console.error('Get vital stats error:', error);
    res.status(500).json({ error: 'Failed to fetch vital statistics' });
  }
};

// Helper function to check thresholds and create alerts
const checkThresholdsAndAlert = async (childId, heartRate, temperature, oxygenSaturation) => {
  try {
    // Get threshold settings for this child
    const [settings] = await db.query(
      'SELECT * FROM threshold_settings WHERE child_id = ? AND alert_enabled = TRUE',
      [childId]
    );

    if (settings.length === 0) return;

    const threshold = settings[0];
    const alerts = [];

    // Check heart rate
    if (heartRate && (heartRate < threshold.heart_rate_min || heartRate > threshold.heart_rate_max)) {
      const severity = heartRate < threshold.heart_rate_min - 10 || heartRate > threshold.heart_rate_max + 10 ? 'critical' : 'high';
      alerts.push({
        type: 'heart_rate',
        severity,
        message: `Heart rate ${heartRate} BPM is ${heartRate < threshold.heart_rate_min ? 'below' : 'above'} normal range`,
        value: heartRate.toString()
      });
    }

    // Check temperature
    if (temperature && (temperature < threshold.temperature_min || temperature > threshold.temperature_max)) {
      const severity = temperature > threshold.temperature_max + 1 ? 'critical' : 'high';
      alerts.push({
        type: 'temperature',
        severity,
        message: `Temperature ${temperature}°C is ${temperature < threshold.temperature_min ? 'below' : 'above'} normal range`,
        value: temperature.toString()
      });
    }

    // Check oxygen
    if (oxygenSaturation && oxygenSaturation < threshold.oxygen_min) {
      const severity = oxygenSaturation < threshold.oxygen_min - 5 ? 'critical' : 'high';
      alerts.push({
        type: 'oxygen',
        severity,
        message: `Oxygen saturation ${oxygenSaturation}% is below normal range`,
        value: oxygenSaturation.toString()
      });
    }

    // Insert alerts
    for (const alert of alerts) {
      await db.query(
        'INSERT INTO alerts (child_id, alert_type, severity, message, value) VALUES (?, ?, ?, ?, ?)',
        [childId, alert.type, alert.severity, alert.message, alert.value]
      );
    }
  } catch (error) {
    console.error('Check thresholds error:', error);
  }
};

module.exports = {
  addVitalReading,
  getLatestVitals,
  getVitalsHistory,
  getVitalStats
};
