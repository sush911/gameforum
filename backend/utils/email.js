const nodemailer = require('nodemailer');

// Create email transporter
const getTransporter = () => {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      });
      return transporter;
    } catch (err) {
      console.error('Email transporter error:', err.message);
      return null;
    }
  }
  return null;
};

// Send password reset email
const sendPasswordResetEmail = async (email, resetToken, username) => {
  const transporter = getTransporter();
  
  if (!transporter) {
    console.log('\nPassword reset email for:', email, '(Token:', resetToken, ')\n');
    return { success: true, dev: true };
  }

  const resetURL = `http://localhost:3001/password-reset?token=${resetToken}`;
  
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset - GameForum',
      html: `
        <h2>Password Reset Request</h2>
        <p>Hi ${username},</p>
        <p>Click the link below to reset your password:</p>
        <a href="${resetURL}">${resetURL}</a>
        <p>This link expires in 1 hour.</p>
      `
    });
    console.log('Password reset email sent to:', email);
    return { success: true };
  } catch (err) {
    console.error('Email send error:', err.message);
    return { success: false, error: err.message };
  }
};

// Send welcome email
const sendWelcomeEmail = async (email, username) => {
  const transporter = getTransporter();
  
  if (!transporter) {
    console.log('\nWelcome email for:', email, '\n');
    return { success: true, dev: true };
  }

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Welcome to GameForum!',
      html: `
        <h2>Welcome to GameForum!</h2>
        <p>Hi ${username},</p>
        <p>Thanks for joining our gaming community!</p>
      `
    });
    return { success: true };
  } catch (err) {
    console.error('Email send error:', err.message);
    return { success: false, error: err.message };
  }
};

// Send MFA OTP via email
const sendMFAEmail = async (email, otp, username) => {
  const transporter = getTransporter();
  
  if (!transporter) {
    console.log('\nMFA OTP for', email, ':', otp, '\n');
    return { success: true, dev: true };
  }

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your MFA Login Code - GameForum',
      html: `
        <h2>Two-Factor Authentication Code</h2>
        <p>Hi ${username},</p>
        <p>Your login code is:</p>
        <h1 style="font-family: monospace; letter-spacing: 5px;">${otp}</h1>
        <p>This code expires in 10 minutes.</p>
      `
    });
    console.log('MFA email sent to:', email);
    return { success: true };
  } catch (err) {
    console.error('Email send error:', err.message);
    return { success: false, error: err.message };
  }
};

// Send Password Reset OTP via email
const sendPasswordResetOTP = async (email, otp, username) => {
  const transporter = getTransporter();
  
  if (!transporter) {
    console.log('\nPassword Reset OTP for', email, ':', otp, '\n');
    return { success: true, dev: true };
  }

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset Code - GameForum',
      html: `
        <h2>Password Reset Code</h2>
        <p>Hi ${username},</p>
        <p>Your password reset code is:</p>
        <h1 style="font-family: monospace; letter-spacing: 5px;">${otp}</h1>
        <p>This code expires in 30 minutes.</p>
      `
    });
    console.log('Password reset OTP sent to:', email);
    return { success: true };
  } catch (err) {
    console.error('Email send error:', err.message);
    return { success: false, error: err.message };
  }
};

module.exports = {
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendMFAEmail,
  sendPasswordResetOTP
};
