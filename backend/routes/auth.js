// ============================================================
// Agradut Foundation — Auth Routes
// ============================================================
const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const JWT_SECRET = process.env.JWT_SECRET || 'agradut_secret_change_this';

// In-memory OTP store (use DB table for production persistence)
const otpMemory = {};

// ── Nodemailer transporter ─────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Gmail App Password (not your real password)
  },
});

// ── POST /api/auth/send-otp ────────────────────────────────
router.post('/send-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
  otpMemory[email] = { otp, expiresAt };

  try {
    await transporter.sendMail({
      from: `"Agradut Foundation" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your OTP for Agradut Admin Registration',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;border:1px solid #eee;border-radius:12px;">
          <h2 style="color:#d94f38;">Agradut Foundation</h2>
          <p>Your One-Time Password (OTP) for admin registration is:</p>
          <div style="font-size:2.5rem;font-weight:bold;letter-spacing:0.5rem;color:#333;text-align:center;padding:16px;background:#f5f5f5;border-radius:8px;margin:16px 0;">
            ${otp}
          </div>
          <p style="color:#888;font-size:0.85rem;">This OTP expires in 10 minutes. Do not share it with anyone.</p>
        </div>
      `,
    });
    res.json({ success: true, message: 'OTP sent' });
  } catch (err) {
    console.error('Email send error:', err);
    res.status(500).json({ error: 'Failed to send OTP email' });
  }
});

// ── POST /api/auth/verify-otp ──────────────────────────────
router.post('/verify-otp', (req, res) => {
  const { email, otp } = req.body;
  const record = otpMemory[email];
  if (!record) return res.status(400).json({ success: false, error: 'No OTP found. Request a new one.' });
  if (Date.now() > record.expiresAt) {
    delete otpMemory[email];
    return res.status(400).json({ success: false, error: 'OTP expired. Request a new one.' });
  }
  if (record.otp !== otp) {
    return res.status(400).json({ success: false, error: 'Invalid OTP.' });
  }
  delete otpMemory[email];
  res.json({ success: true });
});

// ── POST /api/auth/register ────────────────────────────────
router.post('/register', async (req, res) => {
  const { full_name, email, password, member_id, admin_id } = req.body;
  if (!full_name || !email || !password) {
    return res.status(400).json({ error: 'full_name, email and password are required' });
  }
  try {
    const hash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      `INSERT INTO admin_users (full_name, email, password_hash, member_id, admin_id)
       VALUES ($1,$2,$3,$4,$5) RETURNING id, full_name, email, member_id, admin_id`,
      [full_name, email, hash, member_id || null, admin_id || null]
    );
    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Email already registered' });
    }
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/auth/login ───────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  try {
    const result = await pool.query(
      'SELECT * FROM admin_users WHERE email=$1',
      [email]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        member_id: user.member_id,
        admin_id: user.admin_id,
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/auth/reset-password ──────────────────────────
router.post('/reset-password', async (req, res) => {
  const { email, otp, new_password } = req.body;
  if (!email || !otp || !new_password) {
    return res.status(400).json({ error: 'Email, OTP, and new password are required' });
  }

  // Verify OTP
  const record = otpMemory[email];
  if (!record) return res.status(400).json({ success: false, error: 'No OTP found. Request a new one.' });
  if (Date.now() > record.expiresAt) {
    delete otpMemory[email];
    return res.status(400).json({ success: false, error: 'OTP expired. Request a new one.' });
  }
  if (record.otp !== otp) {
    return res.status(400).json({ success: false, error: 'Invalid OTP.' });
  }

  // OTP is valid, now update the password in the database
  try {
    const hash = await bcrypt.hash(new_password, 12);
    const result = await pool.query(
      'UPDATE admin_users SET password_hash = $1 WHERE email = $2 RETURNING id',
      [hash, email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No admin account found with this email.' });
    }

    // Clear OTP after successful reset
    delete otpMemory[email];
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
