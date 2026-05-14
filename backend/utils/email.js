const nodemailer = require('nodemailer');
const pool = require('../db');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function notifyAllAdmins(subject, htmlContent) {
  try {
    const { rows } = await pool.query('SELECT email FROM admin_users');
    const emails = rows.map(r => r.email).filter(Boolean);
    
    if (emails.length === 0) return;

    await transporter.sendMail({
      from: `"Agradut Foundation Alerts" <${process.env.EMAIL_USER}>`,
      to: emails.join(','),
      subject,
      html: htmlContent,
    });
    console.log(`Notified admins: ${subject}`);
  } catch (err) {
    console.error('Failed to notify admins:', err);
  }
}

module.exports = { transporter, notifyAllAdmins };
