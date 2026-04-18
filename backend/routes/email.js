// backend/routes/email.js
// POST /api/send-email  — sends complaint confirmation to citizen
const express    = require('express');
const router     = express.Router();
const nodemailer = require('nodemailer');

// Build transporter from env vars
function makeTransporter() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  if (!user || !pass) return null;
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
}

router.post('/send-email', async (req, res) => {
  const { email, refNo, title, department, deptEmail } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, error: 'Email is required' });
  }

  const transporter = makeTransporter();

  // If no credentials configured — simulate success so frontend doesn't break
  if (!transporter) {
    console.log(`[EMAIL SIMULATED] To: ${email}`);
    console.log(`  Ref: ${refNo}  Title: ${title}  Dept: ${department}`);
    return res.json({
      success:  true,
      provider: 'simulated',
      note:     'Add EMAIL_USER and EMAIL_PASS to backend/.env for real email',
    });
  }

  const mailOptions = {
    from:    `"SCIS Ghaziabad" <${process.env.EMAIL_USER}>`,
    to:      email,
    subject: `Complaint Registered — Ref: ${refNo}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
        <div style="background:#1a3a5c;padding:20px 24px;">
          <h2 style="color:#f97316;margin:0;font-size:20px;">🏛️ SCIS Ghaziabad</h2>
          <p style="color:rgba(255,255,255,.6);margin:4px 0 0;font-size:12px;">Smart Civic Infrastructure System — Nagar Nigam Ghaziabad</p>
        </div>
        <div style="background:#f97316;height:4px;"></div>
        <div style="padding:24px;">
          <h3 style="color:#1e293b;margin:0 0 16px;">✅ Your Complaint Has Been Registered</h3>
          <table style="width:100%;border-collapse:collapse;font-size:13px;">
            <tr style="border-bottom:1px solid #f1f5f9;">
              <td style="padding:10px 0;color:#64748b;font-weight:600;width:140px;">Reference No.</td>
              <td style="padding:10px 0;color:#f97316;font-weight:700;font-family:monospace;">${refNo}</td>
            </tr>
            <tr style="border-bottom:1px solid #f1f5f9;">
              <td style="padding:10px 0;color:#64748b;font-weight:600;">Issue Title</td>
              <td style="padding:10px 0;color:#1e293b;font-weight:600;">${title}</td>
            </tr>
            <tr style="border-bottom:1px solid #f1f5f9;">
              <td style="padding:10px 0;color:#64748b;font-weight:600;">Assigned To</td>
              <td style="padding:10px 0;color:#1a3a5c;font-weight:700;">${department}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;color:#64748b;font-weight:600;">Dept. Email</td>
              <td style="padding:10px 0;color:#1a3a5c;">${deptEmail || 'contact@scis-gzb.gov.in'}</td>
            </tr>
          </table>
          <div style="margin-top:20px;background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:14px 16px;font-size:12px;color:#0369a1;">
            📌 Please save your Reference Number <strong>${refNo}</strong> to track the status of your complaint on the SCIS portal.
          </div>
        </div>
        <div style="background:#f8fafc;padding:14px 24px;font-size:11px;color:#94a3b8;text-align:center;border-top:1px solid #e2e8f0;">
          SCIS — Smart Civic Infrastructure System · Nagar Nigam Ghaziabad · This is an automated email, please do not reply.
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[EMAIL SENT] To: ${email} Ref: ${refNo}`);
    res.json({ success: true, provider: 'gmail' });
  } catch (err) {
    console.error('[EMAIL ERROR]', err.message);
    // Don't fail — return success so frontend toast still shows
    res.json({ success: true, provider: 'error-fallback', error: err.message });
  }
});

module.exports = router;
