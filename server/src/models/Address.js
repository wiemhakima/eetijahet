/**
 * Favorite Address model (client users)
 */
const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  label:     { type: String, required: [true, 'Label is required'], trim: true },
  street:    { type: String, trim: true },
  city:      { type: String, trim: true },
  lat:       { type: Number, required: [true, 'Latitude is required'] },
  lng:       { type: Number, required: [true, 'Longitude is required'] },
  isDefault: { type: Boolean, default: false },
}, {
  timestamps: true,
  collection: 'addresses',
});

addressSchema.index({ user: 1 });

module.exports = mongoose.model('Address', addressSchema);
