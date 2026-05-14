// ============================================================
// Agradut Foundation — Members Routes
// ============================================================
const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET all members
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM members ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET verify member by member_id (strictly case-sensitive)
router.get('/verify/:member_id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, full_name, email, phone, member_id, designation, status FROM members WHERE member_id = $1',
      [req.params.member_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST add one member
router.post('/', async (req, res) => {
  const { full_name, member_id, email, phone, designation, status } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO members (full_name, member_id, email, phone, designation, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [full_name, member_id, email || null, phone || null, designation || 'Member', status || 'Active']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Member ID already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

// POST bulk import members
router.post('/bulk', async (req, res) => {
  const { members } = req.body;
  if (!Array.isArray(members) || members.length === 0) {
    return res.status(400).json({ error: 'No members provided' });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const inserted = [];
    for (const m of members) {
      try {
        const r = await client.query(
          `INSERT INTO members (full_name, member_id, email, phone, designation, status)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (member_id) DO NOTHING
           RETURNING *`,
          [m.full_name, m.member_id, m.email || null, m.phone || null, m.designation || 'Member', m.status || 'Active']
        );
        if (r.rows.length > 0) inserted.push(r.rows[0]);
      } catch (_) { /* skip duplicates */ }
    }
    await client.query('COMMIT');
    res.status(201).json(inserted);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// PUT update member
router.put('/:id', async (req, res) => {
  const { full_name, member_id, email, phone, designation, status } = req.body;
  try {
    const result = await pool.query(
      `UPDATE members SET full_name=$1, member_id=$2, email=$3, phone=$4, designation=$5, status=$6
       WHERE id=$7 RETURNING *`,
      [full_name, member_id, email, phone, designation, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH dismiss member
router.patch('/:id/dismiss', async (req, res) => {
  try {
    const result = await pool.query(
      "UPDATE members SET status='Dismissed' WHERE id=$1 RETURNING *",
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE one member
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM members WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE all members
router.delete('/', async (req, res) => {
  try {
    await pool.query('DELETE FROM members');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
