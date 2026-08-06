const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { Application, Student, Admin } = require('../models');
const { authenticateAdmin } = require('../middleware/auth');
const { sendAcceptanceEmail, sendRejectionEmail, sendConfirmationEmail } = require('../services/email');

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads/documents')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${file.fieldname}${ext}`);
  }
});
const fileFilter = (req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.pdf', '.doc', '.docx'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) cb(null, true);
  else cb(new Error('File type not allowed'), false);
};
const upload = multer({ storage, fileFilter, limits: { fileSize: 20 * 1024 * 1024 } });

const docFields = [
  { name: 'passport_photo', maxCount: 1 },
  { name: 'waec_result', maxCount: 1 },
  { name: 'jamb_result', maxCount: 1 },
  { name: 'admission_letter', maxCount: 1 },
  { name: 'school_id', maxCount: 1 },
  { name: 'birth_certificate', maxCount: 1 },
  { name: 'lga_certificate', maxCount: 1 },
  { name: 'recommendation_letter', maxCount: 1 },
  { name: 'transcript', maxCount: 1 }
];

// Submit application
router.post('/', upload.fields(docFields), async (req, res) => {
  try {
    const body = req.body;
    const files = req.files || {};
    const getFile = (field) => files[field]?.[0]?.filename ? `/uploads/documents/${files[field][0].filename}` : null;

    if (!body.declaration || body.declaration !== 'true') {
      return res.status(400).json({ error: 'You must accept the declaration' });
    }

    // Check for duplicate email
    const existing = await Application.findOne({ where: { email: body.email } });
    if (existing) return res.status(409).json({ error: 'An application with this email already exists' });

    const appId = `ALIF-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 90000) + 10000)}`;

    const application = await Application.create({
      application_id: appId,
      full_name: body.full_name,
      email: body.email,
      phone: body.phone,
      dob: body.dob,
      gender: body.gender,
      address: body.address,
      lga: body.lga,
      state: body.state,
      institution: body.institution,
      faculty: body.faculty,
      department: body.department,
      course: body.course,
      level: body.level,
      matric_number: body.matric_number,
      cgpa: body.cgpa,
      passport_photo: getFile('passport_photo'),
      waec_result: getFile('waec_result'),
      jamb_result: getFile('jamb_result'),
      admission_letter: getFile('admission_letter'),
      school_id: getFile('school_id'),
      birth_certificate: getFile('birth_certificate'),
      lga_certificate: getFile('lga_certificate'),
      recommendation_letter: getFile('recommendation_letter'),
      transcript: getFile('transcript'),
      declaration: true,
      status: 'pending'
    });

    // Send confirmation email (non-blocking)
    sendConfirmationEmail(body.email, body.full_name, appId).catch(console.error);

    res.status(201).json({ success: true, application_id: appId, message: 'Application submitted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// --- Admin routes ---

// Get all applications
router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const { status, search, page = 1, limit = 50 } = req.query;
    const where = {};
    if (status) where.status = status;
    if (search) {
      const { Op } = require('sequelize');
      where[Op.or] = [
        { full_name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { institution: { [Op.like]: `%${search}%` } },
        { application_id: { [Op.like]: `%${search}%` } }
      ];
    }
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows } = await Application.findAndCountAll({ where, limit: parseInt(limit), offset, order: [['createdAt', 'DESC']] });
    res.json({ total: count, page: parseInt(page), applications: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single application
router.get('/:id', authenticateAdmin, async (req, res) => {
  try {
    const app = await Application.findByPk(req.params.id);
    if (!app) return res.status(404).json({ error: 'Application not found' });
    res.json(app);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update status (review)
router.patch('/:id/review', authenticateAdmin, async (req, res) => {
  try {
    const app = await Application.findByPk(req.params.id);
    if (!app) return res.status(404).json({ error: 'Not found' });
    await app.update({ status: 'under_review', reviewed_by: req.user.id, reviewed_at: new Date() });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Accept application
router.patch('/:id/accept', authenticateAdmin, async (req, res) => {
  try {
    const app = await Application.findByPk(req.params.id);
    if (!app) return res.status(404).json({ error: 'Not found' });

    // Generate password
    const rawPassword = `AF${new Date().getFullYear()}@${Math.random().toString(36).substring(2, 7).toUpperCase()}${Math.floor(Math.random() * 90 + 10)}`;
    const hashed = await bcrypt.hash(rawPassword, 10);

    // Check if student already exists
    let student = await Student.findOne({ where: { email: app.email } });
    if (!student) {
      student = await Student.create({ email: app.email, password: hashed, application_id: app.id });
    } else {
      await student.update({ password: hashed, application_id: app.id, is_active: true });
    }

    await app.update({ status: 'accepted', reviewed_by: req.user.id, reviewed_at: new Date(), admin_note: req.body.note || null });

    // Send acceptance email with credentials
    sendAcceptanceEmail(app.email, app.full_name, rawPassword).catch(console.error);

    res.json({ success: true, message: 'Application accepted, student account created' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reject application
router.patch('/:id/reject', authenticateAdmin, async (req, res) => {
  try {
    const app = await Application.findByPk(req.params.id);
    if (!app) return res.status(404).json({ error: 'Not found' });
    await app.update({ status: 'rejected', reviewed_by: req.user.id, reviewed_at: new Date(), admin_note: req.body.note || null });
    sendRejectionEmail(app.email, app.full_name).catch(console.error);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Stats
router.get('/stats/summary', authenticateAdmin, async (req, res) => {
  try {
    const total = await Application.count();
    const pending = await Application.count({ where: { status: 'pending' } });
    const under_review = await Application.count({ where: { status: 'under_review' } });
    const accepted = await Application.count({ where: { status: 'accepted' } });
    const rejected = await Application.count({ where: { status: 'rejected' } });
    res.json({ total, pending, under_review, accepted, rejected });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
