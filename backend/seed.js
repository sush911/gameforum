const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

const User = require('./models/User');
const Category = require('./models/Category');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

const seedData = async () => {
  try {
    await connectDB();
    
    // Create admin account with requested credentials
    const existingAdmin = await User.findOne({ 
      $or: [
        { email: 'sushantshrestha91133@gmail.com' },
        { username: 'sushant' }
      ]
    });
    
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('Admin123!', 12);
      
      const admin = await User.create({
        username: 'sushant',
        email: 'sushantshrestha91133@gmail.com',
        password: hashedPassword,
        role: 'Admin',
        bio: 'Forum Administrator & Gaming Enthusiast',
        passwordHistory: [{ password: hashedPassword, changedAt: new Date() }],
        passwordExpiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        lastPasswordChange: new Date(),
        isVerified: true
      });
      
      console.log('Admin account created');
      console.log('Email: sushantshrestha91133@gmail.com');
      console.log('Username: sushant');
      console.log('   Password: Admin123!');
      console.log('   Role: Admin');
    } else {
      // Update existing user to Admin
      await User.findByIdAndUpdate(existingAdmin._id, { 
        role: 'Admin',
        username: 'sushant',
        email: 'sushantshrestha91133@gmail.com'
      });
      console.log('Updated existing user to Admin');
      console.log('Username: sushant');
      console.log('Email: sushantshrestha91133@gmail.com');
    }
    
    // Create gaming categories
    const categories = [
      {
        name: 'General Discussion',
        slug: 'general',
        description: 'Talk about anything gaming related',
        icon: '💬',
        color: '#6366f1',
        order: 1
      },
      {
        name: 'PC Gaming',
        slug: 'pc-gaming',
        description: 'PC games, hardware, and setups',
        icon: '🖥️',
        color: '#8b5cf6',
        order: 2
      },
      {
        name: 'Console Gaming',
        slug: 'console',
        description: 'PlayStation, Xbox, Nintendo discussions',
        icon: '🎮',
        color: '#ec4899',
        order: 3
      },
      {
        name: 'Mobile Gaming',
        slug: 'mobile',
        description: 'Mobile games and apps',
        icon: '📱',
        color: '#14b8a6',
        order: 4
      },
      {
        name: 'Esports',
        slug: 'esports',
        description: 'Competitive gaming and tournaments',
        icon: '🏆',
        color: '#f59e0b',
        order: 5
      },
      {
        name: 'Game Reviews',
        slug: 'reviews',
        description: 'Share your game reviews and ratings',
        icon: '⭐',
        color: '#10b981',
        order: 6
      },
      {
        name: 'Gaming News',
        slug: 'news',
        description: 'Latest gaming news and updates',
        icon: '📰',
        color: '#3b82f6',
        order: 7
      },
      {
        name: 'Tech & Hardware',
        slug: 'tech',
        description: 'Gaming hardware, peripherals, and tech',
        icon: '⚙️',
        color: '#6b7280',
        order: 8
      },
      {
        name: 'Streaming & Content',
        slug: 'streaming',
        description: 'Streaming, YouTube, and content creation',
        icon: '📹',
        color: '#ef4444',
        order: 9
      },
      {
        name: 'Looking for Group',
        slug: 'lfg',
        description: 'Find teammates and gaming buddies',
        icon: '👥',
        color: '#a855f7',
        order: 10
      }
    ];
    
    for (const cat of categories) {
      const existing = await Category.findOne({ slug: cat.slug });
      if (!existing) {
        await Category.create(cat);
        console.log('Created category:', cat.name);
      }
    }
    
    console.log('\nSeed data completed successfully!');
    console.log('\nYou can now login with:');
    console.log('Email: imnumba1@gmail.com');
    console.log('Password: Admin123!');
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err);
    process.exit(1);
  }
};

seedData();
