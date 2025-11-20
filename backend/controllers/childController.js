const db = require('../config/database');

// Add new child
const addChild = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, dateOfBirth, gender, weight, height, bloodType, allergies, medicalNotes, deviceId } = req.body;

    if (!name || !dateOfBirth || !gender) {
      return res.status(400).json({ error: 'Name, date of birth, and gender are required' });
    }

    const [result] = await db.query(
      `INSERT INTO children (user_id, name, date_of_birth, gender, weight, height, blood_type, allergies, medical_notes, device_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, name, dateOfBirth, gender, weight, height, bloodType, allergies, medicalNotes, deviceId]
    );

    // Create default threshold settings for this child
    await db.query(
      'INSERT INTO threshold_settings (child_id) VALUES (?)',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Child added successfully',
      childId: result.insertId
    });
  } catch (error) {
    console.error('Add child error:', error);
    res.status(500).json({ error: 'Failed to add child' });
  }
};

// Get all children for a user
const getChildren = async (req, res) => {
  try {
    const userId = req.user.userId;

    const [children] = await db.query(
      'SELECT * FROM children WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    res.json({ success: true, children });
  } catch (error) {
    console.error('Get children error:', error);
    res.status(500).json({ error: 'Failed to fetch children' });
  }
};

// Get single child
const getChild = async (req, res) => {
  try {
    const { childId } = req.params;
    const userId = req.user.userId;

    const [children] = await db.query(
      'SELECT * FROM children WHERE id = ? AND user_id = ?',
      [childId, userId]
    );

    if (children.length === 0) {
      return res.status(404).json({ error: 'Child not found' });
    }

    res.json({ success: true, child: children[0] });
  } catch (error) {
    console.error('Get child error:', error);
    res.status(500).json({ error: 'Failed to fetch child' });
  }
};

// Update child information
const updateChild = async (req, res) => {
  try {
    const { childId } = req.params;
    const userId = req.user.userId;
    const { name, weight, height, bloodType, allergies, medicalNotes } = req.body;

    // Verify ownership
    const [children] = await db.query(
      'SELECT id FROM children WHERE id = ? AND user_id = ?',
      [childId, userId]
    );

    if (children.length === 0) {
      return res.status(404).json({ error: 'Child not found' });
    }

    await db.query(
      `UPDATE children SET name = ?, weight = ?, height = ?, blood_type = ?, allergies = ?, medical_notes = ?
       WHERE id = ?`,
      [name, weight, height, bloodType, allergies, medicalNotes, childId]
    );

    res.json({ success: true, message: 'Child information updated successfully' });
  } catch (error) {
    console.error('Update child error:', error);
    res.status(500).json({ error: 'Failed to update child' });
  }
};

// Delete child
const deleteChild = async (req, res) => {
  try {
    const { childId } = req.params;
    const userId = req.user.userId;

    // Verify ownership
    const [children] = await db.query(
      'SELECT id FROM children WHERE id = ? AND user_id = ?',
      [childId, userId]
    );

    if (children.length === 0) {
      return res.status(404).json({ error: 'Child not found' });
    }

    await db.query('DELETE FROM children WHERE id = ?', [childId]);

    res.json({ success: true, message: 'Child deleted successfully' });
  } catch (error) {
    console.error('Delete child error:', error);
    res.status(500).json({ error: 'Failed to delete child' });
  }
};

module.exports = {
  addChild,
  getChildren,
  getChild,
  updateChild,
  deleteChild
};
