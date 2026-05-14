// ============================================================
// Agradut Foundation — Programs Routes (past & future)
// ============================================================
const express = require('express');
const router = express.Router();
const pool = require('../db');

// Helper to make program routes for a given table
const makeRoutes = (table) => {
  const r = express.Router();

  // GET all
  r.get('/', async (req, res) => {
    try {
      const result = await pool.query(`SELECT * FROM ${table} ORDER BY created_at DESC`);
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST add
  r.post('/', async (req, res) => {
    const { title, date, place, details, image_url } = req.body;
    try {
      const result = await pool.query(
        `INSERT INTO ${table} (title, date, place, details, image_url) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
        [title, date, place, details || '', image_url || '']
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // PUT update
  r.put('/:id', async (req, res) => {
    const { title, date, place, details } = req.body;
    try {
      const result = await pool.query(
        `UPDATE ${table} SET title=$1, date=$2, place=$3, details=$4 WHERE id=$5 RETURNING *`,
        [title, date, place, details, req.params.id]
      );
      if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // DELETE
  r.delete('/:id', async (req, res) => {
    try {
      await pool.query(`DELETE FROM ${table} WHERE id=$1`, [req.params.id]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return r;
};

router.use('/past', makeRoutes('past_programs'));
router.use('/future', makeRoutes('future_programs'));

module.exports = router;
