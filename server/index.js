require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');

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
  if (!fs.existsSync(full)) {
    fs.mkdirSync(full, { recursive: true });
  }
});

// Serve uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/applications', require('./routes/applications'));
app.use('/api/events', require('./routes/events'));
app.use('/api/content', require('./routes/content'));
app.use('/api/students', require('./routes/students'));

// Backward-compatible aliases
app.use('/content', require('./routes/content'));
app.use('/events', require('./routes/events'));

// Serve static HTML files
app.use(express.static(path.join(__dirname, '..')));

// Fallback – serve index.html for any unrecognised path
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

// =====================================================
// DATABASE INITIALIZATION
// Temporarily disabled for the client demo.
// We will enable this again when Railway MySQL is ready.
// =====================================================

// const {
//   sequelize,
//   ensureDatabaseExists,
//   Admin,
//   Student,
//   Application,
//   NewsTicker,
//   SiteSetting
// } = require('./models');

// async function initDB() {
//   await ensureDatabaseExists();
//   await sequelize.authenticate();
//   await sequelize.sync({ alter: true });

//   // Seed default admin
//   const adminExists = await Admin.findOne({
//     where: { email: 'admin@alikpeafoundation.org' }
//   });

//   if (!adminExists) {
//     const bcrypt = require('bcryptjs');
//     const hashed = await bcrypt.hash('Admin@ALIF2026', 10);

//     await Admin.create({
//       name: 'Super Admin',
//       email: 'admin@alikpeafoundation.org',
//       password: hashed,
//       role: 'super_admin'
//     });
//   }

//   console.log('✅ Database initialized');
// }

// Start server WITHOUT database for demo
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 ALIF Foundation Portal running on port ${PORT}`);
  console.log('ℹ️ Demo mode: database initialization is temporarily disabled.');
});

module.exports = app;
