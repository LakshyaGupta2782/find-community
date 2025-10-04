// models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  // Note: We're not storing passwords, only email for login via OTP
  // Store Aadhaar details/document path for verification
  aadhaarData: {
    number: { type: String }, // Placeholder: In a real app, you'd integrate with a government service
    documentUrl: { type: String }, // URL to the uploaded document (e.g., stored on S3 or locally)
  },
  name: { type: String, required: true },
  currentLocation: {
    city: { type: String },
    state: { type: String },
    district: { type: String },
  },
  otp: { type: String },
  otpExpires: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);