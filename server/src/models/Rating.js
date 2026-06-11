const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema(
  {
    delivery: { type: mongoose.Schema.Types.ObjectId, ref: 'Delivery', required: true, unique: true },
    client:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    driver:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    stars:    { type: Number, required: true, min: 1, max: 5 },
    comment:  { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true }
);

ratingSchema.index({ driver: 1, createdAt: -1 });

module.exports = mongoose.model('Rating', ratingSchema);
