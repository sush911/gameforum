// Quick script to disable MFA for testing
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function disableMFA() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Disable MFA for both admin accounts
    const emails = ['imnumba1@gmail.com', 'sushantshrestha91133@gmail.com'];
    
    for (const email of emails) {
      const user = await User.findOne({ email });
      if (user) {
        user.mfa_enabled = false;
        user.mfa_email_otp = undefined;
        user.mfa_email_otp_expires = undefined;
        await user.save();
        console.log(`✅ MFA disabled for: ${email}`);
      } else {
        console.log(`❌ User not found: ${email}`);
      }
    }

    console.log('\n✅ Done! You can now login without MFA.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

disableMFA();

