const nodemailer = require('nodemailer');

function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || ''
    }
  });
}

const FROM = process.env.SMTP_FROM || 'info@alikpeafoundation.org';
const BASE_URL = process.env.BASE_URL || 'https://alikpeafoundation.org';

async function sendConfirmationEmail(to, name, appId) {
  if (!process.env.SMTP_USER) return;
  const transporter = getTransporter();
  await transporter.sendMail({
    from: `"Alikpea Foundation" <${FROM}>`,
    to,
    subject: 'Application Received – ALIF Scholarship 2026',
    html: `
      <div style="font-family:Inter,sans-serif;max-width:600px;margin:auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
        <div style="background:#194341;padding:24px;text-align:center;">
          <h2 style="color:#FFCD28;margin:0;">Alikpea Foundation</h2>
        </div>
        <div style="padding:32px;">
          <h3 style="color:#194341;">Dear ${name},</h3>
          <p style="color:#5F6973;line-height:1.7;">Thank you for submitting your scholarship application to the <strong>Agbonjagwe Leemon Ikpea Foundation (ALIF)</strong>. We have received your application and it is currently under review.</p>
          <div style="background:#F0FDF4;border:1px solid #A7F3D0;border-radius:8px;padding:16px;margin:20px 0;">
            <p style="margin:0;color:#194341;font-weight:bold;">Your Application ID: <span style="color:#2CB770;">${appId}</span></p>
          </div>
          <p style="color:#5F6973;line-height:1.7;">Our team will review your application and notify you of our decision by email. Please keep this Application ID for your records.</p>
          <p style="color:#5F6973;line-height:1.7;">For enquiries, please contact us at <a href="mailto:info@alikpeafoundation.org" style="color:#194341;">info@alikpeafoundation.org</a> or call <strong>(+234) 813 5283 434</strong>.</p>
          <br>
          <p style="color:#194341;font-weight:bold;">Warm regards,<br>ALIF Scholarship Team</p>
        </div>
        <div style="background:#0D2C2B;padding:16px;text-align:center;">
          <p style="color:#9CA3AF;font-size:12px;margin:0;">© 2026 Alikpea Foundation. True Vine Plaza, 66B Ujoelen Rd, Ekpoma, Edo State.</p>
        </div>
      </div>
    `
  });
}

async function sendAcceptanceEmail(to, name, password) {
  if (!process.env.SMTP_USER) return;
  const transporter = getTransporter();
  await transporter.sendMail({
    from: `"Alikpea Foundation" <${FROM}>`,
    to,
    subject: '🎉 Congratulations! You Have Been Selected – ALIF Scholarship',
    html: `
      <div style="font-family:Inter,sans-serif;max-width:600px;margin:auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
        <div style="background:#194341;padding:24px;text-align:center;">
          <h2 style="color:#FFCD28;margin:0;">Alikpea Foundation</h2>
        </div>
        <div style="padding:32px;">
          <h3 style="color:#2CB770;">Congratulations, ${name}! 🎉</h3>
          <p style="color:#5F6973;line-height:1.7;">We are delighted to inform you that you have been <strong>selected</strong> as one of the beneficiaries of the <strong>ALIF Scholarship 2026</strong>. This is a testament to your academic dedication and your potential to make a lasting impact.</p>
          <p style="color:#5F6973;line-height:1.7;">You can now log in to the ALIF Student Portal to view your profile, fill out disbursement details, and track your scholarship status.</p>
          <div style="background:#F0FDF4;border:1px solid #A7F3D0;border-radius:8px;padding:20px;margin:20px 0;">
            <p style="margin:0 0 8px;color:#194341;font-weight:bold;">Your Login Credentials:</p>
            <p style="margin:4px 0;color:#5F6973;"><strong>Email:</strong> ${to}</p>
            <p style="margin:4px 0;color:#5F6973;"><strong>Password:</strong> <span style="font-family:monospace;background:#e5e7eb;padding:2px 8px;border-radius:4px;">${password}</span></p>
            <p style="margin:12px 0 0;"><a href="${BASE_URL}/login.html" style="background:#FFCD28;color:#194341;padding:10px 24px;border-radius:999px;text-decoration:none;font-weight:bold;">Login to Your Dashboard →</a></p>
          </div>
          <p style="color:#e74c3c;font-size:13px;">⚠️ Please change your password after your first login for security.</p>
          <br>
          <p style="color:#194341;font-weight:bold;">Warm congratulations,<br>ALIF Scholarship Team</p>
        </div>
        <div style="background:#0D2C2B;padding:16px;text-align:center;">
          <p style="color:#9CA3AF;font-size:12px;margin:0;">© 2026 Alikpea Foundation. True Vine Plaza, 66B Ujoelen Rd, Ekpoma, Edo State.</p>
        </div>
      </div>
    `
  });
}

async function sendRejectionEmail(to, name) {
  if (!process.env.SMTP_USER) return;
  const transporter = getTransporter();
  await transporter.sendMail({
    from: `"Alikpea Foundation" <${FROM}>`,
    to,
    subject: 'Update on Your ALIF Scholarship Application',
    html: `
      <div style="font-family:Inter,sans-serif;max-width:600px;margin:auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
        <div style="background:#194341;padding:24px;text-align:center;">
          <h2 style="color:#FFCD28;margin:0;">Alikpea Foundation</h2>
        </div>
        <div style="padding:32px;">
          <h3 style="color:#194341;">Dear ${name},</h3>
          <p style="color:#5F6973;line-height:1.7;">Thank you for taking the time to apply for the <strong>ALIF Scholarship 2026</strong>. After careful review of all applications, we regret to inform you that your application was <strong>not successful</strong> at this time.</p>
          <p style="color:#5F6973;line-height:1.7;">This decision was not taken lightly. We received many applications and competition was very strong. We want to encourage you to keep striving and apply again in a future cycle.</p>
          <p style="color:#5F6973;line-height:1.7;">If you have any questions, please contact us at <a href="mailto:info@alikpeafoundation.org" style="color:#194341;">info@alikpeafoundation.org</a>.</p>
          <br>
          <p style="color:#194341;font-weight:bold;">Warm regards,<br>ALIF Scholarship Team</p>
        </div>
        <div style="background:#0D2C2B;padding:16px;text-align:center;">
          <p style="color:#9CA3AF;font-size:12px;margin:0;">© 2026 Alikpea Foundation. True Vine Plaza, 66B Ujoelen Rd, Ekpoma, Edo State.</p>
        </div>
      </div>
    `
  });
}

module.exports = { sendConfirmationEmail, sendAcceptanceEmail, sendRejectionEmail };
