const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, default: '' },
    icon: String, // emoji or icon class
    image: String, // category avatar/logo image
    coverImage: String, // category cover/banner image
    color: { type: String, default: '#87CEEB' },
    postCount: { type: Number, default: 0 },
    memberCount: { type: Number, default: 0 },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Category', CategorySchema);
