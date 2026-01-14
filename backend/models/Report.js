const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema(
  {
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reportType: { type: String, enum: ['post', 'comment', 'user'], required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
    targetUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: {
      type: String,
      enum: [
        'spam',
        'harassment',
        'hate_speech',
        'misinformation',
        'adult_content',
        'violence',
        'copyright',
        'other'
      ],
      required: true
    },
    description: { type: String, maxlength: 500 },
    status: {
      type: String,
      enum: ['pending', 'investigating', 'resolved', 'dismissed'],
      default: 'pending'
    },
    resolution: String,
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    resolvedAt: Date
  },
  { timestamps: true }
);

module.exports = mongoose.model('Report', ReportSchema);
