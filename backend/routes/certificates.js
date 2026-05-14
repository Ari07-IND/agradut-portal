// ============================================================
// Agradut Foundation — Certificate Requests Routes
// ============================================================
const express = require('express');
const router = express.Router();
const pool = require('../db');
const { transporter, notifyAllAdmins } = require('../utils/email');

// Helper to safely ensure updated_at exists before querying
const ensureUpdatedAt = async () => {
  try {
    await pool.query('ALTER TABLE certificate_requests ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();');
  } catch (err) {} // Ignore errors if it already exists
};

// GET all certificate requests (hides resolved ones older than 2 days)
router.get('/', async (req, res) => {
  try {
    await ensureUpdatedAt();
    const result = await pool.query(`
      SELECT * FROM certificate_requests 
      WHERE status = 'pending' 
         OR (status IN ('approved', 'rejected') AND updated_at > NOW() - INTERVAL '2 days')
      ORDER BY created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET check existing request for member + year
router.get('/check', async (req, res) => {
  const { member_id, year } = req.query;
  try {
    const result = await pool.query(
      'SELECT id, status, created_at FROM certificate_requests WHERE member_id=$1 AND year=$2 ORDER BY created_at DESC',
      [member_id, year]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST submit a certificate request
router.post('/', async (req, res) => {
  const { member_id, full_name, email, year } = req.body;
  try {
    await ensureUpdatedAt();
    const result = await pool.query(
      `INSERT INTO certificate_requests (member_id, full_name, email, year, status, updated_at)
       VALUES ($1,$2,$3,$4,'pending', NOW()) RETURNING *`,
      [member_id, full_name, email || null, year]
    );
    
    // Notify all admins
    notifyAllAdmins(
      'New Certificate Request Submitted',
      `<div style="font-family:Arial,sans-serif;padding:20px;">
        <h2>New Certificate Request</h2>
        <p><b>Member:</b> ${full_name} (${member_id})</p>
        <p><b>Year:</b> ${year}</p>
        <p>Please log in to the admin dashboard to review it.</p>
      </div>`
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update certificate request status (admin)
router.put('/:id', async (req, res) => {
  const { status } = req.body;
  if (!['pending', 'approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  try {
    await ensureUpdatedAt();
    const result = await pool.query(
      'UPDATE certificate_requests SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING *',
      [status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    
    const requestData = result.rows[0];

    // Send automated email if email is provided
    if (requestData.email) {
      try {
        let subject = '';
        let htmlContent = '';

        if (status === 'approved') {
          subject = `Certificate Request Approved - ${requestData.year}`;
          htmlContent = `
            <div style="font-family:Arial,sans-serif;padding:20px;color:#333;">
              <h2 style="color:#138808;">Congratulations, ${requestData.full_name}!</h2>
              <p>Your request for the <b>${requestData.year} Appreciation Certificate</b> has been <strong>approved</strong> by the admin team.</p>
              <p>Your official digital certificate will be sent to you shortly.</p>
              <br/>
              <p>Thank you for your dedication,</p>
              <p><b>Agradut Foundation</b></p>
            </div>
          `;
        } else if (status === 'rejected') {
          subject = `Certificate Request Update - ${requestData.year}`;
          htmlContent = `
            <div style="font-family:Arial,sans-serif;padding:20px;color:#333;">
              <h2 style="color:#d94f38;">Certificate Request Update</h2>
              <p>Dear ${requestData.full_name},</p>
              <p>Unfortunately, your certificate request for the year <b>${requestData.year}</b> could not be accepted at this time.</p>
              <p>Please review your details. You are allowed to re-apply for a certificate up to 3 times per year.</p>
              <p>If you believe this is a mistake, you can submit a new request on our website.</p>
              <br/>
              <p>Best regards,</p>
              <p><b>Agradut Foundation</b></p>
            </div>
          `;
        }

        if (subject) {
          await transporter.sendMail({
            from: `"Agradut Foundation" <${process.env.EMAIL_USER}>`,
            to: requestData.email,
            subject,
            html: htmlContent,
          });
        }
      } catch (emailErr) {
        console.error('Failed to send automated email:', emailErr);
        // We do not fail the API request if the email fails, just log it.
      }
    }

    res.json(requestData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
