const db = require('../config/database');

// Start sleep session
const startSleep = async (req, res) => {
  try {
    const { childId } = req.body;
    const userId = req.user.userId;

    if (!childId) {
      return res.status(400).json({ error: 'Child ID is required' });
    }

    // Verify child belongs to user
    const [children] = await db.query(
      'SELECT id FROM children WHERE id = ? AND user_id = ?',
      [childId, userId]
    );

    if (children.length === 0) {
      return res.status(404).json({ error: 'Child not found' });
    }

    // Check if there's already an active sleep session
    const [activeSessions] = await db.query(
      'SELECT id FROM sleep_patterns WHERE child_id = ? AND sleep_end IS NULL',
      [childId]
    );

    if (activeSessions.length > 0) {
      return res.status(400).json({ error: 'Sleep session already active' });
    }

    const [result] = await db.query(
      'INSERT INTO sleep_patterns (child_id, sleep_start) VALUES (?, NOW())',
      [childId]
    );

    res.status(201).json({
      success: true,
      message: 'Sleep session started',
      sessionId: result.insertId
    });
  } catch (error) {
    console.error('Start sleep error:', error);
    res.status(500).json({ error: 'Failed to start sleep session' });
  }
};

// End sleep session
const endSleep = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { quality, interruptions, notes } = req.body;
    const userId = req.user.userId;

    // Verify session belongs to user's child
    const [sessions] = await db.query(
      `SELECT sp.id, sp.sleep_start FROM sleep_patterns sp
       INNER JOIN children c ON sp.child_id = c.id
       WHERE sp.id = ? AND c.user_id = ?`,
      [sessionId, userId]
    );

    if (sessions.length === 0) {
      return res.status(404).json({ error: 'Sleep session not found' });
    }

    // Calculate duration
    const sleepStart = new Date(sessions[0].sleep_start);
    const sleepEnd = new Date();
    const durationMinutes = Math.round((sleepEnd - sleepStart) / 1000 / 60);

    await db.query(
      `UPDATE sleep_patterns
       SET sleep_end = NOW(), duration_minutes = ?, quality = ?, interruptions = ?, notes = ?
       WHERE id = ?`,
      [durationMinutes, quality, interruptions, notes, sessionId]
    );

    res.json({
      success: true,
      message: 'Sleep session ended',
      duration: durationMinutes
    });
  } catch (error) {
    console.error('End sleep error:', error);
    res.status(500).json({ error: 'Failed to end sleep session' });
  }
};

// Get sleep history
const getSleepHistory = async (req, res) => {
  try {
    const { childId } = req.params;
    const userId = req.user.userId;
    const { limit = 30 } = req.query;

    // Verify child belongs to user
    const [children] = await db.query(
      'SELECT id FROM children WHERE id = ? AND user_id = ?',
      [childId, userId]
    );

    if (children.length === 0) {
      return res.status(404).json({ error: 'Child not found' });
    }

    const [sleepData] = await db.query(
      `SELECT * FROM sleep_patterns
       WHERE child_id = ?
       ORDER BY sleep_start DESC
       LIMIT ?`,
      [childId, parseInt(limit)]
    );

    res.json({ success: true, count: sleepData.length, sleepHistory: sleepData });
  } catch (error) {
    console.error('Get sleep history error:', error);
    res.status(500).json({ error: 'Failed to fetch sleep history' });
  }
};

// Get sleep statistics
const getSleepStats = async (req, res) => {
  try {
    const { childId } = req.params;
    const userId = req.user.userId;
    const { period = '7d' } = req.query; // 7d, 30d

    // Verify child belongs to user
    const [children] = await db.query(
      'SELECT id FROM children WHERE id = ? AND user_id = ?',
      [childId, userId]
    );

    if (children.length === 0) {
      return res.status(404).json({ error: 'Child not found' });
    }

    const daysBack = period === '30d' ? 30 : 7;

    const [stats] = await db.query(
      `SELECT
        AVG(duration_minutes) as avg_duration,
        MIN(duration_minutes) as min_duration,
        MAX(duration_minutes) as max_duration,
        AVG(interruptions) as avg_interruptions,
        COUNT(*) as total_sessions
       FROM sleep_patterns
       WHERE child_id = ? AND sleep_end IS NOT NULL
         AND sleep_start >= DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [childId, daysBack]
    );

    res.json({ success: true, period, stats: stats[0] });
  } catch (error) {
    console.error('Get sleep stats error:', error);
    res.status(500).json({ error: 'Failed to fetch sleep statistics' });
  }
};

// Get active sleep session
const getActiveSleep = async (req, res) => {
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

    const [sessions] = await db.query(
      'SELECT * FROM sleep_patterns WHERE child_id = ? AND sleep_end IS NULL',
      [childId]
    );

    if (sessions.length === 0) {
      return res.json({ success: true, activeSession: null });
    }

    res.json({ success: true, activeSession: sessions[0] });
  } catch (error) {
    console.error('Get active sleep error:', error);
    res.status(500).json({ error: 'Failed to fetch active sleep session' });
  }
};

module.exports = {
  startSleep,
  endSleep,
  getSleepHistory,
  getSleepStats,
  getActiveSleep
};
