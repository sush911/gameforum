const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    squarePaymentId: String,
    stripePaymentId: String,
    stripeCustomerId: String,
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'USD'
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    paymentMethod: {
      type: String,
      enum: ['stripe', 'square', 'card'],
      default: 'stripe'
    },
    description: String,
    metadata: mongoose.Schema.Types.Mixed,
    completedAt: Date,
    refundedAt: Date
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', PaymentSchema);
