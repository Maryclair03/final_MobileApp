const db = require('../config/database');

// Get all alerts for user's children
const getAlerts = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { unreadOnly = false, limit = 50 } = req.query;

    let query = `
      SELECT a.*, c.name as child_name
      FROM alerts a
      INNER JOIN children c ON a.child_id = c.id
      WHERE c.user_id = ?
    `;

    const params = [userId];

    if (unreadOnly === 'true') {
      query += ' AND a.is_read = FALSE';
    }

    query += ' ORDER BY a.created_at DESC LIMIT ?';
    params.push(parseInt(limit));

    const [alerts] = await db.query(query, params);

    res.json({ success: true, count: alerts.length, alerts });
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
};

// Get alerts for specific child
const getChildAlerts = async (req, res) => {
  try {
    const { childId } = req.params;
    const userId = req.user.userId;
    const { limit = 50 } = req.query;

    // Verify child belongs to user
    const [children] = await db.query(
      'SELECT id FROM children WHERE id = ? AND user_id = ?',
      [childId, userId]
    );

    if (children.length === 0) {
      return res.status(404).json({ error: 'Child not found' });
    }

    const [alerts] = await db.query(
      'SELECT * FROM alerts WHERE child_id = ? ORDER BY created_at DESC LIMIT ?',
      [childId, parseInt(limit)]
    );

    res.json({ success: true, count: alerts.length, alerts });
  } catch (error) {
    console.error('Get child alerts error:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
};

// Mark alert as read
const markAlertRead = async (req, res) => {
  try {
    const { alertId } = req.params;
    const userId = req.user.userId;

    // Verify alert belongs to user's child
    const [alerts] = await db.query(
      `SELECT a.id FROM alerts a
       INNER JOIN children c ON a.child_id = c.id
       WHERE a.id = ? AND c.user_id = ?`,
      [alertId, userId]
    );

    if (alerts.length === 0) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    await db.query('UPDATE alerts SET is_read = TRUE WHERE id = ?', [alertId]);

    res.json({ success: true, message: 'Alert marked as read' });
  } catch (error) {
    console.error('Mark alert read error:', error);
    res.status(500).json({ error: 'Failed to mark alert as read' });
  }
};

// Mark alert as resolved
const markAlertResolved = async (req, res) => {
  try {
    const { alertId } = req.params;
    const userId = req.user.userId;

    // Verify alert belongs to user's child
    const [alerts] = await db.query(
      `SELECT a.id FROM alerts a
       INNER JOIN children c ON a.child_id = c.id
       WHERE a.id = ? AND c.user_id = ?`,
      [alertId, userId]
    );

    if (alerts.length === 0) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    await db.query(
      'UPDATE alerts SET is_resolved = TRUE, resolved_at = NOW() WHERE id = ?',
      [alertId]
    );

    res.json({ success: true, message: 'Alert marked as resolved' });
  } catch (error) {
    console.error('Mark alert resolved error:', error);
    res.status(500).json({ error: 'Failed to mark alert as resolved' });
  }
};

// Get/Update threshold settings
const getThresholds = async (req, res) => {
  try {
    const { childId } = req.params;
    const userId = req.user.userId;

    // Verify child belongs to user
    const [children] = await db.query(
      'SELECT id FROM children WHERE id = ? AND user_id = ?',
      [childId, userId]
    );

    if (children.length === 0) {
      return res.status(404).json({ error: 'Child not found' });
    }

    const [thresholds] = await db.query(
      'SELECT * FROM threshold_settings WHERE child_id = ?',
      [childId]
    );

    res.json({ success: true, thresholds: thresholds[0] || null });
  } catch (error) {
    console.error('Get thresholds error:', error);
    res.status(500).json({ error: 'Failed to fetch thresholds' });
  }
};

const updateThresholds = async (req, res) => {
  try {
    const { childId } = req.params;
    const userId = req.user.userId;
    const {
      heartRateMin,
      heartRateMax,
      temperatureMin,
      temperatureMax,
      oxygenMin,
      alertEnabled
    } = req.body;

    // Verify child belongs to user
    const [children] = await db.query(
      'SELECT id FROM children WHERE id = ? AND user_id = ?',
      [childId, userId]
    );

    if (children.length === 0) {
      return res.status(404).json({ error: 'Child not found' });
    }

    await db.query(
      `UPDATE threshold_settings
       SET heart_rate_min = ?, heart_rate_max = ?, temperature_min = ?,
           temperature_max = ?, oxygen_min = ?, alert_enabled = ?
       WHERE child_id = ?`,
      [heartRateMin, heartRateMax, temperatureMin, temperatureMax, oxygenMin, alertEnabled, childId]
    );

    res.json({ success: true, message: 'Thresholds updated successfully' });
  } catch (error) {
    console.error('Update thresholds error:', error);
    res.status(500).json({ error: 'Failed to update thresholds' });
  }
};

module.exports = {
  getAlerts,
  getChildAlerts,
  markAlertRead,
  markAlertResolved,
  getThresholds,
  updateThresholds
};
