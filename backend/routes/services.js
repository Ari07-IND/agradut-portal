// ============================================================
// Agradut Foundation — Service Requests Routes
// ============================================================
const express = require('express');
const router = express.Router();
const pool = require('../db');
const { notifyAllAdmins } = require('../utils/email');

// GET all service requests
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM service_requests ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST submit a service request
router.post('/', async (req, res) => {
  const { type, full_name, email, phone, blood_group, details } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO service_requests (type, full_name, email, phone, blood_group, details, status)
       VALUES ($1,$2,$3,$4,$5,$6,'Pending') RETURNING *`,
      [type, full_name, email || null, phone, blood_group || null, details || null]
    );

    // Notify all admins
    notifyAllAdmins(
      `New Service Request: ${type}`,
      `<div style="font-family:Arial,sans-serif;padding:20px;">
        <h2>New ${type} Request</h2>
        <p><b>Name:</b> ${full_name}</p>
        <p><b>Phone:</b> ${phone}</p>
        <p><b>Blood Group:</b> ${blood_group || 'N/A'}</p>
        <p><b>Details:</b> ${details || 'No additional details provided.'}</p>
        <p>Please log in to the admin dashboard to review and process this request urgently.</p>
      </div>`
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update service request status (admin)
router.put('/:id', async (req, res) => {
  const { status } = req.body;
  try {
    const result = await pool.query(
      'UPDATE service_requests SET status=$1 WHERE id=$2 RETURNING *',
      [status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
