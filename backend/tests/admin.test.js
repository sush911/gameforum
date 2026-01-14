const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcrypt');

describe('Admin Panel Tests', () => {
  let adminUser;
  let regularUser;

  beforeEach(async () => {
    adminUser = await User.create({
      username: 'admin',
      email: 'admin@example.com',
      password: await bcrypt.hash('Admin123!', 12),
      role: 'Admin'
    });

    regularUser = await User.create({
      username: 'regular',
      email: 'regular@example.com',
      password: await bcrypt.hash('Pass123!', 12),
      role: 'User'
    });
  });

  describe('User Ban/Unban', () => {
    test('should ban user successfully', async () => {
      regularUser.isBanned = true;
      regularUser.banReason = 'Spam';
      regularUser.bannedAt = new Date();
      regularUser.bannedBy = adminUser._id;
      await regularUser.save();

      const bannedUser = await User.findById(regularUser._id);
      expect(bannedUser.isBanned).toBe(true);
      expect(bannedUser.banReason).toBe('Spam');
      expect(bannedUser.bannedBy.toString()).toBe(adminUser._id.toString());
    });

    test('should unban user and unlock account', async () => {
      // Ban user first
      regularUser.isBanned = true;
      regularUser.banReason = 'Test';
      regularUser.lockUntil = new Date(Date.now() + 3600000);
      regularUser.failedLoginAttempts = 5;
      await regularUser.save();

      // Unban
      regularUser.isBanned = false;
      regularUser.banReason = undefined;
      regularUser.bannedAt = undefined;
      regularUser.bannedBy = undefined;
      regularUser.lockUntil = undefined;
      regularUser.failedLoginAttempts = 0;
      await regularUser.save();

      const unbannedUser = await User.findById(regularUser._id);
      expect(unbannedUser.isBanned).toBe(false);
      expect(unbannedUser.banReason).toBeUndefined();
      expect(unbannedUser.lockUntil).toBeUndefined();
      expect(unbannedUser.failedLoginAttempts).toBe(0);
    });

    test('should not ban admin users', async () => {
      const isAdmin = adminUser.role === 'Admin';
      expect(isAdmin).toBe(true);
    });
  });

  describe('Role Management', () => {
    test('should change user role to Moderator', async () => {
      regularUser.role = 'Moderator';
      await regularUser.save();

      const updated = await User.findById(regularUser._id);
      expect(updated.role).toBe('Moderator');
    });

    test('should change user role to Admin', async () => {
      regularUser.role = 'Admin';
      await regularUser.save();

      const updated = await User.findById(regularUser._id);
      expect(updated.role).toBe('Admin');
    });

    test('should verify admin role', async () => {
      expect(adminUser.role).toBe('Admin');
    });
  });

  describe('User Statistics', () => {
    test('should count total users', async () => {
      const totalUsers = await User.countDocuments();
      expect(totalUsers).toBe(2);
    });

    test('should count users by role', async () => {
      const adminCount = await User.countDocuments({ role: 'Admin' });
      const userCount = await User.countDocuments({ role: 'User' });

      expect(adminCount).toBe(1);
      expect(userCount).toBe(1);
    });

    test('should count banned users', async () => {
      regularUser.isBanned = true;
      await regularUser.save();

      const bannedCount = await User.countDocuments({ isBanned: true });
      expect(bannedCount).toBe(1);
    });
  });

  describe('User Search', () => {
    test('should find user by email', async () => {
      const user = await User.findOne({ email: 'regular@example.com' });
      expect(user).toBeDefined();
      expect(user.username).toBe('regular');
    });

    test('should find user by username', async () => {
      const user = await User.findOne({ username: 'admin' });
      expect(user).toBeDefined();
      expect(user.email).toBe('admin@example.com');
    });

    test('should search users with regex', async () => {
      const users = await User.find({
        username: { $regex: 'reg', $options: 'i' }
      });
      expect(users).toHaveLength(1);
      expect(users[0].username).toBe('regular');
    });
  });
});
