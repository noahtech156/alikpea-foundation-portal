const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { Post, NewsTicker, Beneficiary, SiteSetting } = require('../models');
const { authenticateAdmin } = require('../middleware/auth');
const xlsx = require('xlsx');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads/content')),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.fieldname}${path.extname(file.originalname)}`)
});
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });

// --- Posts ---
router.get('/posts', async (req, res) => {
  try {
    const { category, limit = 10, page = 1 } = req.query;
    const where = { is_published: true };
    if (category) where.category = category;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows } = await Post.findAndCountAll({ where, limit: parseInt(limit), offset, order: [['createdAt', 'DESC']] });
    res.json({ total: count, posts: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/posts/category/:category', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const posts = await Post.findAll({ where: { category: req.params.category, is_published: true }, limit: parseInt(limit), order: [['createdAt', 'DESC']] });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/posts/:id', async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);
    if (!post) return res.status(404).json({ error: 'Not found' });
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin posts
router.get('/admin/posts', authenticateAdmin, async (req, res) => {
  try {
    const posts = await Post.findAll({ order: [['createdAt', 'DESC']] });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/posts', authenticateAdmin, upload.single('image'), async (req, res) => {
  try {
    const image_url = req.file ? `/uploads/content/${req.file.filename}` : req.body.image_url || null;
    const post = await Post.create({ ...req.body, image_url });
    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/posts/:id', authenticateAdmin, upload.single('image'), async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);
    if (!post) return res.status(404).json({ error: 'Not found' });
    const image_url = req.file ? `/uploads/content/${req.file.filename}` : (req.body.image_url || post.image_url);
    await post.update({ ...req.body, image_url });
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/posts/:id', authenticateAdmin, async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);
    if (!post) return res.status(404).json({ error: 'Not found' });
    await post.destroy();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- News Ticker ---
router.get('/news-ticker/active', async (req, res) => {
  try {
    const items = await NewsTicker.findAll({ where: { is_active: true }, order: [['order_index', 'ASC']] });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/news-ticker', authenticateAdmin, async (req, res) => {
  try {
    const items = await NewsTicker.findAll({ order: [['order_index', 'ASC']] });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/news-ticker', authenticateAdmin, async (req, res) => {
  try {
    const item = await NewsTicker.create(req.body);
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/news-ticker/:id', authenticateAdmin, async (req, res) => {
  try {
    const item = await NewsTicker.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    await item.update(req.body);
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/news-ticker/:id', authenticateAdmin, async (req, res) => {
  try {
    const item = await NewsTicker.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    await item.destroy();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Beneficiaries ---
router.get('/beneficiaries', async (req, res) => {
  try {
    const { search, page = 1, limit = 50 } = req.query;
    const where = {};
    if (search) {
      const { Op } = require('sequelize');
      where.name = { [Op.like]: `%${search}%` };
    }
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows } = await Beneficiary.findAndCountAll({ where, limit: parseInt(limit), offset, order: [['year', 'DESC'], ['name', 'ASC']] });
    res.json({ total: count, beneficiaries: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload beneficiaries via Excel/CSV
router.post('/beneficiaries/upload', authenticateAdmin, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const wb = xlsx.readFile(req.file.path);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(ws);
    let inserted = 0;
    for (const row of data) {
      const name = row['Name'] || row['name'] || row['Full Name'] || row['full_name'];
      if (!name) continue;
      await Beneficiary.create({
        name: name.toString().trim(),
        institution: (row['Institution'] || row['institution'] || '').toString().trim(),
        year: (row['Year'] || row['year'] || '').toString().trim(),
        department: (row['Department'] || row['department'] || '').toString().trim(),
        level: (row['Level'] || row['level'] || '').toString().trim()
      });
      inserted++;
    }
    res.json({ success: true, inserted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/beneficiaries/:id', authenticateAdmin, async (req, res) => {
  try {
    const b = await Beneficiary.findByPk(req.params.id);
    if (!b) return res.status(404).json({ error: 'Not found' });
    await b.destroy();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Site Settings ---
router.get('/settings', async (req, res) => {
  try {
    const settings = await SiteSetting.findAll();
    const obj = {};
    settings.forEach(s => { obj[s.key] = s.value; });
    res.json(obj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/settings', authenticateAdmin, async (req, res) => {
  try {
    for (const [key, value] of Object.entries(req.body)) {
      await SiteSetting.upsert({ key, value });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
