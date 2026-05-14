// ============================================================
// Agradut Foundation — Payments Routes
// ============================================================
const express = require('express');
const router = express.Router();
const pool = require('../db');
const { notifyAllAdmins } = require('../utils/email');

// GET payments filtered by month & year
router.get('/', async (req, res) => {
  const { month, year } = req.query;
  try {
    let query = 'SELECT * FROM payments';
    const params = [];
    if (month && year) {
      query += ' WHERE month=$1 AND year=$2';
      params.push(parseInt(month), parseInt(year));
    }
    query += ' ORDER BY payment_date DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST record a payment
router.post('/', async (req, res) => {
  const { receipt_id, member_id, full_name, amount, payment_method, transaction_ref, payment_date, month, year, notes } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO payments (receipt_id, member_id, full_name, amount, payment_method, transaction_ref, payment_date, month, year, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [receipt_id, member_id, full_name, amount, payment_method || 'razorpay', transaction_ref || null, 
       payment_date || new Date(), month, year, notes || null]
    );

    // Notify all admins
    notifyAllAdmins(
      'New Membership Payment Received',
      `<div style="font-family:Arial,sans-serif;padding:20px;">
        <h2>New Payment Received</h2>
        <p><b>Member:</b> ${full_name} (${member_id})</p>
        <p><b>Amount:</b> ₹${amount}</p>
        <p><b>For Month:</b> ${month}/${year}</p>
        <p><b>Receipt ID:</b> ${receipt_id}</p>
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
