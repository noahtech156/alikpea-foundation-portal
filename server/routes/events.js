const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { Event } = require('../models');
const { authenticateAdmin } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads/events')),
  filename: (req, file, cb) => cb(null, `${Date.now()}-event${path.extname(file.originalname)}`)
});
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });

// Public: get all published events
router.get('/', async (req, res) => {
  try {
    const events = await Event.findAll({ where: { is_published: true }, order: [['event_date', 'DESC'], ['createdAt', 'DESC']] });
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) return res.status(404).json({ error: 'Not found' });
    res.json(event);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: get all events
router.get('/admin/all', authenticateAdmin, async (req, res) => {
  try {
    const events = await Event.findAll({ order: [['createdAt', 'DESC']] });
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: create event
router.post('/', authenticateAdmin, upload.single('image'), async (req, res) => {
  try {
    const image_url = req.file ? `/uploads/events/${req.file.filename}` : req.body.image_url || null;
    const event = await Event.create({ ...req.body, image_url });
    res.status(201).json(event);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: update event
router.put('/:id', authenticateAdmin, upload.single('image'), async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) return res.status(404).json({ error: 'Not found' });
    const image_url = req.file ? `/uploads/events/${req.file.filename}` : (req.body.image_url || event.image_url);
    await event.update({ ...req.body, image_url });
    res.json(event);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: delete event
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) return res.status(404).json({ error: 'Not found' });
    await event.destroy();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
