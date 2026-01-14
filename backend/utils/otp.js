// Generate random OTP
const generateOTP = (length = 6) => {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
};

// Get OTP expiration time (10 minutes for MFA, 30 minutes for password reset)
const getOTPExpiration = (minutes = 10) => {
  return new Date(Date.now() + minutes * 60 * 1000);
};

module.exports = {
  generateOTP,
  getOTPExpiration
};
