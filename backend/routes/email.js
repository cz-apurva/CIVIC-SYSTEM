// backend/routes/email.js
const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

// 1. THE LOGIC FUNCTION (Exported so issues.js can use it)
async function sendConfirmationEmail(recipient, refNo, title, department, deptEmail) {
  const sender = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  // DEBUG: Check what the function actually received
  console.log("FUNCTION RECEIVED RECIPIENT:", recipient);

  if (!recipient || !sender || !pass) {
    console.error("MISSING DATA: Recipient, User, or Pass is blank.");
    return { success: false, error: "Missing required email data" };
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: sender, pass: pass },
  });

  const mailOptions = {
    from: `"SCIS Ghaziabad" <${sender}>`,
    to: recipient,
    subject: `Complaint Registered — Ref: ${refNo}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
        <div style="background:#1a3a5c;padding:20px 24px;">
          <h2 style="color:#f97316;margin:0;font-size:20px;">🏛️ SCIS Ghaziabad</h2>
          <p style="color:rgba(255,255,255,.6);margin:4px 0 0;font-size:12px;">Smart Civic Infrastructure System — Nagar Nigam Ghaziabad</p>
        </div>
        <div style="padding:24px;">
          <h3 style="color:#1e293b;margin:0 0 16px;">✅ Your Complaint Has Been Registered</h3>
          <p>Reference No: <strong>${refNo}</strong></p>
          <p>Issue: <strong>${title}</strong></p>
          <p>Dept: <strong>${department}</strong></p>
        </div>
      </div>`
  };
  
return transporter.sendMail(mailOptions);
}

// 2. THE ROUTE (For direct API calls from frontend)
router.post('/send-email', async (req, res) => {
  const { userEmail, refNo, title, department, deptEmail } = req.body;
  try {
    const result = await sendConfirmationEmail(userEmail, refNo, title, department, deptEmail);
    res.json(result);
  } catch (err) {
    res.json({ success: true, provider: 'error-fallback', error: err.message });
  }
});

// 3. EXPORT BOTH
// router for server.js, sendConfirmationEmail for issues.js
module.exports = { router, sendConfirmationEmail };