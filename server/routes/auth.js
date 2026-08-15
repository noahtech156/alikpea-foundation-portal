const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Admin, Student, Application, ResetToken } = require('../models');
const { JWT_SECRET, authenticateAdmin } = require('../middleware/auth');
const { sendPasswordResetEmail, sendTemporaryPasswordEmail } = require('../services/email');

// Admin login
router.post('/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const admin = await Admin.findOne({ where: { email } });
    if (!admin) return res.status(401).json({ error: 'Invalid credentials' });
    const valid = await bcrypt.compare(password, admin.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: admin.id, email: admin.email, name: admin.name, role: admin.role }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, name: admin.name, email: admin.email, role: admin.role });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Student login
router.post('/student/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const student = await Student.findOne({ where: { email } });
    if (!student) return res.status(401).json({ error: 'Invalid credentials' });
    if (!student.is_active) return res.status(403).json({ error: 'Account is inactive' });
    const valid = await bcrypt.compare(password, student.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    const application = await Application.findByPk(student.application_id);
    const token = jwt.sign({ id: student.id, email: student.email, application_id: student.application_id, role: 'student' }, JWT_SECRET, { expiresIn: '12h' });
    res.json({ token, email: student.email, name: application?.full_name || '', application_id: student.application_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Student: request password reset
router.post('/student/forgot', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });
    const student = await Student.findOne({ where: { email } });
    if (!student) return res.json({ success: true });
    const application = await Application.findByPk(student.application_id);
    const token = crypto.randomBytes(24).toString('hex');
    const expires_at = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await ResetToken.create({ token, user_type: 'student', user_id: student.id, expires_at });
    sendPasswordResetEmail(email, application?.full_name || '', token, 'student').catch(console.error);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: request password reset
router.post('/admin/forgot', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });
    const admin = await Admin.findOne({ where: { email } });
    if (!admin) return res.json({ success: true });
    const token = crypto.randomBytes(24).toString('hex');
    const expires_at = new Date(Date.now() + 60 * 60 * 1000);
    await ResetToken.create({ token, user_type: 'admin', user_id: admin.id, expires_at });
    sendPasswordResetEmail(email, admin.name || '', token, 'admin').catch(console.error);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Perform password reset (using token)
router.post('/reset', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: 'Token and password required' });
    const rt = await ResetToken.findOne({ where: { token, used: false } });
    if (!rt || new Date(rt.expires_at) < new Date()) return res.status(400).json({ error: 'Invalid or expired token' });

    const hashed = await bcrypt.hash(password, 10);
    if (rt.user_type === 'student') {
      const student = await Student.findByPk(rt.user_id);
      if (!student) return res.status(404).json({ error: 'User not found' });
      await student.update({ password: hashed, is_active: true });
    } else {
      const admin = await Admin.findByPk(rt.user_id);
      if (!admin) return res.status(404).json({ error: 'User not found' });
      await admin.update({ password: hashed });
    }

    await rt.update({ used: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: reset a student's password and email temporary password
router.patch('/admin/reset-student/:id', authenticateAdmin, async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.id);
    if (!student) return res.status(404).json({ error: 'Student not found' });
    const application = await Application.findByPk(student.application_id);
    const rawPassword = `AF${new Date().getFullYear()}@${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const hashed = await bcrypt.hash(rawPassword, 10);
    await student.update({ password: hashed, is_active: true });
    sendTemporaryPasswordEmail(student.email, application?.full_name || '', rawPassword).catch(console.error);
    // Return the temporary password in the response for admin visibility (one-time).
    res.json({ success: true, message: 'Temporary password set and emailed to student', password: rawPassword });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
