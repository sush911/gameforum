const nodemailer = require('nodemailer');

// Create email transporter
const createTransporter = () => {
  // For development, use ethereal email (fake SMTP)
  // For production, use real SMTP like Gmail, SendGrid, etc.
  
  if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    // Real email configuration (Gmail example)
    return nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD // Use app password, not regular password
      }
    });
  } else {
    // Development mode - log to console
    console.log('⚠️  Email not configured. Using console logging for emails.');
    return null;
  }
};

// Send password reset email
const sendPasswordResetEmail = async (email, resetToken, username) => {
  const transporter = createTransporter();
  
  const resetURL = `http://localhost:3001/password-reset?token=${resetToken}`;
  
  const mailOptions = {
    from: process.env.EMAIL_USER || 'noreply@gameforum.com',
    to: email,
    subject: 'Password Reset Request - Game Forum',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6366f1;">Password Reset Request</h2>
        <p>Hey ${username},</p>
        <p>You requested to reset your password. Click the button below to reset it:</p>
        <a href="${resetURL}" style="display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">
          Reset Password
        </a>
        <p>Or copy and paste this link into your browser:</p>
        <p style="color: #666; word-break: break-all;">${resetURL}</p>
        <p><strong>This link expires in 1 hour.</strong></p>
        <p>If you didn't request this, just ignore this email.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
        <p style="color: #999; font-size: 12px;">Game Forum - Secure Gaming Community</p>
      </div>
    `
  };

  if (transporter) {
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('✅ Password reset email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Email send error:', error.message);
      return { success: false, error: error.message };
    }
  } else {
    // Development mode - just log
    console.log('\n📧 ===== PASSWORD RESET EMAIL =====');
    console.log(`To: ${email}`);
    console.log(`Username: ${username}`);
    console.log(`Reset URL: ${resetURL}`);
    console.log(`Token: ${resetToken}`);
    console.log('=====================================\n');
    return { success: true, dev: true };
  }
};

// Send welcome email
const sendWelcomeEmail = async (email, username) => {
  const transporter = createTransporter();
  
  const mailOptions = {
    from: process.env.EMAIL_USER || 'noreply@gameforum.com',
    to: email,
    subject: 'Welcome to Game Forum! 🎮',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6366f1;">Welcome to Game Forum!</h2>
        <p>Hey ${username},</p>
        <p>Thanks for joining our gaming community! 🎮</p>
        <p>You can now:</p>
        <ul>
          <li>Create and share gaming posts</li>
          <li>Comment on discussions</li>
          <li>Customize your profile</li>
          <li>Enable two-factor authentication for extra security</li>
        </ul>
        <a href="http://localhost:3001/dashboard" style="display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">
          Go to Dashboard
        </a>
        <p>Stay secure and have fun!</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
        <p style="color: #999; font-size: 12px;">Game Forum - Secure Gaming Community</p>
      </div>
    `
  };

  if (transporter) {
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('✅ Welcome email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Email send error:', error.message);
      return { success: false, error: error.message };
    }
  } else {
    console.log(`\n📧 Welcome email would be sent to: ${email} (${username})\n`);
    return { success: true, dev: true };
  }
};

module.exports = {
  sendPasswordResetEmail,
  sendWelcomeEmail
};
