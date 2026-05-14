// ============================================================
// Agradut Foundation — Donations Routes
// ============================================================
const express = require('express');
const router = express.Router();
const pool = require('../db');
const { notifyAllAdmins } = require('../utils/email');

// GET donations filtered by month & year
router.get('/', async (req, res) => {
  const { month, year } = req.query;
  try {
    let query = 'SELECT * FROM donations';
    const params = [];
    if (month && year) {
      query += ' WHERE month=$1 AND year=$2';
      params.push(parseInt(month), parseInt(year));
    }
    query += ' ORDER BY donation_date DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST record a donation
router.post('/', async (req, res) => {
  const { receipt_id, full_name, email, phone, amount, transaction_id, message, donation_date, month, year } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO donations (receipt_id, full_name, email, phone, amount, transaction_id, message, donation_date, month, year)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [receipt_id, full_name, email || null, phone || null, amount, transaction_id || null,
       message || null, donation_date || new Date().toISOString(), month, year]
    );

    // Notify all admins
    notifyAllAdmins(
      'New Donation Received',
      `<div style="font-family:Arial,sans-serif;padding:20px;">
        <h2>New Donation Received</h2>
        <p><b>Donor:</b> ${full_name}</p>
        <p><b>Amount:</b> ₹${amount}</p>
        <p><b>Receipt ID:</b> ${receipt_id}</p>
        <p><b>Message:</b> ${message || 'No message provided.'}</p>
        <p>Please log in to the admin dashboard to view the details.</p>
      </div>`
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Duplicate receipt ID' });
    }
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
