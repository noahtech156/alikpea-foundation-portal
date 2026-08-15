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
    const { bank_name, account_name, account_number, amount, date_received, remarks, school_portal_link, student_kofa_id, student_kofa_password } = req.body;
    const ref = `ALIF-DISB-${Date.now()}`;
    const disb = await Disbursement.create({
      student_id: student.id,
      application_id: student.application_id,
      bank_name, account_name, account_number, amount, date_received, remarks,
      school_portal_link, student_kofa_id, student_kofa_password,
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

// Export disbursements as CSV
router.get('/admin/disbursements/export/csv', authenticateAdmin, async (req, res) => {
  try {
    const { status, search } = req.query;
    const where = {};
    const { Op } = require('sequelize');
    if (status) where.status = status;
    if (search) {
      where[Op.or] = [
        { reference_number: { [Op.like]: `%${search}%` } },
        { bank_name: { [Op.like]: `%${search}%` } },
        { account_name: { [Op.like]: `%${search}%` } }
      ];
    }
    const rows = await Disbursement.findAll({ where, order: [['createdAt','DESC']] });
    // attach applicant info
    const result = await Promise.all(rows.map(async (d) => {
      const app = await Application.findByPk(d.application_id);
      return { ...d.toJSON(), applicant_name: app?.full_name || '', applicant_email: app?.email || '' };
    }));
    const fields = ['reference_number','applicant_name','applicant_email','bank_name','account_name','account_number','amount','paid_amount','status','date_received','paid_at','student_confirmed','createdAt'];
    function escapeCsv(v){ if (v === null || v === undefined) return ''; const s = String(v); if (/[",\n]/.test(s)) return '"' + s.replace(/"/g,'""') + '"'; return s; }
    let csv = fields.join(',') + '\n';
    for (const r of result) csv += fields.map(f => escapeCsv(r[f])).join(',') + '\n';
    res.setHeader('Content-Type','text/csv');
    res.setHeader('Content-Disposition','attachment; filename="disbursements.csv"');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Export disbursements as CSV
router.get('/admin/disbursements/export', authenticateAdmin, async (req, res) => {
  try {
    const disbs = await Disbursement.findAll({ order: [['createdAt', 'DESC']] });
    const rows = await Promise.all(disbs.map(async (d) => {
      const app = await Application.findByPk(d.application_id);
      return { ...d.toJSON(), applicant_name: app?.full_name || '', applicant_email: app?.email || '' };
    }));

    const fields = ['reference_number','applicant_name','applicant_email','bank_name','account_name','account_number','amount','paid_amount','status','date_received','paid_at','student_confirmed','student_confirmed_at','school_portal_link','student_kofa_id','remarks','createdAt'];
    function escapeCsv(v){ if (v === null || v === undefined) return ''; const s = String(v); if (/[",\n]/.test(s)) return '"' + s.replace(/"/g,'""') + '"'; return s; }
    let csv = fields.join(',') + '\n';
    for (const r of rows) {
      csv += fields.map(f => escapeCsv(r[f])).join(',') + '\n';
    }
    res.setHeader('Content-Type','text/csv');
    res.setHeader('Content-Disposition','attachment; filename="disbursements.csv"');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/admin/disbursements/:id/status', authenticateAdmin, async (req, res) => {
  try {
    const disb = await Disbursement.findByPk(req.params.id);
    if (!disb) return res.status(404).json({ error: 'Not found' });
    const updates = {};
    if (req.body.status) updates.status = req.body.status;
    // If admin marks as paid, record paid amount and timestamp
    if (req.body.paid_amount) {
      updates.paid_amount = req.body.paid_amount;
      updates.paid_at = new Date();
    }
    await disb.update(updates);
    res.json(disb);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Student confirms receipt of payment
router.patch('/disbursement/:id/confirm', authenticateStudent, async (req, res) => {
  try {
    const disb = await Disbursement.findByPk(req.params.id);
    if (!disb) return res.status(404).json({ error: 'Not found' });
    if (disb.student_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    await disb.update({ student_confirmed: true, student_confirmed_at: new Date() });
    res.json({ success: true });
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

// Admin: list students with application info
router.get('/admin/list', authenticateAdmin, async (req, res) => {
  try {
    const students = await Student.findAll({ order: [['createdAt', 'DESC']] });
    const result = await Promise.all(students.map(async (s) => {
      const app = await Application.findByPk(s.application_id);
      return { id: s.id, email: s.email, is_active: s.is_active, application: app ? { id: app.id, full_name: app.full_name, email: app.email, application_id: app.application_id } : null };
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
