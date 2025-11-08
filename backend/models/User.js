const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    default: 'other',
  },
  state: {
    type: String,
  },
  district: {
    type: String,
  },
  pincode: {
    type: String,
  },
  address: {
    type: String,
  },
  currentLocation: {
    type: String,
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);


// const mongoose = require('mongoose');

// const userSchema = new mongoose.Schema({
//   email: {
//     type: String,
//     required: true,
//     unique: true,
//   },
//   name: {
//     type: String,
//   },
//   address: {
//     type: String,
//   },
//   aadhaarNumber: {
//     type: String,
//   },
//    currentLocation: {
//     type: String,
//   },
//   // We will add more fields like currentLocation later
// }, { timestamps: true }); // timestamps adds createdAt and updatedAt fields

// module.exports = mongoose.model('User', userSchema);