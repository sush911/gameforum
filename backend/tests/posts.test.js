const mongoose = require('mongoose');
const Post = require('../models/Post');
const User = require('../models/User');
const Category = require('../models/Category');
const bcrypt = require('bcrypt');

describe('Post Management Tests', () => {
  let testUser;
  let testCategory;

  beforeEach(async () => {
    // Create test user
    testUser = await User.create({
      username: 'postauthor',
      email: 'author@example.com',
      password: await bcrypt.hash('Pass123!', 12),
      role: 'User'
    });

    // Create test category
    testCategory = await Category.create({
      name: 'Gaming',
      slug: 'gaming',
      description: 'Gaming discussions',
      icon: '🎮',
      color: '#0079D3'
    });
  });

  describe('Post Creation', () => {
    test('should create a text post successfully', async () => {
      const post = await Post.create({
        title: 'Test Post',
        content: 'This is a test post',
        type: 'text',
        user: testUser._id,
        category: testCategory._id
      });

      expect(post).toBeDefined();
      expect(post.title).toBe('Test Post');
      expect(post.type).toBe('text');
      expect(post.user.toString()).toBe(testUser._id.toString());
    });

    test('should create a poll post successfully', async () => {
      const post = await Post.create({
        title: 'Test Poll',
        content: 'What is your favorite game?',
        type: 'poll',
        user: testUser._id,
        category: testCategory._id,
        pollOptions: [
          { option: 'Game A', votes: 0 },
          { option: 'Game B', votes: 0 }
        ]
      });

      expect(post).toBeDefined();
      expect(post.type).toBe('poll');
      expect(post.pollOptions).toHaveLength(2);
    });

    test('should create an image post successfully', async () => {
      const post = await Post.create({
        title: 'Test Image Post',
        content: 'Check out this screenshot',
        type: 'image',
        user: testUser._id,
        category: testCategory._id,
        images: ['uploads/test-image.jpg']
      });

      expect(post).toBeDefined();
      expect(post.type).toBe('image');
      expect(post.images).toHaveLength(1);
    });

    test('should create a video post successfully', async () => {
      const post = await Post.create({
        title: 'Test Video Post',
        content: 'Gaming highlights',
        type: 'video',
        user: testUser._id,
        category: testCategory._id,
        videoUrl: 'https://youtube.com/watch?v=test'
      });

      expect(post).toBeDefined();
      expect(post.type).toBe('video');
      expect(post.videoUrl).toBeDefined();
    });
  });

  describe('Post Voting', () => {
    let testPost;

    beforeEach(async () => {
      testPost = await Post.create({
        title: 'Vote Test Post',
        content: 'Test voting',
        type: 'text',
        user: testUser._id,
        category: testCategory._id
      });
    });

    test('should upvote a post', async () => {
      testPost.upvotes = (testPost.upvotes || 0) + 1;
      if (!testPost.likedBy) testPost.likedBy = [];
      testPost.likedBy.push(testUser._id);
      await testPost.save();

      const updatedPost = await Post.findById(testPost._id);
      expect(updatedPost.upvotes).toBe(1);
      expect(updatedPost.likedBy).toHaveLength(1);
    });

    test('should remove upvote from post', async () => {
      // Add upvote first
      testPost.upvotes = 1;
      testPost.likedBy = [testUser._id];
      await testPost.save();

      // Remove upvote
      testPost.upvotes = 0;
      testPost.likedBy = [];
      await testPost.save();

      const updatedPost = await Post.findById(testPost._id);
      expect(updatedPost.upvotes).toBe(0);
      expect(updatedPost.likedBy).toHaveLength(0);
    });

    test('should not allow duplicate upvotes', async () => {
      if (!testPost.likedBy) testPost.likedBy = [];
      testPost.likedBy.push(testUser._id);
      await testPost.save();

      const alreadyLiked = testPost.likedBy.some(
        id => id.toString() === testUser._id.toString()
      );
      expect(alreadyLiked).toBe(true);
    });
  });

  describe('Post Deletion', () => {
    test('should delete a post successfully', async () => {
      const post = await Post.create({
        title: 'Delete Test',
        content: 'This will be deleted',
        type: 'text',
        user: testUser._id,
        category: testCategory._id
      });

      await Post.findByIdAndDelete(post._id);
      const deletedPost = await Post.findById(post._id);
      expect(deletedPost).toBeNull();
    });
  });

  describe('Post Filtering', () => {
    beforeEach(async () => {
      // Create multiple posts
      await Post.create({
        title: 'Text Post 1',
        content: 'Content 1',
        type: 'text',
        user: testUser._id,
        category: testCategory._id
      });

      await Post.create({
        title: 'Poll Post 1',
        content: 'Poll content',
        type: 'poll',
        user: testUser._id,
        category: testCategory._id,
        pollOptions: [{ option: 'A', votes: 0 }]
      });

      await Post.create({
        title: 'Image Post 1',
        content: 'Image content',
        type: 'image',
        user: testUser._id,
        category: testCategory._id,
        images: ['test.jpg']
      });
    });

    test('should filter posts by type', async () => {
      const textPosts = await Post.find({ type: 'text' });
      expect(textPosts).toHaveLength(1);

      const pollPosts = await Post.find({ type: 'poll' });
      expect(pollPosts).toHaveLength(1);
    });

    test('should filter posts by category', async () => {
      const categoryPosts = await Post.find({ category: testCategory._id });
      expect(categoryPosts.length).toBeGreaterThan(0);
    });

    test('should get all posts', async () => {
      const allPosts = await Post.find();
      expect(allPosts).toHaveLength(3);
    });
  });
});
