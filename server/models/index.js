const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Admin model
const Admin = sequelize.define('Admin', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM('super_admin', 'admin'), defaultValue: 'admin' }
}, { tableName: 'admins', timestamps: true });

// Student/User model (accepted applicants)
const Student = sequelize.define('Student', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  application_id: { type: DataTypes.INTEGER },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true }
}, { tableName: 'students', timestamps: true });

// Application model
const Application = sequelize.define('Application', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  application_id: { type: DataTypes.STRING, unique: true },
  // Personal
  full_name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false },
  phone: { type: DataTypes.STRING, allowNull: false },
  dob: { type: DataTypes.DATEONLY },
  gender: { type: DataTypes.STRING },
  address: { type: DataTypes.TEXT },
  lga: { type: DataTypes.STRING },
  state: { type: DataTypes.STRING },
  // Academic
  institution: { type: DataTypes.STRING },
  faculty: { type: DataTypes.STRING },
  department: { type: DataTypes.STRING },
  course: { type: DataTypes.STRING },
  level: { type: DataTypes.STRING },
  matric_number: { type: DataTypes.STRING },
  cgpa: { type: DataTypes.STRING },
  // Documents (file paths)
  passport_photo: { type: DataTypes.STRING },
  waec_result: { type: DataTypes.STRING },
  jamb_result: { type: DataTypes.STRING },
  admission_letter: { type: DataTypes.STRING },
  school_id: { type: DataTypes.STRING },
  birth_certificate: { type: DataTypes.STRING },
  lga_certificate: { type: DataTypes.STRING },
  recommendation_letter: { type: DataTypes.STRING },
  transcript: { type: DataTypes.STRING },
  // Status
  status: { type: DataTypes.ENUM('pending', 'under_review', 'accepted', 'rejected'), defaultValue: 'pending' },
  admin_note: { type: DataTypes.TEXT },
  reviewed_at: { type: DataTypes.DATE },
  reviewed_by: { type: DataTypes.INTEGER },
  declaration: { type: DataTypes.BOOLEAN, defaultValue: false }
}, { tableName: 'applications', timestamps: true });

// Event model
const Event = sequelize.define('Event', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  image_url: { type: DataTypes.STRING },
  event_date: { type: DataTypes.DATEONLY },
  is_published: { type: DataTypes.BOOLEAN, defaultValue: true }
}, { tableName: 'events', timestamps: true });

// Content/Post model (for CMS)
const Post = sequelize.define('Post', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING, allowNull: false },
  content: { type: DataTypes.TEXT },
  excerpt: { type: DataTypes.TEXT },
  image_url: { type: DataTypes.STRING },
  category: { type: DataTypes.STRING, defaultValue: 'news' },
  is_published: { type: DataTypes.BOOLEAN, defaultValue: true }
}, { tableName: 'posts', timestamps: true });

// News ticker model
const NewsTicker = sequelize.define('NewsTicker', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  content: { type: DataTypes.STRING, allowNull: false },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  order_index: { type: DataTypes.INTEGER, defaultValue: 0 }
}, { tableName: 'news_tickers', timestamps: true });

// Disbursement model
const Disbursement = sequelize.define('Disbursement', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  student_id: { type: DataTypes.INTEGER, allowNull: false },
  application_id: { type: DataTypes.INTEGER, allowNull: false },
  bank_name: { type: DataTypes.STRING },
  account_name: { type: DataTypes.STRING },
  account_number: { type: DataTypes.STRING },
  amount: { type: DataTypes.DECIMAL(10, 2) },
  date_received: { type: DataTypes.DATEONLY },
  remarks: { type: DataTypes.TEXT },
  reference_number: { type: DataTypes.STRING },
  status: { type: DataTypes.ENUM('pending', 'approved', 'paid', 'rejected'), defaultValue: 'pending' }
}, { tableName: 'disbursements', timestamps: true });

// Appreciation remark model
const AppreciationRemark = sequelize.define('AppreciationRemark', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  student_id: { type: DataTypes.INTEGER, allowNull: false },
  application_id: { type: DataTypes.INTEGER, allowNull: false },
  remark: { type: DataTypes.TEXT, allowNull: false }
}, { tableName: 'appreciation_remarks', timestamps: true });

// Beneficiary model (past beneficiaries)
const Beneficiary = sequelize.define('Beneficiary', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  institution: { type: DataTypes.STRING },
  year: { type: DataTypes.STRING },
  department: { type: DataTypes.STRING },
  level: { type: DataTypes.STRING }
}, { tableName: 'beneficiaries', timestamps: true });

// Site settings model
const SiteSetting = sequelize.define('SiteSetting', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  key: { type: DataTypes.STRING, allowNull: false, unique: true },
  value: { type: DataTypes.TEXT },
  label: { type: DataTypes.STRING }
}, { tableName: 'site_settings', timestamps: true });

module.exports = {
  sequelize,
  Admin,
  Student,
  Application,
  Event,
  Post,
  NewsTicker,
  Disbursement,
  AppreciationRemark,
  Beneficiary,
  SiteSetting
};
