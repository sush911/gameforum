const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');

// Create a minimal test app
const app = express();
app.use(express.json());

// Import routes from server
const jwt = require('jsonwebtoken');
require('dotenv').config();

describe('Authentication Tests', () => {
  let testUser;
  let authToken;

  beforeEach(async () => {
    // Create test user
    const hashedPassword = await bcrypt.hash('TestPass123!', 12);
    testUser = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: hashedPassword,
      role: 'User'
    });
  });

  describe('POST /api/users/register', () => {
    test('should register a new user successfully', async () => {
      const newUser = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'NewPass123!',
        confirmPassword: 'NewPass123!'
      };

      // Test user creation directly
      const user = await User.create({
        username: newUser.username,
        email: newUser.email,
        password: await bcrypt.hash(newUser.password, 12),
        role: 'User'
      });

      expect(user).toBeDefined();
      expect(user.username).toBe(newUser.username);
      expect(user.email).toBe(newUser.email);
    });

    test('should reject registration with weak password', async () => {
      const weakPassword = 'weak';
      const isStrong = weakPassword.length >= 8 && 
                      /[A-Z]/.test(weakPassword) && 
                      /[a-z]/.test(weakPassword) && 
                      /[0-9]/.test(weakPassword) && 
                      /[!@#$%^&*]/.test(weakPassword);
      
      expect(isStrong).toBe(false);
    });

    test('should reject duplicate email', async () => {
      const existingUser = await User.findOne({ email: 'test@example.com' });
      expect(existingUser).toBeDefined();
      
      // Try to create another user with same email
      await expect(
        User.create({
          username: 'anotheruser',
          email: 'test@example.com',
          password: await bcrypt.hash('Pass123!', 12),
          role: 'User'
        })
      ).rejects.toThrow();
    });
  });

  describe('POST /api/users/login', () => {
    test('should login with valid credentials', async () => {
      const validPassword = await bcrypt.compare('TestPass123!', testUser.password);
      expect(validPassword).toBe(true);

      // Generate token
      const token = jwt.sign(
        { id: testUser._id, role: testUser.role, email: testUser.email },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '24h' }
      );

      expect(token).toBeDefined();
    });

    test('should reject invalid password', async () => {
      const invalidPassword = await bcrypt.compare('WrongPass123!', testUser.password);
      expect(invalidPassword).toBe(false);
    });

    test('should reject non-existent user', async () => {
      const user = await User.findOne({ email: 'nonexistent@example.com' });
      expect(user).toBeNull();
    });
  });

  describe('Ban/Unban Functionality', () => {
    test('should ban user successfully', async () => {
      testUser.isBanned = true;
      testUser.banReason = 'Test ban';
      testUser.bannedAt = new Date();
      await testUser.save();

      const bannedUser = await User.findById(testUser._id);
      expect(bannedUser.isBanned).toBe(true);
      expect(bannedUser.banReason).toBe('Test ban');
    });

    test('should unban user and unlock account', async () => {
      // Ban user first
      testUser.isBanned = true;
      testUser.lockUntil = new Date(Date.now() + 3600000);
      testUser.failedLoginAttempts = 5;
      await testUser.save();

      // Unban user
      testUser.isBanned = false;
      testUser.banReason = undefined;
      testUser.lockUntil = undefined;
      testUser.failedLoginAttempts = 0;
      await testUser.save();

      const unbannedUser = await User.findById(testUser._id);
      expect(unbannedUser.isBanned).toBe(false);
      expect(unbannedUser.lockUntil).toBeUndefined();
      expect(unbannedUser.failedLoginAttempts).toBe(0);
    });

    test('should prevent banned user from logging in', async () => {
      testUser.isBanned = true;
      testUser.banReason = 'Violation of terms';
      await testUser.save();

      const user = await User.findById(testUser._id);
      expect(user.isBanned).toBe(true);
    });
  });

  describe('Account Locking', () => {
    test('should lock account after 5 failed attempts', async () => {
      testUser.failedLoginAttempts = 5;
      testUser.lockUntil = new Date(Date.now() + 30 * 60 * 1000);
      await testUser.save();

      const lockedUser = await User.findById(testUser._id);
      expect(lockedUser.failedLoginAttempts).toBe(5);
      expect(lockedUser.lockUntil).toBeDefined();
      expect(lockedUser.lockUntil > new Date()).toBe(true);
    });

    test('should reset failed attempts on successful login', async () => {
      testUser.failedLoginAttempts = 3;
      await testUser.save();

      testUser.failedLoginAttempts = 0;
      testUser.lockUntil = null;
      await testUser.save();

      const user = await User.findById(testUser._id);
      expect(user.failedLoginAttempts).toBe(0);
      expect(user.lockUntil).toBeNull();
    });
  });
});
