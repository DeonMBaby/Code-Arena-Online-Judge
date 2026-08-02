const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role:     { type: String, enum: ['user', 'admin'], default: 'user' },
  dob:      { type: Date },
  isVerified: { type: Boolean, default: false },
  verificationToken: { type: String },
  verificationExpiresAt: { type: Date },
  verifiedAt: { type: Date },
  resetPasswordToken: { type: String },
  resetPasswordExpiresAt: { type: Date },
  createdAt:{ type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
