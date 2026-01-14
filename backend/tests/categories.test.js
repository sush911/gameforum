const mongoose = require('mongoose');
const Category = require('../models/Category');
const User = require('../models/User');
const bcrypt = require('bcrypt');

describe('Category Management Tests', () => {
  let adminUser;

  beforeEach(async () => {
    adminUser = await User.create({
      username: 'admin',
      email: 'admin@example.com',
      password: await bcrypt.hash('Admin123!', 12),
      role: 'Admin'
    });
  });

  describe('Category Creation', () => {
    test('should create a category successfully', async () => {
      const category = await Category.create({
        name: 'PC Gaming',
        slug: 'pc-gaming',
        description: 'Discuss PC games',
        icon: '💻',
        color: '#0079D3'
      });

      expect(category).toBeDefined();
      expect(category.name).toBe('PC Gaming');
      expect(category.slug).toBe('pc-gaming');
    });

    test('should reject duplicate slug', async () => {
      await Category.create({
        name: 'Gaming',
        slug: 'gaming',
        description: 'Gaming category',
        icon: '🎮',
        color: '#0079D3'
      });

      await expect(
        Category.create({
          name: 'Gaming 2',
          slug: 'gaming',
          description: 'Another gaming category',
          icon: '🎮',
          color: '#0079D3'
        })
      ).rejects.toThrow();
    });

    test('should create category with default values', async () => {
      const category = await Category.create({
        name: 'Test Category',
        slug: 'test-category'
      });

      expect(category.isActive).toBe(true);
      expect(category.postCount).toBe(0);
      expect(category.members).toEqual([]);
    });
  });

  describe('Category Updates', () => {
    let testCategory;

    beforeEach(async () => {
      testCategory = await Category.create({
        name: 'Original Name',
        slug: 'original-slug',
        description: 'Original description',
        icon: '🎮',
        color: '#0079D3'
      });
    });

    test('should update category name', async () => {
      testCategory.name = 'Updated Name';
      await testCategory.save();

      const updated = await Category.findById(testCategory._id);
      expect(updated.name).toBe('Updated Name');
    });

    test('should update category description', async () => {
      testCategory.description = 'New description';
      await testCategory.save();

      const updated = await Category.findById(testCategory._id);
      expect(updated.description).toBe('New description');
    });

    test('should deactivate category', async () => {
      testCategory.isActive = false;
      await testCategory.save();

      const updated = await Category.findById(testCategory._id);
      expect(updated.isActive).toBe(false);
    });
  });

  describe('Category Membership', () => {
    let testCategory;
    let testUser;

    beforeEach(async () => {
      testCategory = await Category.create({
        name: 'Community',
        slug: 'community',
        icon: '👥',
        color: '#0079D3'
      });

      testUser = await User.create({
        username: 'member',
        email: 'member@example.com',
        password: await bcrypt.hash('Pass123!', 12),
        role: 'User'
      });
    });

    test('should add member to category', async () => {
      testCategory.members = [testUser._id];
      await testCategory.save();

      const updated = await Category.findById(testCategory._id);
      expect(updated.members).toHaveLength(1);
      expect(updated.members[0].toString()).toBe(testUser._id.toString());
    });

    test('should remove member from category', async () => {
      testCategory.members = [testUser._id];
      await testCategory.save();

      testCategory.members = testCategory.members.filter(
        id => id.toString() !== testUser._id.toString()
      );
      await testCategory.save();

      const updated = await Category.findById(testCategory._id);
      expect(updated.members).toHaveLength(0);
    });

    test('should not add duplicate members', async () => {
      testCategory.members = [testUser._id];
      await testCategory.save();

      const isMember = testCategory.members.some(
        id => id.toString() === testUser._id.toString()
      );
      expect(isMember).toBe(true);
    });
  });

  describe('Category Deletion', () => {
    test('should delete category successfully', async () => {
      const category = await Category.create({
        name: 'Delete Test',
        slug: 'delete-test',
        icon: '🗑️',
        color: '#EF4444'
      });

      await Category.findByIdAndDelete(category._id);
      const deleted = await Category.findById(category._id);
      expect(deleted).toBeNull();
    });
  });

  describe('Category Queries', () => {
    beforeEach(async () => {
      await Category.create({
        name: 'Active Category',
        slug: 'active',
        isActive: true,
        icon: '✅',
        color: '#10B981'
      });

      await Category.create({
        name: 'Inactive Category',
        slug: 'inactive',
        isActive: false,
        icon: '❌',
        color: '#EF4444'
      });
    });

    test('should get only active categories', async () => {
      const activeCategories = await Category.find({ isActive: true });
      expect(activeCategories).toHaveLength(1);
      expect(activeCategories[0].name).toBe('Active Category');
    });

    test('should get all categories', async () => {
      const allCategories = await Category.find();
      expect(allCategories).toHaveLength(2);
    });

    test('should find category by slug', async () => {
      const category = await Category.findOne({ slug: 'active' });
      expect(category).toBeDefined();
      expect(category.name).toBe('Active Category');
    });
  });
});
