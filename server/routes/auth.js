const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Admin, Student, Application } = require('../models');
const { JWT_SECRET } = require('../middleware/auth');

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

module.exports = router;
