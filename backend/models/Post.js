const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    title: { type: String, required: true },
    content: { type: String, required: true },
    type: { type: String, enum: ['text', 'image', 'video', 'link', 'file', 'poll', 'blog'], default: 'text' },
    
    // Media fields
    images: [String], // Array of image URLs
    videoUrl: String, // Video URL or uploaded video path
    linkUrl: String, // External link
    linkTitle: String,
    linkDescription: String,
    
    // File attachments (mods, etc)
    files: [{
      url: String,
      name: String,
      size: Number
    }],
    
    // Poll fields
    pollOptions: [{
      text: String,
      votes: { type: Number, default: 0 },
      votedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
    }],
    pollEndsAt: Date,
    pollAllowMultiple: { type: Boolean, default: false },
    
    // Article/Blog fields
    excerpt: String,
    readTime: Number, // in minutes
    
    // Engagement
    viewCount: { type: Number, default: 0 },
    upvotes: { type: Number, default: 0 },
    downvotes: { type: Number, default: 0 },
    likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    votedBy: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      vote: { type: String, enum: ['up', 'down'] }
    }],
    
    // Status
    published: { type: Boolean, default: true },
    isPinned: { type: Boolean, default: false },
    isLocked: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Post', PostSchema);
