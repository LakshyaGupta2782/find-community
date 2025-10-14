const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
  },
  address: {
    type: String,
  },
  aadhaarNumber: {
    type: String,
  },
   currentLocation: {
    type: String,
  },
  // We will add more fields like currentLocation later
}, { timestamps: true }); // timestamps adds createdAt and updatedAt fields

module.exports = mongoose.model('User', userSchema);