const express = require('express');
const router = express.Router();
const db = require('../db');


// GET all active users in the system
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM users WHERE deleted_at IS NULL'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Database execution error' });
  }
});


// GET single active user details by ID
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL',
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Database retrieval error' });
  }
});


// ADMIN: Get all soft-deleted users (audit view)
router.get('/admin/deleted/all', async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM users WHERE deleted_at IS NOT NULL'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch deleted users' });
  }
});


// CREATE a new user
router.post('/', async (req, res) => {
  const { name, email } = req.body;
  try {
    const { rows } = await db.query(
      'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *',
      [name, email]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'User creation failed' });
  }
});


// Soft DELETE user from the system
router.delete('/:id', async (req, res) => {
  try {
    // Soft delete: mark user as deleted instead of removing the row
    const { rowCount } = await db.query(
      'UPDATE users SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL',
      [req.params.id]
    );

    if (rowCount === 0) {
      return res.status(404).json({ error: 'User not found or already deleted' });
    }

    res.json({ message: 'User soft-deleted from LedgerApp' });
  } catch (err) {
    res.status(500).json({ error: 'Delete operation failed' });
  }
});


module.exports = router;