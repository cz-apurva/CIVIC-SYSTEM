const express = require('express');
const router  = express.Router();
const axios   = require('axios');

// POST /api/send-sms
router.post('/send-sms', async (req, res) => {
  const { phone, refNo, title, department, deptPhone } = req.body;

  if (!phone || !/^\d{10}$/.test(phone)) {
    return res.status(400).json({ success:false, error:'Valid 10-digit phone required' });
  }

  const message =
    `Dear Citizen, your complaint "${title}" has been registered with ` +
    `${department}, Nagar Nigam Ghaziabad. ` +
    `Ref No: ${refNo}. ` +
    `Dept Helpline: ${deptPhone}. ` +
    `Track on SCIS portal. -SCIS GZB`;

  // OPTION 1: Fast2SMS (free — sign up at fast2sms.com)
  if (process.env.FAST2SMS_KEY) {
    try {
      const r = await axios.post('https://www.fast2sms.com/dev/bulkV2',
        { route:'q', message, language:'english', flash:0, numbers:phone },
        { headers:{ authorization:process.env.FAST2SMS_KEY }, timeout:10000 }
      );
      console.log(`[SMS] Sent to +91-${phone} via Fast2SMS`);
      return res.json({ success:true, provider:'fast2sms', refNo, phone });
    } catch(e) { console.error('[SMS Fast2SMS]', e.message); }
  }

  // OPTION 2: MSG91 (production — msg91.com)
  if (process.env.MSG91_KEY) {
    try {
      await axios.post('https://api.msg91.com/api/v5/flow/',
        { flow_id:process.env.MSG91_FLOW_ID, mobiles:'91'+phone, var1:title, var2:department, var3:refNo },
        { headers:{ authkey:process.env.MSG91_KEY, 'Content-Type':'application/json' }, timeout:10000 }
      );
      console.log(`[SMS] Sent to +91-${phone} via MSG91`);
      return res.json({ success:true, provider:'msg91', refNo, phone });
    } catch(e) { console.error('[SMS MSG91]', e.message); }
  }

  // FALLBACK — simulate (log to console)
  console.log(`\n[SMS SIMULATED] +91-${phone}: ${message}\n`);
  return res.json({ success:true, provider:'simulated', refNo, phone, message,
    note:'Add FAST2SMS_KEY to .env for real SMS' });
});

module.exports = router;
