require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Ensure upload directories exist
['uploads/documents', 'uploads/events', 'uploads/content'].forEach(dir => {
  const full = path.join(__dirname, '..', dir);
  if (!fs.existsSync(full)) fs.mkdirSync(full, { recursive: true });
});

// Serve uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/applications', require('./routes/applications'));
app.use('/api/events', require('./routes/events'));
app.use('/api/content', require('./routes/content'));
app.use('/api/students', require('./routes/students'));

// Backward-compatible aliases (existing index.html calls these paths without /api prefix)
app.use('/content', require('./routes/content'));
app.use('/events', require('./routes/events'));

// Serve static HTML files
app.use(express.static(path.join(__dirname, '..')));

// Fallback – serve index.html for any unrecognised path
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

// Database init + seed
const { sequelize, Admin, NewsTicker, SiteSetting } = require('./models');

async function initDB() {
  await sequelize.sync({ alter: true });

  // Seed default admin
  const adminExists = await Admin.findOne({ where: { email: 'admin@alikpeafoundation.org' } });
  if (!adminExists) {
    const hashed = await bcrypt.hash('Admin@ALIF2026', 10);
    await Admin.create({
      name: 'Super Admin',
      email: 'admin@alikpeafoundation.org',
      password: hashed,
      role: 'super_admin'
    });
    console.log('✅ Default admin created: admin@alikpeafoundation.org / Admin@ALIF2026');
  }

  // Seed default news ticker
  const tickerCount = await NewsTicker.count();
  if (tickerCount === 0) {
    await NewsTicker.bulkCreate([
      { content: 'ALIF Scholarship Application for 2026 now open', is_active: true, order_index: 1 },
      { content: 'Chief (Dr.) Leemon A. Ikepa receives humanitarian award', is_active: true, order_index: 2 },
      { content: 'Mentoring session scheduled for next week', is_active: true, order_index: 3 }
    ]);
  }

  // Seed default site settings
  const settingsCount = await SiteSetting.count();
  if (settingsCount === 0) {
    await SiteSetting.bulkCreate([
      { key: 'hero_title', value: 'Welcome to Agbonjagwe Leemon Ikpea Foundation', label: 'Hero Title' },
      { key: 'hero_subtitle', value: 'ALIF is dedicated to empowering Nigeria\'s most vulnerable—providing scholarships for indigent students, supporting widows and the elderly, and offering free medical care to those in need.', label: 'Hero Subtitle' },
      { key: 'scholarship_open', value: 'true', label: 'Scholarship Applications Open' }
    ]);
  }

  console.log('✅ Database initialized');
}

app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 ALIF Foundation Portal running on port ${PORT}`);
  await initDB();
});

module.exports = app;
