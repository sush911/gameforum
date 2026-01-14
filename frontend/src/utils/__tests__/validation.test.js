import '@testing-library/jest-dom';

// Validation utility functions
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isStrongPassword = (password) => {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[!@#$%^&*]/.test(password)
  );
};

const isValidUsername = (username) => {
  return username.length >= 3 && username.length <= 30 && /^[a-zA-Z0-9_]+$/.test(username);
};

describe('Validation Utilities', () => {
  describe('Email Validation', () => {
    test('should validate correct email', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
    });

    test('should reject invalid email', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('test@.com')).toBe(false);
    });
  });

  describe('Password Validation', () => {
    test('should validate strong password', () => {
      expect(isStrongPassword('Pass123!')).toBe(true);
      expect(isStrongPassword('MyP@ssw0rd')).toBe(true);
      expect(isStrongPassword('Secure#123')).toBe(true);
    });

    test('should reject weak password', () => {
      expect(isStrongPassword('weak')).toBe(false);
      expect(isStrongPassword('password')).toBe(false);
      expect(isStrongPassword('12345678')).toBe(false);
      expect(isStrongPassword('Password')).toBe(false);
      expect(isStrongPassword('Password123')).toBe(false);
    });

    test('should require minimum 8 characters', () => {
      expect(isStrongPassword('Pass1!')).toBe(false);
      expect(isStrongPassword('Pass12!@')).toBe(true);
    });

    test('should require uppercase letter', () => {
      expect(isStrongPassword('pass123!')).toBe(false);
      expect(isStrongPassword('Pass123!')).toBe(true);
    });

    test('should require lowercase letter', () => {
      expect(isStrongPassword('PASS123!')).toBe(false);
      expect(isStrongPassword('Pass123!')).toBe(true);
    });

    test('should require number', () => {
      expect(isStrongPassword('Password!')).toBe(false);
      expect(isStrongPassword('Pass123!')).toBe(true);
    });

    test('should require special character', () => {
      expect(isStrongPassword('Password123')).toBe(false);
      expect(isStrongPassword('Pass123!')).toBe(true);
    });
  });

  describe('Username Validation', () => {
    test('should validate correct username', () => {
      expect(isValidUsername('user123')).toBe(true);
      expect(isValidUsername('test_user')).toBe(true);
      expect(isValidUsername('JohnDoe')).toBe(true);
    });

    test('should reject username too short', () => {
      expect(isValidUsername('ab')).toBe(false);
    });

    test('should reject username too long', () => {
      expect(isValidUsername('a'.repeat(31))).toBe(false);
    });

    test('should reject username with special characters', () => {
      expect(isValidUsername('user@123')).toBe(false);
      expect(isValidUsername('user-name')).toBe(false);
      expect(isValidUsername('user.name')).toBe(false);
    });

    test('should accept username with underscores', () => {
      expect(isValidUsername('user_name')).toBe(true);
    });
  });
});
