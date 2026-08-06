const express = require('express');
const router = express.Router();
const { Student, Application, Disbursement, AppreciationRemark } = require('../models');
const { authenticateStudent, authenticateAdmin } = require('../middleware/auth');

// Get student profile
router.get('/profile', authenticateStudent, async (req, res) => {
  try {
    const student = await Student.findByPk(req.user.id);
    if (!student) return res.status(404).json({ error: 'Not found' });
    const application = await Application.findByPk(student.application_id);
    if (!application) return res.status(404).json({ error: 'Application not found' });
    res.json({ student: { id: student.id, email: student.email }, application });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Submit disbursement
router.post('/disbursement', authenticateStudent, async (req, res) => {
  try {
    const student = await Student.findByPk(req.user.id);
    const { bank_name, account_name, account_number, amount, date_received, remarks } = req.body;
    const ref = `ALIF-DISB-${Date.now()}`;
    const disb = await Disbursement.create({
      student_id: student.id,
      application_id: student.application_id,
      bank_name, account_name, account_number, amount, date_received, remarks,
      reference_number: ref,
      status: 'pending'
    });
    res.status(201).json(disb);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get disbursement history
router.get('/disbursements', authenticateStudent, async (req, res) => {
  try {
    const disbs = await Disbursement.findAll({
      where: { student_id: req.user.id },
      order: [['createdAt', 'DESC']]
    });
    res.json(disbs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Submit appreciation remark
router.post('/remark', authenticateStudent, async (req, res) => {
  try {
    const student = await Student.findByPk(req.user.id);
    const remark = await AppreciationRemark.create({
      student_id: student.id,
      application_id: student.application_id,
      remark: req.body.remark
    });
    res.status(201).json(remark);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get remarks
router.get('/remarks', authenticateStudent, async (req, res) => {
  try {
    const remarks = await AppreciationRemark.findAll({
      where: { student_id: req.user.id },
      order: [['createdAt', 'DESC']]
    });
    res.json(remarks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Admin disbursement management ---
router.get('/admin/disbursements', authenticateAdmin, async (req, res) => {
  try {
    const disbs = await Disbursement.findAll({ order: [['createdAt', 'DESC']] });
    // Attach applicant names
    const result = await Promise.all(disbs.map(async (d) => {
      const app = await Application.findByPk(d.application_id);
      return { ...d.toJSON(), applicant_name: app?.full_name || '', applicant_email: app?.email || '' };
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/admin/disbursements/:id/status', authenticateAdmin, async (req, res) => {
  try {
    const disb = await Disbursement.findByPk(req.params.id);
    if (!disb) return res.status(404).json({ error: 'Not found' });
    await disb.update({ status: req.body.status });
    res.json(disb);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: get all remarks
router.get('/admin/remarks', authenticateAdmin, async (req, res) => {
  try {
    const remarks = await AppreciationRemark.findAll({ order: [['createdAt', 'DESC']] });
    const result = await Promise.all(remarks.map(async (r) => {
      const app = await Application.findByPk(r.application_id);
      return { ...r.toJSON(), applicant_name: app?.full_name || '' };
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
