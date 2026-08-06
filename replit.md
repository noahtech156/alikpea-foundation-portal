# Alikpea Foundation Scholarship Portal

## Project Overview

A full-stack scholarship portal for the **Agbonjagwe Leemon Ikpea Foundation (ALIF)** built with:
- **Frontend**: Vanilla HTML + Tailwind CSS CDN (matches existing site design)
- **Backend**: Node.js + Express.js
- **Database**: SQLite (default, production-ready switch to MySQL via env vars)
- **Auth**: JWT tokens
- **File Uploads**: Multer (stored in `/uploads/`)
- **Email**: Nodemailer (configured via SMTP env vars)

## How to Run

The app is configured to start automatically. The server runs on port 5000 and serves both the website and the API.

```bash
npm install
npm start
```

## Default Admin Credentials

```
Email:    admin@alikpeafoundation.org
Password: Admin@ALIF2026
```
**⚠️ Change this password immediately after first login.**

## Pages

| Page | URL |
|------|-----|
| Homepage | `/index.html` |
| Scholarship | `/scholarship.html` |
| Grant for Artisans | `/grant-for-artisans.html` |
| Career Counseling | `/career-counseling.html` |
| Application Form | `/scholarship-form.html` |
| Student Login | `/login.html` |
| Student Dashboard | `/student-dashboard.html` |
| Admin Login | `/admin/` |
| Admin Scholarship Mgmt | `/admin/scholarship.html` |
| Admin CMS | `/admin/cms.html` |

## API Endpoints

### Auth
- `POST /api/auth/admin/login` — Admin login
- `POST /api/auth/student/login` — Student login

### Applications
- `POST /api/applications` — Submit scholarship application (multipart/form-data)
- `GET /api/applications` — List applications (admin)
- `GET /api/applications/:id` — Get application detail (admin)
- `PATCH /api/applications/:id/review` — Mark under review (admin)
- `PATCH /api/applications/:id/accept` — Accept + create student account (admin)
- `PATCH /api/applications/:id/reject` — Reject application (admin)
- `GET /api/applications/stats/summary` — Dashboard stats (admin)

### Events
- `GET /api/events` — List published events (public)
- `POST /api/events` — Create event (admin, multipart)
- `PUT /api/events/:id` — Update event (admin, multipart)
- `DELETE /api/events/:id` — Delete event (admin)

### Content
- `GET /api/content/posts` — List published posts (public)
- `GET /api/content/beneficiaries` — List beneficiaries (public)
- `POST /api/content/beneficiaries/upload` — Upload Excel/CSV (admin)
- `GET /api/content/news-ticker/active` — Active ticker items (public)
- `GET /api/content/settings` — Site settings (public)
- `PUT /api/content/settings` — Update settings (admin)

### Students
- `GET /api/students/profile` — Student profile (student auth)
- `POST /api/students/disbursement` — Submit disbursement (student auth)
- `GET /api/students/disbursements` — Disbursement history (student auth)
- `POST /api/students/remark` — Submit appreciation (student auth)

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `SESSION_SECRET` | JWT signing secret | auto |
| `JWT_SECRET` | JWT secret (same as SESSION_SECRET if set) | fallback |
| `DB_DIALECT` | `sqlite` or `mysql` | `sqlite` |
| `DB_HOST` | MySQL host | `localhost` |
| `DB_PORT` | MySQL port | `3306` |
| `DB_NAME` | MySQL database name | `alif_foundation` |
| `DB_USER` | MySQL username | `root` |
| `DB_PASSWORD` | MySQL password | — |
| `SMTP_HOST` | Email SMTP host | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP port | `587` |
| `SMTP_USER` | SMTP username/email | — |
| `SMTP_PASS` | SMTP password/app password | — |
| `SMTP_FROM` | From email address | `info@alikpeafoundation.org` |
| `BASE_URL` | Public website URL (used in emails) | — |

## Switching to MySQL

Set these environment variables:
```
DB_DIALECT=mysql
DB_HOST=your-mysql-host
DB_NAME=alif_foundation
DB_USER=your-username
DB_PASSWORD=your-password
```

## Enabling Email Notifications

Set SMTP credentials (Gmail recommended):
1. Enable 2FA on your Gmail account
2. Generate an App Password at myaccount.google.com/apppasswords
3. Set `SMTP_USER=your@gmail.com` and `SMTP_PASS=your-app-password`

## Design System

| Token | Value |
|-------|-------|
| Primary (Teal) | `#194341` |
| Accent (Yellow) | `#FFCD28` |
| Green | `#2CB770` |
| Text Gray | `#5F6973` |
| Footer BG | `#0D2C2B` |
| Page BG | `linear-gradient(to bottom, #F0FDF4, #FFFFFF)` |

## Contact Info (from the site)
- **Address**: True Vine Plaza, 66B Ujoelen Rd, Ekpoma, Edo State
- **Phone**: (+234) 813 5283 434
- **Email**: info@alikpeafoundation.org

## User Preferences

- Keep existing HTML/Tailwind design intact — do not migrate to React
- Extend existing pages, never redesign
- All new features must match the existing color palette and typography
- Backend should work with SQLite by default, MySQL in production
